import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialog } from "@hamd/ui/primitives";
import {
  DEFAULT_WEDDING_CAMPAIGN,
  WEDDING_FEED_LABELS,
  formatWeddingCaptureLabel,
  type WeddingBroadcastFeed,
  type WeddingCampaignRecord,
  type WeddingCaptureChoice,
} from "@hamd/constants";

import { OpsAlert } from "../../components/OpsChrome.js";
import { OpsApiError, opsFetch } from "../../lib/ops-fetch.js";
import { createWeddingHostTracks, type WeddingCaptureReport } from "./create-wedding-host-tracks.js";
import { WeddingViewersDrawer, type WeddingGuestRow } from "./WeddingViewersDrawer.js";
import {
  clearPreviewElement,
  disconnectWeddingHostRoom,
  stopOwnedTracks,
} from "./release-wedding-media.js";

type LocalTrack = {
  kind: string;
  stop: () => void;
  attach: (el: HTMLMediaElement) => void;
  detach: () => void;
  mute: () => Promise<void> | void;
  unmute: () => Promise<void> | void;
  mediaStreamTrack?: MediaStreamTrack;
};

type LiveKitRoom = {
  connect: (url: string, token: string) => Promise<unknown>;
  disconnect: (stop?: boolean) => Promise<void> | void;
  on?: (event: string, handler: (...args: never[]) => void) => void;
  switchActiveDevice?: (kind: "videoinput" | "audioinput", deviceId: string) => Promise<unknown>;
  localParticipant: {
    publishTrack: (track: LocalTrack, options?: object) => Promise<unknown>;
    setCameraEnabled?: (enabled: boolean) => Promise<void>;
    setMicrophoneEnabled?: (enabled: boolean) => Promise<void>;
  };
};

type Props = {
  accessToken: () => Promise<string>;
  campaign: WeddingCampaignRecord;
  configured: boolean;
  viewers: number;
  onCampaign: (row: WeddingCampaignRecord) => void;
  testEnabled?: boolean;
  studio?: boolean;
  onExitStudio?: () => void;
  onStay?: () => void;
  leaveSignal?: number;
};

