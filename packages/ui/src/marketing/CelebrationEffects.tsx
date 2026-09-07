import { useEffect, useState, type CSSProperties } from "react";
import { cx } from "../utils/cx.js";

export type CelebrationIntensity = "default" | "rich" | "hamd";

export type CelebrationEffectsProps = {
  className?: string;
  /** `hamd` densifies rain/glow for Rowdotul HAMD'26 slides; still sparse. */
  intensity?: CelebrationIntensity;
  /** Changing this pulses a slide shimmer without remounting particles. */
  pulseKey?: string;
};

type Particle = {
  left: string;
  top?: string;
  delay: string;
  duration: string;
  size: string;
  drift: string;
  rotate: string;
  hue: string;
  kind?: string;
};

const GOLD = ["#fbf3dd", "#f9db8b", "#d4af37", "#c9a227"] as const;
const MAGENTA = ["#f472b6", "#e11d74", "#db2777"] as const;

function buildRain(intensity: CelebrationIntensity): Particle[] {
  const count = intensity === "hamd" ? 14 : intensity === "rich" ? 11 : 8;
  return Array.from({ length: count }, (_, i) => ({
    left: `${3 + ((i * 13 + 5) % 94)}%`,
    delay: `${(i * 0.47) % 5.2}s`,
    duration: `${5.4 + (i % 6) * 0.7}s`,
    size: `${1.4 + (i % 4) * 0.55}px`,
    drift: `${((i % 7) - 3) * 7}px`,
    rotate: `${(i % 5) * 12 - 18}deg`,
    hue: i % 4 === 0 ? MAGENTA[i % MAGENTA.length]! : GOLD[i % GOLD.length]!,
    kind: i % 4 === 0 ? "confetti" : i % 5 === 0 ? "star" : "dot",
  }));
}

function buildStars(intensity: CelebrationIntensity): Particle[] {
  const count = intensity === "hamd" ? 7 : 5;
  return Array.from({ length: count }, (_, i) => ({
    left: `${6 + ((i * 19) % 88)}%`,
    top: `${8 + ((i * 29) % 62)}%`,
    delay: `${(i * 0.85) % 4.6}s`,
    duration: `${3.8 + (i % 4) * 0.55}s`,
    size: `${4 + (i % 3) * 1.6}px`,
    drift: `${((i % 3) - 1) * 4}px`,
    rotate: `${i * 18}deg`,
    hue: i % 2 === 0 ? "#f9db8b" : "color-mix(in srgb, #a78bfa 70%, transparent)",
  }));
}

function buildSparkles(intensity: CelebrationIntensity): Particle[] {
  const count = intensity === "hamd" ? 8 : 5;
  return Array.from({ length: count }, (_, i) => ({
    left: `${8 + ((i * 14) % 84)}%`,
    top: `${10 + ((i * 21) % 72)}%`,
    delay: `${(i * 0.63) % 3.8}s`,
    duration: `${2.4 + (i % 3) * 0.45}s`,
    size: `${3 + (i % 3)}px`,
    drift: "0px",
    rotate: "0deg",
    hue: i % 2 === 0 ? "#fff7ed" : "#fce7f3",
  }));
}

function buildBokeh(intensity: CelebrationIntensity): Particle[] {
  const count = intensity === "hamd" ? 8 : 5;
  return Array.from({ length: count }, (_, i) => ({
    left: `${4 + ((i * 16) % 90)}%`,
    top: `${6 + ((i * 27) % 78)}%`,
    delay: `${(i * 0.9) % 6}s`,
    duration: `${6.5 + (i % 4) * 0.8}s`,
    size: `${3 + (i % 4) * 1.8}px`,
    drift: `${((i % 2 === 0 ? 1 : -1) * (6 + (i % 3) * 4))}px`,
    rotate: "0deg",
    hue:
      i % 3 === 0
        ? "color-mix(in srgb, #f9db8b 55%, transparent)"
        : i % 3 === 1
          ? "color-mix(in srgb, #f472b6 45%, transparent)"
          : "color-mix(in srgb, #a78bfa 50%, transparent)",
  }));
}

