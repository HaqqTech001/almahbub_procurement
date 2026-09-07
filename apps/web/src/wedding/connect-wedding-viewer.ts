import type { WeddingBroadcastFeed } from "@hamd/constants";

type RemotePub = {
  kind?: string;
  source?: string;
  isSubscribed?: boolean;
  setSubscribed?: (value: boolean) => Promise<void> | void;
  setVideoQuality?: (value: number) => void;
  setVideoDimensions?: (value: { width: number; height: number }) => void;
  videoTrack?: { attach: (el: HTMLMediaElement) => void; detach: () => void; mediaStreamTrack?: MediaStreamTrack };
  audioTrack?: { attach: (el: HTMLMediaElement) => void; detach: () => void };
  track?: { kind?: string; attach: (el: HTMLMediaElement) => void; detach?: () => void; mediaStreamTrack?: MediaStreamTrack };
};

type RemoteParticipant = {
  identity: string;
  name?: string;
  metadata?: string;
  videoTrackPublications?: Map<string, RemotePub>;
  audioTrackPublications?: Map<string, RemotePub>;
  trackPublications?: Map<string, RemotePub>;
};

type LiveKitRoom = {
  connect: (url: string, token: string) => Promise<unknown>;
  disconnect: (stopTracks?: boolean) => void;
  on: (event: string, handler: (...args: never[]) => void) => void;
  startAudio?: () => Promise<void>;
  remoteParticipants: Map<string, RemoteParticipant>;
};

export type ViewerQualityChoice = "auto" | "1080p" | "720p" | "360p";

export type WeddingLiveSession = {
  disconnect: () => void;
  startAudio: () => Promise<void>;
  setSelectedIdentity: (identity: string) => Promise<void>;
  setQuality: (choice: ViewerQualityChoice) => void;
  selectedIdentity: () => string | null;
  received: () => { width: number; height: number; quality: ViewerQualityChoice };
};

function feedFromParticipant(participant: RemoteParticipant): WeddingBroadcastFeed | null {
  if (!participant.identity.startsWith("host:")) return null;
  let label = participant.name?.trim() || "Main Stage";
  try {
    const meta = participant.metadata ? (JSON.parse(participant.metadata) as { label?: string }) : {};
    if (meta.label) label = meta.label;
  } catch {
    /* keep name */
  }
  return {
    feedId: participant.identity,
    identity: participant.identity,
    label,
    primary: false,
    status: "live",
  };
}

function publications(participant: RemoteParticipant): RemotePub[] {
  if (participant.trackPublications) return [...participant.trackPublications.values()];
  return [
    ...[...(participant.videoTrackPublications?.values() ?? [])],
    ...[...(participant.audioTrackPublications?.values() ?? [])],
  ];
}

export async function connectWeddingViewer(input: {
  url: string;
  token: string;
  video: HTMLVideoElement | null;
  onReconnecting: (active: boolean) => void;
  onFeeds?: (feeds: WeddingBroadcastFeed[]) => void;
  onSelectedLost?: () => void;
  primaryIdentity?: string | null;
  quality?: ViewerQualityChoice;
}): Promise<WeddingLiveSession> {
  let selected: string | null = null;
  let quality: ViewerQualityChoice = input.quality ?? "auto";
  let received = { width: 0, height: 0, quality };

  const livekit = await import("livekit-client");
  const VideoQuality = (livekit as { VideoQuality?: { HIGH: number; MEDIUM: number; LOW: number } }).VideoQuality ?? {
    HIGH: 2,
    MEDIUM: 1,
    LOW: 0,
  };
  const room = new livekit.Room({
    adaptiveStream: true,
    dynacast: true,
    disconnectOnPageLeave: true,
  }) as unknown as LiveKitRoom;

  const emitFeeds = () => {
    const rows = [...room.remoteParticipants.values()]
      .map(feedFromParticipant)
      .filter((row): row is WeddingBroadcastFeed => Boolean(row));
    if (input.primaryIdentity) {
      for (const row of rows) row.primary = row.identity === input.primaryIdentity;
    }
    input.onFeeds?.(rows);
    return rows;
  };

  const applySubscriptions = async () => {
    const node = input.video;
    const feeds = emitFeeds();
    if (!selected || !feeds.some((row) => row.identity === selected)) {
      selected =
        feeds.find((row) => row.primary)?.identity ??
        feeds[0]?.identity ??
        null;
    }
    for (const participant of room.remoteParticipants.values()) {
      const isSelected = participant.identity === selected;
      for (const pub of publications(participant)) {
        const kind = pub.kind ?? pub.track?.kind;
        if (kind === "video" || pub.videoTrack) {
          if (isSelected) {
            await pub.setSubscribed?.(true);
            if (quality === "auto") {
              if (node) {
                const width = Math.round(node.getBoundingClientRect().width);
                const height = Math.round(node.getBoundingClientRect().height);
                if (width >= 2 && height >= 2) pub.setVideoDimensions?.({ width, height });
              }
            } else if (quality === "1080p") pub.setVideoQuality?.(VideoQuality.HIGH);
            else if (quality === "720p") pub.setVideoQuality?.(VideoQuality.MEDIUM);
            else pub.setVideoQuality?.(VideoQuality.LOW);
            const track = pub.videoTrack ?? (pub.track?.kind === "video" ? pub.track : undefined);
            if (track && node) track.attach(node);
            const settings = track?.mediaStreamTrack?.getSettings?.();
            received = {
              width: Math.round(settings?.width ?? 0),
              height: Math.round(settings?.height ?? 0),
              quality,
            };
          } else {
            await pub.setSubscribed?.(false);
          }
        }
        if (kind === "audio" || pub.audioTrack) {
          await pub.setSubscribed?.(isSelected);
          const track = pub.audioTrack ?? (pub.track?.kind === "audio" ? pub.track : undefined);
          if (track && node && isSelected) track.attach(node);
        }
      }
    }
    if (!selected && feeds.length === 0) input.onSelectedLost?.();
  };

  room.on("trackSubscribed", (() => {
    void applySubscriptions();
  }) as (...args: never[]) => void);
  room.on("trackUnsubscribed", (() => {
    void applySubscriptions();
  }) as (...args: never[]) => void);
  room.on("participantConnected", (() => {
    void applySubscriptions();
  }) as (...args: never[]) => void);
  room.on("participantDisconnected", (() => {
    void applySubscriptions();
  }) as (...args: never[]) => void);
  room.on("reconnecting", (() => input.onReconnecting(true)) as (...args: never[]) => void);
  room.on("reconnected", (() => {
    input.onReconnecting(false);
    void applySubscriptions();
  }) as (...args: never[]) => void);

  await room.connect(input.url, input.token);
  await applySubscriptions();

  return {
    disconnect: () => {
      void room.disconnect(true);
    },
    startAudio: async () => {
      await room.startAudio?.();
    },
    setSelectedIdentity: async (identity: string) => {
      selected = identity;
      await applySubscriptions();
    },
    setQuality: (choice) => {
      quality = choice;
      void applySubscriptions();
    },
    selectedIdentity: () => selected,
    received: () => received,
  };
}