export function WeddingBroadcastPanel({
  accessToken,
  campaign,
  configured,
  viewers,
  onCampaign,
  testEnabled = false,
  studio = false,
  onExitStudio,
  onStay,
  leaveSignal = 0,
}: Props) {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<LiveKitRoom | null>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
  const tokenLock = useRef(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [quality, setQuality] = useState<WeddingCaptureChoice>("fhd");
  const [feedLabel, setFeedLabel] = useState("Main Stage");
  const [capture, setCapture] = useState<WeddingCaptureReport | null>(null);
  const [publishOptions, setPublishOptions] = useState<object>({});
  const [connection, setConnection] = useState<"Excellent" | "Good" | "Poor" | "Unknown">("Unknown");
  const [qualityWarn, setQualityWarn] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [guests, setGuests] = useState<WeddingGuestRow[]>([]);
  const live = campaign.streamStatus === "live";
  const testLive = live && campaign.liveMode === "test";
  const feeds = (campaign.feeds ?? []) as WeddingBroadcastFeed[];

  useEffect(() => {
    if (leaveSignal) setConfirmLeave(true);
  }, [leaveSignal]);

  const releaseAll = useCallback(async () => {
    await disconnectWeddingHostRoom(roomRef.current);
    roomRef.current = null;
    stopOwnedTracks(tracksRef.current);
    tracksRef.current = [];
    clearPreviewElement(previewRef.current);
  }, []);

  useEffect(() => {
    return () => {
      void releaseAll();
    };
  }, [releaseAll]);

  useEffect(() => {
    if (!live) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "The broadcast is still live.";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [live]);

  const attachPreview = (tracks: LocalTrack[]) => {
    const video = tracks.find((track) => track.kind === "video");
    if (video && previewRef.current) video.attach(previewRef.current);
  };

  const createPreviewTracks = async (nextCameraId = cameraId, nextMicId = micId) => {
    const livekit = await import("livekit-client");
    stopOwnedTracks(tracksRef.current);
    tracksRef.current = [];
    const created = await createWeddingHostTracks({
      livekit: livekit as never,
      quality,
      cameraId: nextCameraId,
      micId: nextMicId,
    });
    tracksRef.current = created.tracks;
    setPublishOptions(created.publish);
    setCapture(created.capture);
    attachPreview(created.tracks);
    setDevices(await navigator.mediaDevices.enumerateDevices());
  };

  const applyMediaEnabled = async (nextCamera: boolean, nextMic: boolean) => {
    const room = roomRef.current;
    if (room?.localParticipant.setCameraEnabled) {
      await room.localParticipant.setCameraEnabled(nextCamera);
    } else {
      const video = tracksRef.current.find((track) => track.kind === "video");
      if (video) {
        if (nextCamera) await video.unmute();
        else await video.mute();
      }
    }
    if (room?.localParticipant.setMicrophoneEnabled) {
      await room.localParticipant.setMicrophoneEnabled(nextMic);
    } else {
      const audio = tracksRef.current.find((track) => track.kind === "audio");
      if (audio) {
        if (nextMic) await audio.unmute();
        else await audio.mute();
      }
    }
  };

  const changeDevice = async (kind: "videoinput" | "audioinput", deviceId: string) => {
    if (kind === "videoinput") setCameraId(deviceId);
    else setMicId(deviceId);
    const room = roomRef.current;
    if (room?.switchActiveDevice && deviceId) {
      await room.switchActiveDevice(kind, deviceId);
      return;
    }
    if (tracksRef.current.length === 0 && !live) return;
    await createPreviewTracks(
      kind === "videoinput" ? deviceId : cameraId,
      kind === "audioinput" ? deviceId : micId,
    );
    if (room) {
      for (const track of tracksRef.current) {
        await room.localParticipant.publishTrack(track);
      }
    }
  };

  const startLive = async (mode: "test" | "production") => {
    if (!configured || tokenLock.current) return;
    tokenLock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (tracksRef.current.length === 0) await createPreviewTracks();
      const access = await accessToken();
      const session = await opsFetch<{ url: string; serverUrl?: string; token: string }>("/wedding/live/token", {
        method: "POST",
        accessToken: access,
        body: { role: "host", mode, feedLabel },
      });
      const livekit = await import("livekit-client");
      await disconnectWeddingHostRoom(roomRef.current);
      const room = new livekit.Room({
        adaptiveStream: false,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: capture?.requestedWidth ?? 1920, height: capture?.requestedHeight ?? 1080, frameRate: 30 },
        },
        publishDefaults: {
          simulcast: true,
          ...publishOptions,
        },
      }) as unknown as LiveKitRoom;
      roomRef.current = room;
      room.on?.("connectionQualityChanged", ((value: string, participant?: { isLocal?: boolean }) => {
        if (participant && participant.isLocal === false) return;
        const next = String(value).toLowerCase();
        if (next.includes("excel")) setConnection("Excellent");
        else if (next.includes("good")) setConnection("Good");
        else if (next.includes("poor") || next.includes("lost")) {
          setConnection("Poor");
          setQualityWarn(true);
        }
      }) as (...args: never[]) => void);
      await room.connect(session.serverUrl ?? session.url, session.token);
      for (const track of tracksRef.current) {
        await room.localParticipant.publishTrack(track, publishOptions);
      }
      await applyMediaEnabled(cameraOn, micOn);
      const row = await opsFetch<WeddingCampaignRecord>("/wedding/live/start", {
        method: "POST",
        accessToken: access,
        body: {
          mode,
          feedLabel,
          captureWidth: capture?.width,
          captureHeight: capture?.height,
          captureFps: capture?.frameRate,
        },
      });
      onCampaign({ ...DEFAULT_WEDDING_CAMPAIGN, ...row });
    } catch (err) {
      await releaseAll();
      if (err instanceof OpsApiError && err.status === 503) {
        setError("Configure the LiveKit connection before starting a broadcast.");
      } else {
        setError("We couldn't connect to the live-streaming service.");
      }
    } finally {
      tokenLock.current = false;
      setBusy(false);
    }
  };

  const endLive = async () => {
    setBusy(true);
    setError(null);
    try {
      const access = await accessToken();
      const row = await opsFetch<WeddingCampaignRecord>("/wedding/live/end", {
        method: "POST",
        accessToken: access,
        body: {},
      });
      onCampaign({ ...DEFAULT_WEDDING_CAMPAIGN, ...row });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The broadcast could not be marked ended.");
    } finally {
      await releaseAll();
      setCameraOn(false);
      setMicOn(false);
      setConfirmEnd(false);
      setConfirmLeave(false);
      setBusy(false);
    }
  };

  const stopMyBroadcast = async () => {
    setBusy(true);
    try {
      const access = await accessToken();
      const row = await opsFetch<WeddingCampaignRecord>("/wedding/live/stop-feed", {
        method: "POST",
        accessToken: access,
        body: {},
      });
      onCampaign({ ...DEFAULT_WEDDING_CAMPAIGN, ...row });
    } catch (err) {
      setError(err instanceof Error ? err.message : "This broadcast could not be stopped.");
    } finally {
      await releaseAll();
      setCameraOn(false);
      setMicOn(false);
      setCapture(null);
      setBusy(false);
    }
  };

  const closePreview = () => {
    if (live) return;
    stopOwnedTracks(tracksRef.current);
    tracksRef.current = [];
    clearPreviewElement(previewRef.current);
    setCapture(null);
  };

  const requestExitStudio = () => {
    if (onExitStudio) {
      onExitStudio();
      return;
    }
    if (live) {
      setConfirmLeave(true);
      return;
    }
    navigate("/wedding");
  };
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className={studio ? "hamd-wedding-studio" : undefined}>
      {studio ? (
        <header className="hamd-wedding-studio__header">
          <div>
            <p className="hamd-wedding-studio__eyebrow">Broadcast Studio</p>
            <h1>Rowdotul HAMD&apos;26 Broadcast Studio</h1>
          </div>
          <p className={testLive ? "hamd-wedding-portal__status hamd-wedding-portal__status--test" : "hamd-wedding-portal__status"}>
            {live ? (testLive ? "TEST LIVE" : "LIVE") : "READY"}
          </p>
          <div className="hamd-wedding-studio__actions">
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              onClick={() => {
                setViewersOpen(true);
                void accessToken()
                  .then((token) =>
                    opsFetch<{ viewerCount: number; guests?: WeddingGuestRow[] }>("/wedding/live/viewers", {
                      accessToken: token,
                    }),
                  )
                  .then((row) => setGuests(row.guests ?? []))
                  .catch(() => setGuests([]));
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M16 11a3 3 0 1 0-2-5.2A4 4 0 1 0 8 11c.7 0 1.4-.2 2-.5A4 4 0 0 0 16 11zM4 19c.4-3 3.2-5 8-5s7.6 2 8 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              {viewers} viewers
            </button>
            <button type="button" className="hamd-btn hamd-btn--ghost" onClick={requestExitStudio}>
              Exit Studio
            </button>
          </div>
        </header>
      ) : null}
      <div className="hamd-wedding-ops-live">
      {!configured ? (
        <OpsAlert tone="warning">
          Live streaming setup required. Configure the LiveKit connection before starting a
          broadcast. Invitation, gallery, and comments remain available.
        </OpsAlert>
      ) : null}
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {qualityWarn ? (
        <OpsAlert tone="warning">Your connection is reducing video quality. Move closer to the router or use a more stable connection.</OpsAlert>
      ) : null}
      <dl className="hamd-wedding-ops-ready">
        <div>
          <dt>Camera</dt>
          <dd>{capture ? capture.label : "Not opened"}</dd>
        </div>
        <div>
          <dt>Connection</dt>
          <dd>{configured ? connection : "Not configured"}</dd>
        </div>
        <div>
          <dt>Microphone</dt>
          <dd>{micOn && (tracksRef.current.length > 0 || live) ? "Ready" : "Not opened"}</dd>
        </div>
      </dl>
      <div className="hamd-wedding-ops-live__grid">
        <section className="hamd-wedding-ops-stage" aria-label="Broadcast preview">
          <div className="hamd-wedding-ops-stage__frame">
            <video ref={previewRef} autoPlay muted playsInline />
            <div className="hamd-wedding-ops-stage__overlay">
              {live ? (
                <>
                  <span className="hamd-wedding-ops-live-dot">{testLive ? "Test Live" : "Live"}</span>
                  <span>
                    {minutes}:{seconds}
                  </span>
                  <span>{viewers} watching</span>
                </>
              ) : (
                <span>
                  Camera preview · {capture ? capture.label : "Open preview to inspect capture"}
                </span>
              )}
            </div>
          </div>
        </section>
        <aside className="hamd-wedding-ops-controls">
          <h2>Broadcast controls</h2>
          <p className="hamd-wedding-ops-controls__state">
            Stream: {live ? (testLive ? "Test live" : "Live") : configured ? "Ready" : "Not configured"}
          </p>
          <p className="hamd-wedding-ops-controls__state">Recording unavailable</p>
          <label>
            Broadcast view
            <select value={feedLabel} onChange={(event) => setFeedLabel(event.target.value)} disabled={busy}>
              {WEDDING_FEED_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Video Quality
            <select
              value={quality}
              onChange={(event) => setQuality(event.target.value as WeddingCaptureChoice)}
              disabled={busy || live}
            >
              <option value="auto">Auto</option>
              <option value="hd">HD 720p</option>
              <option value="fhd">Full HD 1080p</option>
            </select>
          </label>
          <label>
            Camera device
            <select
              value={cameraId}
              onChange={(event) => void changeDevice("videoinput", event.target.value).catch(() => setError("Camera device could not be switched."))}
              disabled={busy}
            >
              <option value="">Default camera</option>
              {devices
                .filter((row) => row.kind === "videoinput")
                .map((row) => (
                  <option key={row.deviceId} value={row.deviceId}>
                    {row.label || "Camera"}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Microphone device
            <select
              value={micId}
              onChange={(event) =>
                void changeDevice("audioinput", event.target.value).catch(() =>
                  setError("Microphone device could not be switched."),
                )
              }
              disabled={busy}
            >
              <option value="">Default microphone</option>
              {devices
                .filter((row) => row.kind === "audioinput")
                .map((row) => (
                  <option key={row.deviceId} value={row.deviceId}>
                    {row.label || "Microphone"}
                  </option>
                ))}
            </select>
          </label>
          <div className="hamd-wedding-ops-controls__toggles">
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              disabled={!configured || busy}
              onClick={() => {
                const next = !cameraOn;
                setCameraOn(next);
                void applyMediaEnabled(next, micOn);
              }}
            >
              {cameraOn ? "Camera on" : "Camera off"}
            </button>
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              disabled={!configured || busy}
              onClick={() => {
                const next = !micOn;
                setMicOn(next);
                void applyMediaEnabled(cameraOn, next);
              }}
            >
              {micOn ? "Microphone on" : "Microphone muted"}
            </button>
          </div>
          <div className="hamd-wedding-ops-controls__actions">
            <button
              type="button"
              className="hamd-btn hamd-btn--secondary"
              disabled={!configured || busy || live}
              onClick={() => void createPreviewTracks().catch(() => setError("Camera preview is unavailable."))}
            >
              Open preview
            </button>
            {capture && !live ? (
              <button type="button" className="hamd-btn hamd-btn--ghost" onClick={closePreview}>
                Close preview
              </button>
            ) : null}
            {live ? (
              <>
                <button type="button" className="hamd-btn hamd-btn--secondary" disabled={busy} onClick={() => void stopMyBroadcast()}>
                  Stop My Broadcast
                </button>
                <button type="button" className="hamd-btn hamd-btn--primary" disabled={busy} onClick={() => setConfirmEnd(true)}>
                  End Wedding Live Event
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--primary"
                  disabled={!configured || busy}
                  onClick={() => void startLive("production")}
                >
                  Start Live
                </button>
                {testEnabled ? (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--secondary"
                    disabled={!configured || busy}
                    onClick={() => void startLive("test")}
                  >
                    Start Test Live
                  </button>
                ) : null}
              </>
            )}
          </div>
        </aside>
      </div>
      {feeds.length > 0 ? (
        <section className="hamd-wedding-ops-feeds" aria-label="Broadcast feeds">
          <h2>Broadcast Feeds</h2>
          <ul>
            {feeds.map((feed) => (
              <li key={feed.feedId}>
                <strong>{feed.label}</strong>
                <span>{feed.status === "live" ? "LIVE" : "OFFLINE"}</span>
                <span>
                  {feed.captureWidth && feed.captureHeight
                    ? formatWeddingCaptureLabel({
                        width: feed.captureWidth,
                        height: feed.captureHeight,
                        frameRate: feed.captureFps,
                      })
                    : "—"}
                </span>
                {live && !feed.primary ? (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--ghost"
                    onClick={() => {
                      void accessToken().then((token) =>
                        opsFetch<WeddingCampaignRecord>("/wedding/live/primary-feed", {
                          method: "POST",
                          accessToken: token,
                          body: { feedId: feed.feedId },
                        }).then((row) => onCampaign({ ...DEFAULT_WEDDING_CAMPAIGN, ...row })),
                      );
                    }}
                  >
                    Set as Main View
                  </button>
                ) : feed.primary ? (
                  <span>Main view</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {testLive ? (
        <details className="hamd-wedding-ops-diag">
          <summary>Stream Quality</summary>
          <p>Capture: {capture ? `${capture.width}×${capture.height} @ ${capture.frameRate}` : "n/a"}</p>
          <p>Publish: simulcast · {capture?.label ?? "pending"}</p>
          <p>Connection: {connection}</p>
          <p>Viewers: {viewers}</p>
        </details>
      ) : null}
      <p className="hamd-wedding-ops-live__meta">
        For the wedding, prefer wired Ethernet or a strong stable Wi-Fi connection from the venue. Light the scene; do not digitally zoom.
      </p>
      <WeddingViewersDrawer open={viewersOpen} viewers={viewers} guests={guests} onClose={() => setViewersOpen(false)} />
      <ConfirmationDialog
        open={confirmEnd}
        title="End the wedding live event?"
        tone="danger"
        confirmLabel="End Wedding Live Event"
        cancelLabel="Keep Live"
        busy={busy}
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => void endLive()}
      >
        This ends the entire celebration for every camera and every guest. Use Stop My Broadcast if another host should continue.
      </ConfirmationDialog>
      <ConfirmationDialog
        open={confirmLeave}
        title="Broadcast is still live."
        tone="danger"
        confirmLabel="End Broadcast"
        cancelLabel="Stay in Studio"
        busy={busy}
        onCancel={() => {
          setConfirmLeave(false);
          onStay?.();
        }}
        onConfirm={() => void endLive()}
      >
        Leaving this page stops the camera and microphone on this computer. End the broadcast or stay in Studio.
      </ConfirmationDialog>
    </div>
    </div>
  );
}
