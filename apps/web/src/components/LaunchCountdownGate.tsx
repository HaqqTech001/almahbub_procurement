import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import "../styles/launch-countdown.css";

const LAUNCH_AT = new Date("2026-09-25T21:00:00+01:00").getTime();

const PREVIEW_PARAM = "launchPreview";
const REHEARSAL_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LAUNCH_REHEARSAL === "true";
const PREVIEW_SECONDS: Record<string, number> = { "30": 30, "15": 15, "10": 10, "5": 5, reveal: 0 };

function previewSeconds(search: string): number | null {
  if (!REHEARSAL_ENABLED) return null;
  const value = new URLSearchParams(search).get(PREVIEW_PARAM);
  return value != null && value in PREVIEW_SECONDS ? PREVIEW_SECONDS[value]! : null;
}

type Remaining = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function remaining(now: number, target = LAUNCH_AT): Remaining {
  const total = Math.max(0, target - now);
  const secondsTotal = Math.floor(total / 1000);
  return {
    total,
    days: Math.floor(secondsTotal / 86400),
    hours: Math.floor((secondsTotal % 86400) / 3600),
    minutes: Math.floor((secondsTotal % 3600) / 60),
    seconds: secondsTotal % 60,
  };
}

function isExcludedPath(pathname: string): boolean {
  if (pathname.startsWith("/app")) return true;
  if (pathname.startsWith("/rowdotul-hamd-26")) return true;
  return /^\/(login|register|forgot-password|reset-password|verify-email|otp|invite|unauthorized|session-expired|account-locked)(\/|$)/.test(
    pathname,
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="hamd-launch__unit">
      <span className="hamd-launch__number">{String(value).padStart(2, "0")}</span>
      <span className="hamd-launch__label">{label}</span>
    </div>
  );
}

const LAUNCH_STORIES = [
  {
    id: "v2",
    eyebrow: "Almahbub International · V2",
    title: "The next version of how we source.",
    accent: "Smarter. Clearer. More capable.",
    body:
      "Almahbub International is not starting over. V2 builds on the original platform with a stronger procurement experience, clearer workflows and a more refined digital presence.",
  },
  {
    id: "integrated-export",
    eyebrow: "A new business joins the group",
    title: "Introducing Almahbub Integrated Export Ltd.",
    accent: "Agro commodities. Bulk supply. Export.",
    body:
      "A distinct business entity under Almahbub Group, created for agricultural commodity sourcing, bulk supply and export-focused enquiries.",
  },
  {
    id: "group",
    eyebrow: "Almahbub Group",
    title: "Two businesses. One broader ecosystem.",
    accent: "Global procurement meets Nigerian export.",
    body:
      "Almahbub International continues the procurement journey while Almahbub Integrated Export Ltd. opens a dedicated path for agro and export trade.",
  },
] as const;

