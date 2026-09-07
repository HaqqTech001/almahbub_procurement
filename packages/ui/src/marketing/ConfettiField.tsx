import type { CSSProperties } from "react";
import { cx } from "../utils/cx.js";

type Particle = {
  left: string;
  top: string;
  delay: string;
  duration: string;
  size: string;
  kind: "spark" | "balloon";
  hue: string;
};

function buildParticles(density: "default" | "rich"): Particle[] {
  const sparkCount = density === "rich" ? 14 : 6;
  const balloonCount = density === "rich" ? 6 : 4;
  const hues = ["#155aaf", "#c9a227", "#9f1239", "#6941c6", "#db2777", "#0ea5e9"];
  const balloonTops = ["12%", "28%", "18%", "42%", "22%", "34%"];
  const balloonLefts = ["6%", "18%", "72%", "82%", "88%", "64%"];

  return [
    ...Array.from({ length: sparkCount }, (_, i) => ({
      left: `${6 + ((i * 7) % 88)}%`,
      top: `${8 + ((i * 13) % 70)}%`,
      delay: `${i * 0.28}s`,
      duration: `${3.4 + (i % 4) * 0.35}s`,
      size: `${2 + (i % 3)}px`,
      kind: "spark" as const,
      hue: i % 3 === 0 ? "#f9db8b" : i % 3 === 1 ? "#c9a227" : "#fce7f3",
    })),
    ...Array.from({ length: balloonCount }, (_, i) => ({
      left: balloonLefts[i] ?? `${10 + i * 14}%`,
      top: balloonTops[i] ?? "20%",
      delay: `${0.1 + i * 0.45}s`,
      duration: `${5.5 + (i % 3) * 0.8}s`,
      size: `${11 + (i % 3) * 3}px`,
      kind: "balloon" as const,
      hue: hues[i % hues.length] ?? "#155aaf",
    })),
  ];
}

export type ConfettiFieldProps = {
  className?: string;
  /** `rich` is used for celebration slides (still sparse / premium). */
  density?: "default" | "rich";
};

export function ConfettiField({ className, density = "default" }: ConfettiFieldProps) {
  const particles = buildParticles(density);
  return (
    <div
      className={cx("hamd-campaign-banner__confetti", "hamd-announcement-slider__confetti", className)}
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <span
          key={`${p.kind}-${i}`}
          className={
            p.kind === "balloon"
              ? "hamd-campaign-banner__balloon"
              : "hamd-campaign-banner__spark"
          }
          style={
            {
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.kind === "balloon" ? `calc(${p.size} * 1.3)` : p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
              ["--hamd-balloon-color" as string]: p.hue,
              background: p.kind === "spark" ? p.hue : undefined,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