function buildSprinkles(intensity: CelebrationIntensity): Particle[] {
  const count = intensity === "hamd" ? 8 : 5;
  return Array.from({ length: count }, (_, i) => ({
    left: `${5 + ((i * 17) % 90)}%`,
    top: `${14 + ((i * 23) % 68)}%`,
    delay: `${(i * 0.7) % 5}s`,
    duration: `${3.6 + (i % 3) * 0.65}s`,
    size: `${1.2 + (i % 2)}px`,
    drift: `${((i % 3) - 1) * 5}px`,
    rotate: `${i * 25}deg`,
    hue: i % 2 === 0 ? "#f9db8b" : "#fce7f3",
  }));
}

type BalloonSpec = {
  left: string;
  delay: string;
  duration: string;
  size: string;
  hue: string;
  drift: string;
  pops?: boolean;
};

const BALLOON_HUES = ["#c9a227", "#e11d74", "#7c3aed", "#f472b6"];

function buildBalloons(intensity: CelebrationIntensity): BalloonSpec[] {
  const count = intensity === "hamd" ? 4 : intensity === "rich" ? 4 : 3;
  const lefts = ["10%", "28%", "70%", "86%"];
  return Array.from({ length: count }, (_, i) => ({
    left: lefts[i] ?? `${12 + i * 22}%`,
    delay: `${1.1 + i * 1.45 + (i % 2) * 0.4}s`,
    duration: `${11 + (i % 3) * 1.6}s`,
    size: `${8 + (i % 3) * 2}px`,
    hue: BALLOON_HUES[i % BALLOON_HUES.length] ?? "#c9a227",
    drift: `${(i % 2 === 0 ? 1 : -1) * (8 + (i % 3) * 5)}px`,
    pops: i === 1,
  }));
}

function buildBurstSeeds(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.12;
    const dist = 9 + (i % 4) * 4;
    return {
      dx: `${Math.cos(angle) * dist}px`,
      dy: `${Math.sin(angle) * dist * 0.8 + 3}px`,
      delay: `${(i % 5) * 0.02}s`,
      size: `${1.3 + (i % 3) * 0.5}px`,
      hue: i % 3 === 0 ? "#fbf3dd" : i % 3 === 1 ? "#f9db8b" : "#fce7f3",
    };
  });
}

const RAIN = {
  default: buildRain("default"),
  rich: buildRain("rich"),
  hamd: buildRain("hamd"),
} as const;
const STARS = {
  default: buildStars("default"),
  rich: buildStars("rich"),
  hamd: buildStars("hamd"),
} as const;
const SPARKLES = {
  default: buildSparkles("default"),
  rich: buildSparkles("rich"),
  hamd: buildSparkles("hamd"),
} as const;
const BOKEH = {
  default: buildBokeh("default"),
  rich: buildBokeh("rich"),
  hamd: buildBokeh("hamd"),
} as const;
const SPRINKLES = {
  default: buildSprinkles("default"),
  rich: buildSprinkles("rich"),
  hamd: buildSprinkles("hamd"),
} as const;
const BALLOONS = {
  default: buildBalloons("default"),
  rich: buildBalloons("rich"),
  hamd: buildBalloons("hamd"),
} as const;
const BURST = {
  default: buildBurstSeeds(8),
  rich: buildBurstSeeds(9),
  hamd: buildBurstSeeds(10),
} as const;