export function LaunchCountdownGate() {
  const location = useLocation();
  const [now, setNow] = useState(() => Date.now());
  const [storyIndex, setStoryIndex] = useState(0);
  const preview = useMemo(() => previewSeconds(location.search), [location.search]);
  const [previewStartedAt, setPreviewStartedAt] = useState(() => Date.now());

  useEffect(() => {
    setPreviewStartedAt(Date.now());
    setNow(Date.now());
  }, [preview]);

  useEffect(() => {
    if (preview == null && Date.now() >= LAUNCH_AT) return;
    const timer = window.setInterval(() => setNow(Date.now()), preview == null ? 1000 : 250);
    return () => window.clearInterval(timer);
  }, [preview]);

  useEffect(() => {
    if (Date.now() >= LAUNCH_AT) return;
    const storyTimer = window.setInterval(
      () => setStoryIndex((current) => (current + 1) % LAUNCH_STORIES.length),
      5600,
    );
    return () => window.clearInterval(storyTimer);
  }, []);

  const previewTarget = preview == null ? null : previewStartedAt + preview * 1000;
  const setRehearsal = (value: string | null) => {
    const params = new URLSearchParams(location.search);
    if (value == null) params.delete(PREVIEW_PARAM);
    else params.set(PREVIEW_PARAM, value);
    const query = params.toString();
    window.history.replaceState(null, "", location.pathname + (query ? `?${query}` : ""));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const left = useMemo(() => remaining(now, previewTarget ?? LAUNCH_AT), [now, previewTarget]);
  const story = LAUNCH_STORIES[storyIndex] ?? LAUNCH_STORIES[0];

  if ((left.total <= 0 && preview !== 0) || isExcludedPath(location.pathname)) return null;

  const totalWindow = 48 * 60 * 60 * 1000;
  const progress = Math.max(0, Math.min(1, 1 - left.total / totalWindow));
  const finalSeconds = left.total <= 30_000;
  const critical = left.total <= 10_000;
  const reveal = left.total <= 0;
  const rootClass = [
    "hamd-launch",
    finalSeconds ? "hamd-launch--final" : "",
    critical ? "hamd-launch--critical" : "",
    reveal ? "hamd-launch--reveal" : "",
    preview != null ? "hamd-launch--preview" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={rootClass} role="dialog" aria-modal="true" aria-labelledby="hamd-launch-title">
      {preview != null ? <div className="hamd-launch__preview-badge">REHEARSAL · production timer unaffected</div> : null}
      {REHEARSAL_ENABLED ? (
        <aside className="hamd-launch__rehearsal-controls" aria-label="Launch rehearsal controls">
          <b>Launch rehearsal</b>
          {["30", "15", "10", "5"].map((seconds) => (
            <button key={seconds} type="button" onClick={() => setRehearsal(seconds)}>
              Final {seconds}s
            </button>
          ))}
          <button type="button" onClick={() => setRehearsal("reveal")}>Reveal</button>
          <button type="button" onClick={() => setRehearsal(null)}>Real timer</button>
        </aside>
      ) : null}
      <div className="hamd-launch__curtain hamd-launch__curtain--left" aria-hidden="true" />
      <div className="hamd-launch__curtain hamd-launch__curtain--right" aria-hidden="true" />
      <div className="hamd-launch__aurora hamd-launch__aurora--one" aria-hidden="true" />
      <div className="hamd-launch__aurora hamd-launch__aurora--two" aria-hidden="true" />
      <div className="hamd-launch__grain" aria-hidden="true" />
      <div className="hamd-launch__sparkles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <i
            key={index}
            style={
              {
                "--spark-index": index,
                "--spark-left": `${(index * 47 + 9) % 100}%`,
                "--spark-top": `${(index * 73 + 13) % 100}%`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <main className="hamd-launch__panel">
        <div className="hamd-launch__evolution" aria-label="Almahbub International evolution and new business launch">
          <div className="hamd-launch__evolution-step hamd-launch__evolution-step--past">
            <small>Previously</small>
            <strong>Almahbub International V1</strong>
          </div>
          <span className="hamd-launch__evolution-arrow" aria-hidden="true">→</span>
          <div className="hamd-launch__evolution-step hamd-launch__evolution-step--current">
            <small>Now evolving to</small>
            <strong>Almahbub International V2</strong>
          </div>
          <span className="hamd-launch__evolution-plus" aria-hidden="true">+</span>
          <div className="hamd-launch__evolution-step hamd-launch__evolution-step--new">
            <small>New business entity</small>
            <strong>Integrated Export Ltd.</strong>
          </div>
        </div>

        <div className="hamd-launch__identity-row" aria-label="Almahbub Group businesses">
          <div className="hamd-launch__identity hamd-launch__identity--international">
            <span className="hamd-launch__logo-shell">
              <img
                src="/almahbub.svg"
                alt="Almahbub International logo"
                className="hamd-launch__logo"
              />
              <span className="hamd-launch__logo-glint" aria-hidden="true" />
            </span>
            <span>
              <strong>Almahbub International</strong>
              <small>V2 · Global Procurement</small>
            </span>
          </div>

          <span className="hamd-launch__group-link" aria-hidden="true">
            <i />
            <b>Almahbub Group</b>
            <i />
          </span>

          <div className="hamd-launch__identity hamd-launch__identity--export">
            <span className="hamd-launch__export-logo-shell">
              <img
                src="/media/brands/almahbub-integrated-export.jpg"
                alt="Almahbub Integrated Export Ltd. logo"
                className="hamd-launch__export-logo"
              />
            </span>
            <span>
              <strong>Almahbub Integrated Export Ltd.</strong>
              <small>New · Agro & Export</small>
            </span>
          </div>
        </div>

        <section
          key={story.id}
          className={`hamd-launch__story hamd-launch__story--${story.id}`}
          aria-live="polite"
        >
          <p className="hamd-launch__eyebrow">{story.eyebrow}</p>
          <h1 id="hamd-launch-title">
            {story.title}
            <span>{story.accent}</span>
          </h1>
          <p className="hamd-launch__lead">{story.body}</p>
        </section>

        <div className="hamd-launch__story-dots" aria-label="Launch story">
          {LAUNCH_STORIES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === storyIndex ? "is-active" : ""}
              aria-label={`Show ${item.eyebrow}`}
              aria-pressed={index === storyIndex}
              onClick={() => setStoryIndex(index)}
            />
          ))}
        </div>

        {finalSeconds ? (
          <div className="hamd-launch__final-seconds" aria-live="assertive">
            <small>{reveal ? "Welcome to Almahbub V2" : "Launching in"}</small>
            {!reveal ? <strong>{Math.max(0, Math.ceil(left.total / 1000))}</strong> : <strong>LIVE</strong>}
          </div>
        ) : null}
        <div className="hamd-launch__countdown" aria-label="Countdown to launch">
          <TimeUnit value={left.days} label="Days" />
          <span className="hamd-launch__separator" aria-hidden="true">:</span>
          <TimeUnit value={left.hours} label="Hours" />
          <span className="hamd-launch__separator" aria-hidden="true">:</span>
          <TimeUnit value={left.minutes} label="Minutes" />
          <span className="hamd-launch__separator" aria-hidden="true">:</span>
          <TimeUnit value={left.seconds} label="Seconds" />
        </div>

        <div className="hamd-launch__date">
          <span>25 September 2026</span>
          <span className="hamd-launch__dot" aria-hidden="true" />
          <span>9:00 PM WAT</span>
        </div>

        <div className="hamd-launch__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        <p className="hamd-launch__note">
          V2 and Almahbub Integrated Export Ltd. go live together when the countdown reaches zero.
        </p>
      </main>
    </div>
  );
}
