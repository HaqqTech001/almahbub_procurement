import {
  formatWeddingCaptureLabel,
  weddingCaptureAttempts,
  type WeddingCaptureChoice,
} from "@hamd/constants";

export type WeddingHostTrack = {
  kind: string;
  stop: () => void;
  attach: (el: HTMLMediaElement) => void;
  detach: () => void;
  mute: () => Promise<void> | void;
  unmute: () => Promise<void> | void;
  mediaStreamTrack?: MediaStreamTrack;
};

export type WeddingCaptureReport = {
  width: number;
  height: number;
  frameRate: number;
  deviceId?: string;
  label: string;
  requestedWidth: number;
  requestedHeight: number;
};

type LiveKitCapture = {
  VideoPresets: {
    h1080: { resolution: object; encoding: object };
    h720: { resolution: object; encoding: object };
    h360: { resolution: object };
  };
  createLocalTracks: (options: object) => Promise<WeddingHostTrack[]>;
};

export async function createWeddingHostTracks(input: {
  livekit: LiveKitCapture;
  quality: WeddingCaptureChoice;
  cameraId?: string;
  micId?: string;
}): Promise<{ tracks: WeddingHostTrack[]; capture: WeddingCaptureReport; publish: object }> {
  const attempts = weddingCaptureAttempts(input.quality);
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const tracks = await input.livekit.createLocalTracks({
        audio: input.micId ? { deviceId: { exact: input.micId } } : true,
        video: {
          ...(input.cameraId ? { deviceId: { exact: input.cameraId } } : {}),
          resolution: {
            width: attempt.width,
            height: attempt.height,
            frameRate: attempt.frameRate,
          },
        },
      });
      const video = tracks.find((track) => track.kind === "video");
      const settings = video?.mediaStreamTrack?.getSettings?.() ?? {};
      const width = Math.round(settings.width ?? attempt.width);
      const height = Math.round(settings.height ?? attempt.height);
      const frameRate = Math.round(settings.frameRate ?? attempt.frameRate);
      const hd = height >= 1000;
      const publish =
        hd
          ? {
              simulcast: true,
              videoEncoding: input.livekit.VideoPresets.h1080.encoding,
              videoSimulcastLayers: [input.livekit.VideoPresets.h720, input.livekit.VideoPresets.h360],
              degradationPreference: "maintain-resolution",
            }
          : {
              simulcast: true,
              videoEncoding: input.livekit.VideoPresets.h720.encoding,
              videoSimulcastLayers: [input.livekit.VideoPresets.h360],
              degradationPreference: "maintain-resolution",
            };
      return {
        tracks,
        publish,
        capture: {
          width,
          height,
          frameRate,
          deviceId: settings.deviceId,
          requestedWidth: attempt.width,
          requestedHeight: attempt.height,
          label: formatWeddingCaptureLabel({ width, height, frameRate }),
        },
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Camera preview is unavailable.");
}