function CelebrationStage() {
  return (
    <svg
      className="hamd-celebration-fx__stage"
      viewBox="0 0 1200 48"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hamd-fx-stage" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14082c" />
          <stop offset="55%" stopColor="#25104a" />
          <stop offset="100%" stopColor="#3b1768" />
        </linearGradient>
        <linearGradient id="hamd-fx-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
          <stop offset="35%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="65%" stopColor="#f472b6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hamd-fx-gold-ribbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbf3dd" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6415" />
        </linearGradient>
        <linearGradient id="hamd-fx-violet-ribbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="hamd-fx-popper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="55%" stopColor="#e11d74" />
          <stop offset="100%" stopColor="#9d174d" />
        </linearGradient>
      </defs>
      <rect width="1200" height="48" fill="url(#hamd-fx-stage)" />
      <ellipse className="hamd-celebration-fx__wave" cx="600" cy="50" rx="420" ry="14" fill="url(#hamd-fx-wave)" />
      <ellipse className="hamd-celebration-fx__wave hamd-celebration-fx__wave--slow" cx="280" cy="52" rx="180" ry="10" fill="url(#hamd-fx-wave)" opacity="0.55" />
      <ellipse className="hamd-celebration-fx__wave" cx="920" cy="52" rx="180" ry="10" fill="url(#hamd-fx-wave)" opacity="0.55" />

      <g className="hamd-celebration-fx__ribbons hamd-celebration-fx__ribbons--left">
        <path
          d="M48 44 C 70 28, 95 8, 130 4"
          fill="none"
          stroke="url(#hamd-fx-gold-ribbon)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M52 44 C 78 34, 88 12, 108 2"
          fill="none"
          stroke="url(#hamd-fx-violet-ribbon)"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M44 44 C 62 22, 118 18, 154 10"
          fill="none"
          stroke="url(#hamd-fx-gold-ribbon)"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>
      <g className="hamd-celebration-fx__ribbons hamd-celebration-fx__ribbons--right">
        <path
          d="M1152 44 C 1130 28, 1105 8, 1070 4"
          fill="none"
          stroke="url(#hamd-fx-gold-ribbon)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M1148 44 C 1122 34, 1112 12, 1092 2"
          fill="none"
          stroke="url(#hamd-fx-violet-ribbon)"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M1156 44 C 1138 22, 1082 18, 1046 10"
          fill="none"
          stroke="url(#hamd-fx-gold-ribbon)"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>

      <g className="hamd-celebration-fx__popper hamd-celebration-fx__popper--left">
        <polygon points="18,46 52,38 28,28" fill="url(#hamd-fx-popper)" />
        <polygon points="24,42 44,37 32,32" fill="#f9db8b" opacity="0.35" />
        <rect x="22" y="39" width="8" height="1.4" rx="0.5" fill="#f9db8b" transform="rotate(-18 26 40)" />
        <rect x="30" y="36" width="7" height="1.3" rx="0.5" fill="#f9db8b" transform="rotate(-18 34 37)" />
      </g>
      <g className="hamd-celebration-fx__popper hamd-celebration-fx__popper--right">
        <polygon points="1182,46 1148,38 1172,28" fill="url(#hamd-fx-popper)" />
        <polygon points="1176,42 1156,37 1168,32" fill="#f9db8b" opacity="0.35" />
        <rect x="1164" y="39" width="8" height="1.4" rx="0.5" fill="#f9db8b" transform="rotate(18 1170 40)" />
        <rect x="1156" y="36" width="7" height="1.3" rx="0.5" fill="#f9db8b" transform="rotate(18 1160 37)" />
      </g>
    </svg>
  );
}

/**
 * Premium wedding celebration overlay for the compact global announcement strip.
 * Independent CSS/SVG layers: no layout height impact, pointer-events none.
 */
