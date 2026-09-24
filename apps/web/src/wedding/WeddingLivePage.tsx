import { ModuleSkeleton } from "@hamd/ui/module-layout";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { WeddingParticipation } from "./WeddingParticipation.js";
import {
  DEFAULT_WEDDING_CAMPAIGN,
  WEDDING_WAITING_AUDIO_SESSION_MUTE_KEY,
  WEDDING_WAITING_AUDIO_SESSION_VOLUME_KEY,
  WEDDING_WAITING_DEFAULT_VOLUME,
  enabledWeddingWaitingTracks,
  formatWeddingWhen,
  nextWeddingWaitingTrackIndex,
  recoverWeddingWaitingTrackIndex,
  shouldPlayWeddingWaitingMusic,
  shouldRequestWeddingLiveToken,
  weddingCommentChannel,
  type WeddingBroadcastFeed,
  type WeddingCampaignRecord,
  type WeddingWaitingTrack,
} from "@hamd/constants";
import {
  WeddingCommentsPanel,
  WeddingFeedSelector,
  WeddingLiveHeader,
  WeddingLivePortalShell,
  WeddingPortalThemeToggle,
  WeddingViewingPanel,
  WeddingWaitingStage,
  type WeddingPortalStatus,
} from "@hamd/ui";

import { useAuth } from "../auth/session/AuthProvider.js";
import { useTheme } from "../app/providers/ThemeProvider.js";
import {
  fetchWeddingCampaign,
  fetchWeddingLiveStatus,
  fetchWeddingLiveToken,
  listWeddingComments,
  listWeddingWaitingAudio,
  postWeddingComment,
  type WeddingCommentDto,
} from "./wedding-api.js";
import {
  connectWeddingViewer,
  type ViewerQualityChoice,
  type WeddingLiveSession,
} from "./connect-wedding-viewer.js";

function countdownParts(targetIso: string, now: Date) {
  const delta = Date.parse(targetIso) - now.getTime();
  if (!Number.isFinite(delta) || delta <= 0) return null;
  const total = Math.floor(delta / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

class WeddingPortalErrorBoundary extends Component<
  { children: ReactNode; sitePath: string },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[WeddingLivePortal]", error, info.componentStack);
    }
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return (
        <WeddingLivePortalShell>
          <div className="hamd-wedding-portal__overlay">
            <h1>We couldn&apos;t connect to the live celebration.</h1>
            <div className="hamd-wedding-portal__overlay-actions">
              <button type="button" className="hamd-btn hamd-btn--primary" onClick={() => this.setState({ failed: false })}>
                Try Again
              </button>
              <a className="hamd-btn hamd-btn--secondary" href={this.props.sitePath}>
                Back to Wedding
              </a>
            </div>
          </div>
        </WeddingLivePortalShell>
      );
    }
    return this.props.children;
  }
}

type WeddingRehearsalState = "waiting" | "live" | "ended";

const WEDDING_REHEARSAL_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_WEDDING_REHEARSAL === "true";

function rehearsalState(search: string): WeddingRehearsalState | null {
  if (!WEDDING_REHEARSAL_ENABLED) return null;
  const value = new URLSearchParams(search).get("weddingPreview");
  return value === "waiting" || value === "live" || value === "ended" ? value : null;
}