export function CelebrationEffects({
  className,
  intensity = "default",
  pulseKey,
}: CelebrationEffectsProps) {
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (!pulseKey) return;
    setPulsing(true);
    const timer = window.setTimeout(() => setPulsing(false), 880);
    return () => window.clearTimeout(timer);
  }, [pulseKey]);

  const rain = RAIN[intensity];
  const stars = STARS[intensity];
  const sparkles = SPARKLES[intensity];
  const bokeh = BOKEH[intensity];
  const sprinkles = SPRINKLES[intensity];
  const balloons = BALLOONS[intensity];
  const burstSeeds = BURST[intensity];

  return (
    <div
      className={cx(
        "hamd-celebration-fx",
        `hamd-celebration-fx--${intensity}`,
        pulsing && "is-slide-pulse",
        className,
      )}
      aria-hidden="true"
    >
      <CelebrationStage />
      <div className="hamd-celebration-fx__glow" />
      <div className="hamd-celebration-fx__veil" />

      <div className="hamd-celebration-fx__rain">
        {rain.map((drop, i) => (
          <span
            key={`rain-${i}`}
            className={cx(
              "hamd-celebration-fx__rain-particle",
              drop.kind && `hamd-celebration-fx__rain-particle--${drop.kind}`,
            )}
            style={
              {
                left: drop.left,
                width: drop.kind === "confetti" ? `calc(${drop.size} * 2.2)` : drop.size,
                height:
                  drop.kind === "star"
                    ? drop.size
                    : drop.kind === "confetti"
                      ? `calc(${drop.size} * 0.7)`
                      : `calc(${drop.size} * 1.6)`,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
                background: drop.hue,
                ["--hamd-fx-drift" as string]: drop.drift,
                ["--hamd-fx-rotate" as string]: drop.rotate,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="hamd-celebration-fx__stars">
        {stars.map((s, i) => (
          <span
            key={`star-${i}`}
            className="hamd-celebration-fx__star"
            style={
              {
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
                animationDuration: s.duration,
                background: s.hue,
                ["--hamd-fx-drift" as string]: s.drift,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="hamd-celebration-fx__sparkles">
        {sparkles.map((s, i) => (
          <span
            key={`spark-${i}`}
            className="hamd-celebration-fx__sparkle"
            style={
              {
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
                animationDuration: s.duration,
                background: s.hue,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="hamd-celebration-fx__bokeh">
        {bokeh.map((s, i) => (
          <span
            key={`bokeh-${i}`}
            className="hamd-celebration-fx__bokeh-dot"
            style={
              {
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
                animationDuration: s.duration,
                background: s.hue,
                ["--hamd-fx-drift" as string]: s.drift,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="hamd-celebration-fx__sprinkles">
        {sprinkles.map((s, i) => (
          <span
            key={`sprinkle-${i}`}
            className="hamd-celebration-fx__sprinkle"
            style={
              {
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
                animationDuration: s.duration,
                background: s.hue,
                ["--hamd-fx-drift" as string]: s.drift,
                ["--hamd-fx-rotate" as string]: s.rotate,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="hamd-celebration-fx__balloons">
        {balloons.map((b, i) => (
          <span
            key={`balloon-${i}`}
            className={cx(
              "hamd-celebration-fx__balloon",
              b.pops && "hamd-celebration-fx__balloon--pops",
            )}
            style={
              {
                left: b.left,
                width: b.size,
                height: `calc(${b.size} * 1.28)`,
                animationDelay: b.delay,
                animationDuration: b.duration,
                ["--hamd-balloon-color" as string]: b.hue,
                ["--hamd-fx-drift" as string]: b.drift,
              } as CSSProperties
            }
          >
            {b.pops ? (
              <span className="hamd-celebration-fx__burst">
                {burstSeeds.map((seed, j) => (
                  <span
                    key={`burst-${i}-${j}`}
                    className="hamd-celebration-fx__burst-bit"
                    style={
                      {
                        width: seed.size,
                        height: seed.size,
                        background: seed.hue,
                        animationDelay: `calc(${b.delay} + ${seed.delay})`,
                        animationDuration: b.duration,
                        ["--hamd-fx-dx" as string]: seed.dx,
                        ["--hamd-fx-dy" as string]: seed.dy,
                      } as CSSProperties
                    }
                  />
                ))}
              </span>
            ) : null}
          </span>
        ))}
      </div>

      <div className="hamd-celebration-fx__slide-shimmer" />
    </div>
  );
}