export function WeddingLivePage() {
  const auth = useAuth();
  const location = useLocation();
  const { resolved, setTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<WeddingLiveSession | null>(null);
  const [campaign, setCampaign] = useState<WeddingCampaignRecord>(DEFAULT_WEDDING_CAMPAIGN);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [reconnect, setReconnect] = useState(false);
  const [needsAudio, setNeedsAudio] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [quality, setQuality] = useState<ViewerQualityChoice>("auto");
  const [comments, setComments] = useState<WeddingCommentDto[]>([]);
  const [draft, setDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [statusReady, setStatusReady] = useState(false);
  const [feeds, setFeeds] = useState<WeddingBroadcastFeed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [feedSheet, setFeedSheet] = useState(false);
  const [waitingTracks, setWaitingTracks] = useState<WeddingWaitingTrack[]>([]);
  const [currentWaitingId, setCurrentWaitingId] = useState<string | null>(null);
  const [waitingMuted, setWaitingMuted] = useState(() => readWaitingMute());
  const [waitingVolume, setWaitingVolume] = useState(() => readWaitingVolume());
  const [needWaitingSound, setNeedWaitingSound] = useState(false);
  const [waitingPlaying, setWaitingPlaying] = useState(false);
  const [waitingPlaybackError, setWaitingPlaybackError] = useState<string | null>(null);
  const [waitingLoaded, setWaitingLoaded] = useState(false);
  const [waitingLoadError, setWaitingLoadError] = useState(false);
  const [feedLost, setFeedLost] = useState(false);
  const waitingAudioRef = useRef<HTMLAudioElement>(null);
  const waitingLockRef = useRef(false);
  const waitingMutedRef = useRef(waitingMuted);
  const waitingVolumeRef = useRef(waitingVolume);
  const currentWaitingIdRef = useRef<string | null>(null);
  const failedWaitingIdsRef = useRef(new Set<string>());
  waitingMutedRef.current = waitingMuted;
  waitingVolumeRef.current = waitingVolume;
  currentWaitingIdRef.current = currentWaitingId;
  const connectingRef = useRef(false);
  const unavailableRef = useRef(false);
  const configuredRef = useRef(true);

  const rehearsal = useMemo(() => rehearsalState(location.search), [location.search]);
  const displayCampaign = useMemo<WeddingCampaignRecord>(() => {
    if (!rehearsal) return campaign;
    if (rehearsal === "waiting") return { ...campaign, streamStatus: "upcoming", liveMode: "none", endedKind: "none", waitingMusicEnabled: true };
    if (rehearsal === "live") return { ...campaign, streamStatus: "live", liveMode: "test", endedKind: "none" };
    return { ...campaign, streamStatus: "ended", liveMode: "none", endedKind: "production" };
  }, [campaign, rehearsal]);
  const setRehearsal = (value: WeddingRehearsalState | null) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set("weddingPreview", value);
    else params.delete("weddingPreview");
    const query = params.toString();
    window.history.replaceState(null, "", location.pathname + (query ? `?${query}` : ""));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const loginHref = `/login?returnTo=${encodeURIComponent(displayCampaign.livePath)}`;
  const commentChannel = weddingCommentChannel(displayCampaign);
  const liveActive = displayCampaign.streamStatus === "live";
  const connecting = Boolean(
    auth.status === "authenticated" && liveActive && statusReady && !connected && !error && configuredRef.current,
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = () => {
      void fetchWeddingCampaign().then(setCampaign);
    };
    load();
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = () => {
      void listWeddingWaitingAudio()
        .then((rows) => { setWaitingTracks(enabledWeddingWaitingTracks(rows)); setWaitingLoadError(false); })
        .catch(() => setWaitingLoadError(true))
        .finally(() => setWaitingLoaded(true));
    };
    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const playableWaiting = useMemo(
    () =>
      displayCampaign.waitingMusicEnabled !== true ? [] : enabledWeddingWaitingTracks(waitingTracks),
    [displayCampaign.waitingMusicEnabled, waitingTracks],
  );
  const currentWaiting = playableWaiting.find((row) => row.id === currentWaitingId) ?? null;
  const waitingAllowed = shouldPlayWeddingWaitingMusic(displayCampaign);
  const startWaitingMusic = useCallback(() => {
    const node = waitingAudioRef.current;
    if (!node || !waitingAllowed || waitingLockRef.current) return;
    if (currentWaiting?.src && !node.getAttribute("src")) node.src = currentWaiting.src;
    setWaitingPlaybackError(null);
    node.muted = waitingMutedRef.current;
    node.volume = waitingVolumeRef.current;
    void playMediaElement(node).then(() => {
      if (waitingLockRef.current) return;
      setNeedWaitingSound(false);
      setWaitingPlaying(true);
    }).catch((cause: unknown) => {
      setWaitingPlaying(false);
      if (cause instanceof Error && cause.name === "NotAllowedError") setNeedWaitingSound(true);
      else if (!(cause instanceof Error && cause.name === "AbortError")) setWaitingPlaybackError("Waiting music could not play. Try again.");
    });
  }, [waitingAllowed, currentWaiting?.src]);


  useEffect(() => {
    if (!waitingAllowed) {
      waitingLockRef.current = true;
      return;
    }
    if (displayCampaign.endedKind === "test") {
      waitingLockRef.current = false;
    }
  }, [displayCampaign.endedKind, waitingAllowed]);

  useEffect(() => {
    if (playableWaiting.length === 0) {
      setCurrentWaitingId(null);
      return;
    }
    const stillCurrent = playableWaiting.some((row) => row.id === currentWaitingIdRef.current);
    if (stillCurrent) return;
    const recovered = recoverWeddingWaitingTrackIndex(playableWaiting, currentWaitingIdRef.current, {
      failedIds: failedWaitingIdsRef.current,
      loop: displayCampaign.waitingMusicLoop !== false,
    });
    setCurrentWaitingId(playableWaiting[recovered]?.id ?? playableWaiting[0]?.id ?? null);
  }, [displayCampaign.waitingMusicLoop, playableWaiting]);

  useEffect(() => {
    const node = waitingAudioRef.current;
    if (!node) return undefined;
    node.volume = waitingVolumeRef.current;
    node.muted = waitingMutedRef.current;
    if (!waitingAllowed) {
      waitingLockRef.current = true;
      const from = node.volume;
      const started = performance.now();
      let frame = 0;
      const fade = () => {
        const t = Math.min(1, (performance.now() - started) / 400);
        node.volume = from * (1 - t);
        if (t < 1) frame = requestAnimationFrame(fade);
        else {
          node.pause();
          node.removeAttribute("src");
          node.load();
        }
      };
      frame = requestAnimationFrame(fade);
      return () => cancelAnimationFrame(frame);
    }
    if (waitingLockRef.current || !currentWaiting?.src || waitingMutedRef.current) {
      node.pause();
      return undefined;
    }
    startWaitingMusic();
    return undefined;
  }, [currentWaiting?.src, waitingAllowed, waitingMuted, waitingVolume, startWaitingMusic]);

  const advanceWaitingTrack = (fromError: boolean) => {
    if (waitingLockRef.current || !shouldPlayWeddingWaitingMusic(displayCampaign)) return;
    const index = playableWaiting.findIndex((row) => row.id === currentWaitingIdRef.current);
    const next = nextWeddingWaitingTrackIndex(playableWaiting, index, {
      loop: displayCampaign.waitingMusicLoop !== false,
      failedIds: failedWaitingIdsRef.current,
    });
    if (next < 0) {
      waitingAudioRef.current?.pause();
      return;
    }
    const nextId = playableWaiting[next]?.id ?? null;
    if (fromError && nextId === currentWaitingIdRef.current) {
      waitingAudioRef.current?.pause();
      return;
    }
    setCurrentWaitingId(nextId);
  };

  useEffect(() => {
    const load = () => {
      void listWeddingComments(commentChannel).then(setComments).catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
  }, [commentChannel]);

  const connectViewer = useCallback(async () => {
    if (
      !shouldRequestWeddingLiveToken({
        streamIsLive: true,
        configured: configuredRef.current,
        requestInFlight: connectingRef.current,
        alreadyConnected: Boolean(roomRef.current),
        unavailable: unavailableRef.current,
      })
    ) {
      return;
    }
    connectingRef.current = true;
    setError(null);
    setReconnect(false);
    try {
      if (rehearsal === "live") {
        setConnected(true);
        setError(null);
        return;
      }
      const mode = displayCampaign.liveMode === "test" ? "test" : "production";
      const session = await fetchWeddingLiveToken("viewer", mode);
      roomRef.current?.disconnect();
      const live = await connectWeddingViewer({
        url: session.serverUrl ?? session.url,
        token: session.token,
        video: videoRef.current,
        onReconnecting: setReconnect,
        primaryIdentity: displayCampaign.primaryFeedId,
        quality,
        onFeeds: (rows) => {
          setFeeds(rows);
          setFeedLost(false);
        },
        onSelectedLost: () => setFeedLost(true),
      });
      roomRef.current = live;
      setConnected(true);
      try {
        await live.startAudio();
      } catch {
        setNeedsAudio(true);
      }
    } catch (err) {
      unavailableRef.current = true;
      const message = err instanceof Error ? err.message : "";
      setError(
        message.toLowerCase().includes("unavailable") ||
          message.toLowerCase().includes("live-streaming") ||
          message.toLowerCase().includes("503")
          ? "We couldn't connect to the live-streaming service."
          : "We couldn't connect to the live celebration.",
      );
    } finally {
      connectingRef.current = false;
    }
  }, [displayCampaign.liveMode, displayCampaign.primaryFeedId, rehearsal]);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    void fetchWeddingLiveStatus()
      .then((row) => {
        configuredRef.current = row.configured;
        if (!row.configured) {
          unavailableRef.current = true;
          setError("Live streaming isn't configured yet.");
        }
      })
      .catch(() => undefined)
      .finally(() => setStatusReady(true));
  }, [auth.status]);

  useEffect(() => {
    if (auth.status !== "authenticated" || !statusReady) return;
    if (displayCampaign.streamStatus !== "live") {
      roomRef.current?.disconnect();
      roomRef.current = null;
      setConnected(false);
      return;
    }
    void connectViewer();
  }, [auth.status, displayCampaign.streamStatus, displayCampaign.liveMode, connectViewer, statusReady]);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  useEffect(() => {
    roomRef.current?.setQuality(quality);
  }, [quality]);

  const headerStatus: WeddingPortalStatus = useMemo(() => {
    if (displayCampaign.endedKind === "test" && displayCampaign.streamStatus !== "live") return "ENDED";
    if (displayCampaign.streamStatus === "ended") return "ENDED";
    if (connecting) return "CONNECTING";
    if (displayCampaign.streamStatus === "live" && displayCampaign.liveMode === "test") return "TEST LIVE";
    if (displayCampaign.streamStatus === "live") return "LIVE";
    return "WAITING";
  }, [displayCampaign.endedKind, displayCampaign.liveMode, displayCampaign.streamStatus, connecting]);

  const overlay = (() => {
    if (auth.status !== "authenticated") {
      return (
        <>
          <h1>{displayCampaign.title}</h1>
          <p>Sign in to join the live celebration.</p>
          <div className="hamd-wedding-portal__overlay-actions">
            <Link className="hamd-btn hamd-btn--primary" to={loginHref}>
              Sign in to Join Live
            </Link>
          </div>
        </>
      );
    }
    if (displayCampaign.endedKind === "test" && displayCampaign.streamStatus !== "live") {
      return (
        <>
          <h1>Test broadcast ended.</h1>
          <div className="hamd-wedding-portal__overlay-actions">
            <Link className="hamd-btn hamd-btn--primary" to={displayCampaign.sitePath}>
              Back to Wedding
            </Link>
          </div>
        </>
      );
    }
    if (displayCampaign.streamStatus === "ended") {
      return (
        <>
          <h1>Thank you for celebrating with us.</h1>
          <p>We&apos;re grateful you joined the Rowdotul HAMD&apos;26 celebration.</p>
          <div className="hamd-wedding-portal__overlay-actions">
            <Link className="hamd-btn hamd-btn--primary" to={`${displayCampaign.sitePath}#gallery`}>
              View Gallery
            </Link>
            {displayCampaign.recordingAvailable && displayCampaign.recordingDownloadEnabled ? (
              <a className="hamd-btn hamd-btn--secondary" href="/api/v1/wedding/recording/download">
                Watch Recording
              </a>
            ) : null}
            <Link className="hamd-btn hamd-btn--secondary" to={displayCampaign.sitePath}>
              Back to Wedding
            </Link>
          </div>
        </>
      );
    }
    if (error) {
      return (
        <>
          <h1>{error}</h1>
          <div className="hamd-wedding-portal__overlay-actions">
            {error !== "Live streaming isn't configured yet." ? (
              <button
                type="button"
                className="hamd-btn hamd-btn--primary"
                onClick={() => {
                  unavailableRef.current = false;
                  void connectViewer();
                }}
              >
                Try Again
              </button>
            ) : null}
            <Link className="hamd-btn hamd-btn--secondary" to={displayCampaign.sitePath}>
              Back to Wedding
            </Link>
          </div>
        </>
      );
    }
    if (reconnect) {
      return <p>Reconnecting to the live celebration...</p>;
    }
    if (feedLost && displayCampaign.streamStatus === "live") {
      return (
        <>
          <p>This camera is reconnecting.</p>
          {feeds.length > 0 ? <p>Another view is available.</p> : null}
        </>
      );
    }
    if (connecting) {
      return <p>Connecting to the live celebration...</p>;
    }
    if (displayCampaign.streamStatus !== "live") {
      const when = formatWeddingWhen(displayCampaign.streamAt);
      const parts = countdownParts(displayCampaign.streamAt, now);
      return (
        <WeddingWaitingStage campaign={displayCampaign}>
          <div className="hamd-wedding-waiting__welcome">
            <span className="hamd-wedding-waiting__music-mark" aria-hidden="true">♪</span>
            <h2>We&apos;re getting everything ready</h2>
            <p>The live celebration will begin soon. Stay with us and enjoy the music while you wait.</p>
            {when ? <p className="hamd-wedding-waiting__when">{when}</p> : null}
            {parts ? (
              <div className="hamd-wedding-waiting__countdown" aria-label="Time until live celebration">
                <strong>{parts.days}<small>days</small></strong>
                <strong>{parts.hours}<small>hours</small></strong>
                <strong>{parts.minutes}<small>mins</small></strong>
                <strong>{parts.seconds}<small>secs</small></strong>
              </div>
            ) : null}
          </div>
          {!waitingLoaded ? <ModuleSkeleton variant="list" count={1} /> : waitingLoadError ? <p role="alert">Unable to load waiting music. Checking again shortly.</p> : null}
          {currentWaiting && waitingAllowed ? (
            <div className="hamd-wedding-waiting__audio">
              <span className="hamd-wedding-waiting__audio-title">{waitingPlaying && !waitingMuted ? "Now playing" : "Waiting music:"} {currentWaiting.title}</span>
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                aria-label={needWaitingSound || !waitingPlaying && !waitingMuted ? "Play waiting music" : waitingMuted ? "Unmute waiting music" : "Mute waiting music"}
                onClick={() => {
                  const nextMuted = needWaitingSound || !waitingPlaying && !waitingMuted ? false : !waitingMuted;
                  setWaitingMuted(nextMuted);
                  writeWaitingMute(nextMuted);
                  setNeedWaitingSound(false);
                  waitingMutedRef.current = nextMuted;
                  const node = waitingAudioRef.current;
                  if (node) {
                    node.muted = nextMuted;
                    node.volume = waitingVolumeRef.current;
                    if (!nextMuted) startWaitingMusic();
                    else node.pause();
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {waitingMuted || needWaitingSound ? (
                    <path d="M4 10v4h3l4 3V7L7 10H4zm11.5 1.5 2 2M15 9l6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  ) : (
                    <path d="M4 10v4h3l4 3V7L7 10H4zm11 1a3 3 0 0 1 0 2m3-4a6 6 0 0 1 0 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  )}
                </svg>
                {needWaitingSound || !waitingPlaying && !waitingMuted ? "Play waiting music" : waitingMuted ? "Unmute" : "Mute"}
              </button>
              {needWaitingSound ? <span role="status">Tap play to enjoy the music</span> : waitingMuted ? <span role="status">Muted</span> : waitingPlaying ? <span role="status">Playing</span> : null}
              {waitingPlaybackError ? <span role="alert">{waitingPlaybackError}</span> : null}
              <label>
                <span className="hamd-sr-only">Waiting music volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={waitingVolume}
                  aria-label="Waiting music volume"
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setWaitingVolume(next);
                    writeWaitingVolume(next);
                    if (waitingAudioRef.current) waitingAudioRef.current.volume = next;
                  }}
                />
              </label>
              {playableWaiting.length > 1 ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => advanceWaitingTrack(false)}
                >
                  Next
                </button>
              ) : null}
            </div>
          ) : null}
        </WeddingWaitingStage>
      );
    }
    return null;
  })();

  return (
    <WeddingPortalErrorBoundary sitePath={displayCampaign.sitePath}>
      <WeddingLivePortalShell>
        <WeddingLiveHeader
          status={headerStatus}
          themeControl={
            <WeddingPortalThemeToggle
              resolved={resolved}
              onToggle={() => setTheme(resolved === "dark" ? "light" : "dark")}
            />
          }
          exitHref={displayCampaign.sitePath}
          exitLabel="Back to Wedding"
        />
        {WEDDING_REHEARSAL_ENABLED ? (
          <aside className="hamd-wedding-rehearsal" aria-label="Wedding rehearsal controls">
            <strong>Rehearsal only</strong>
            <span>Uses the real guest portal UI without starting a production broadcast.</span>
            <div className="hamd-wedding-rehearsal__actions">
              <button type="button" className="hamd-btn hamd-btn--secondary" aria-pressed={rehearsal === "waiting"} onClick={() => setRehearsal("waiting")}>Waiting room</button>
              <button type="button" className="hamd-btn hamd-btn--secondary" aria-pressed={rehearsal === "live"} onClick={() => setRehearsal("live")}>Guest live view</button>
              <button type="button" className="hamd-btn hamd-btn--secondary" aria-pressed={rehearsal === "ended"} onClick={() => setRehearsal("ended")}>Post-live</button>
              <button type="button" className="hamd-btn hamd-btn--ghost" onClick={() => setRehearsal(null)}>Real campaign</button>
            </div>
          </aside>
        ) : null}
        <details className="hamd-wedding-participation-menu">
          <summary>Waiting room &amp; updates</summary>
          <WeddingParticipation onJoinInteraction={() => { if (!waitingMutedRef.current) startWaitingMusic(); }} />
        </details>
        <div className={`hamd-wedding-portal__body hamd-wedding-portal__body--${headerStatus.toLowerCase()}`}>
          {liveActive || connecting ? <div className="hamd-wedding-portal__media">
            <WeddingViewingPanel videoRef={videoRef} overlay={overlay} />
            <div className="hamd-wedding-portal__controls">
              <label>
                Quality
                <select
                  aria-label="Quality"
                  value={quality}
                  onChange={(event) => {
                    const next = event.target.value as ViewerQualityChoice;
                    setQuality(next);
                    roomRef.current?.setQuality(next);
                  }}
                >
                  <option value="auto">Auto</option>
                  <option value="1080p">1080p HD</option>
                  <option value="720p">720p HD</option>
                  <option value="360p">360p</option>
                </select>
              </label>
              {needsAudio ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--primary"
                  onClick={() => {
                    void roomRef.current?.startAudio?.().then(() => setNeedsAudio(false));
                    if (videoRef.current) void videoRef.current.play();
                  }}
                >
                  Enable Audio
                </button>
              ) : null}
              <WeddingFeedSelector
                feeds={feeds}
                selectedId={selectedFeed ?? roomRef.current?.selectedIdentity() ?? null}
                onSelect={(identity) => {
                  setSelectedFeed(identity);
                  void roomRef.current?.setSelectedIdentity(identity);
                }}
                mobileOpen={feedSheet}
                onMobileOpen={() => setFeedSheet(true)}
                onMobileClose={() => setFeedSheet(false)}
              />
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost hamd-wedding-portal__messages-btn"
                onClick={() => setCommentsOpen(true)}
              >
                Messages
              </button>
            </div>
          </div> : <section className="hamd-wedding-portal__state" aria-live="polite">{overlay}</section>}
          {liveActive ? <WeddingCommentsPanel
            comments={comments}
            draft={draft}
            onDraftChange={setDraft}
            open={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            canCompose={auth.status === "authenticated"}
            signInHref={loginHref}
            error={commentError}
            onSubmit={(event) => {
              event.preventDefault();
              setCommentError(null);
              void postWeddingComment(draft)
                .then((row) => {
                  setComments((current) => [...current, row]);
                  setDraft("");
                })
                .catch((err: unknown) => {
                  setCommentError(err instanceof Error ? err.message : "Unable to post.");
                });
            }}
          /> : null}
        </div>
        {currentWaiting?.src ? (
          <audio
            ref={waitingAudioRef}
            src={currentWaiting.src}
            preload="metadata"
            onPlaying={() => { setWaitingPlaying(true); setNeedWaitingSound(false); }}
            onPause={() => setWaitingPlaying(false)}
            loop={
              displayCampaign.waitingMusicLoop !== false &&
              playableWaiting.length === 1
            }
            onEnded={() => { setWaitingPlaying(false); advanceWaitingTrack(false); }}
            onError={() => {
              setWaitingPlaying(false);
              setWaitingPlaybackError("This waiting track is unavailable.");
              if (currentWaiting) {
                failedWaitingIdsRef.current.add(currentWaiting.id);
              }
              advanceWaitingTrack(true);
            }}
          />
        ) : null}
      </WeddingLivePortalShell>
    </WeddingPortalErrorBoundary>
  );
}

function playMediaElement(node: HTMLMediaElement): Promise<void> {
  try {
    const result = node.play();
    if (result && typeof result.catch === "function") return result;
  } catch (error) {
    return Promise.reject(error);
  }
  return Promise.resolve();
}

function readWaitingMute(): boolean {
  try {
    return sessionStorage.getItem(WEDDING_WAITING_AUDIO_SESSION_MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function readWaitingVolume(): number {
  try {
    const raw = sessionStorage.getItem(WEDDING_WAITING_AUDIO_SESSION_VOLUME_KEY);
    const value = raw == null ? WEDDING_WAITING_DEFAULT_VOLUME : Number(raw);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : WEDDING_WAITING_DEFAULT_VOLUME;
  } catch {
    return WEDDING_WAITING_DEFAULT_VOLUME;
  }
}

function writeWaitingMute(value: boolean): void {
  try {
    sessionStorage.setItem(WEDDING_WAITING_AUDIO_SESSION_MUTE_KEY, value ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function writeWaitingVolume(value: number): void {
  try {
    sessionStorage.setItem(WEDDING_WAITING_AUDIO_SESSION_VOLUME_KEY, String(value));
  } catch {
    /* private mode */
  }
}
