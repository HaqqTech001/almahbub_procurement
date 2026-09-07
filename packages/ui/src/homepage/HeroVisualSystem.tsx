import { cx } from "../utils/cx.js";

export type HeroVisualCard = {
  id: string;
  eyebrow: string;
  title: string;
  meta?: string;
};

export type HeroVisualSystemProps = {
  /** Accessible name for the composed illustration. */
  label?: string;
  cards?: readonly HeroVisualCard[];
  showWorld?: boolean;
  showNetwork?: boolean;
  showShipment?: boolean;
  /** Host can force-disable motion (also CSS respects prefers-reduced-motion). */
  reduceMotion?: boolean;
  className?: string;
};

const defaultCards: readonly HeroVisualCard[] = [
  {
    id: "corridor",
    eyebrow: "Trade corridor",
    title: "Ilorin → Global corridors",
    meta: "Active lane",
  },
  {
    id: "shipment",
    eyebrow: "Shipment",
    title: "In transit · Stage 4/6",
    meta: "ETA range published",
  },
  {
    id: "network",
    eyebrow: "Supplier network",
    title: "12 verified nodes",
    meta: "Inspection + logistics",
  },
];

/**
 * Premium layered hero visual - SVG illustration system (not stock photography).
 * Communicates global procurement, trade, technology, professionalism, efficiency.
 * Decorative relative to hero copy: presented as one composition with a single accessible name.
 */
export function HeroVisualSystem({
  label = "Layered visualization of global procurement corridors, shipments, and supplier network",
  cards = defaultCards,
  showWorld = true,
  showNetwork = true,
  showShipment = true,
  reduceMotion = false,
  className,
}: HeroVisualSystemProps) {
  return (
    <div
      className={cx(
        "hamd-hero-visual",
        reduceMotion && "hamd-hero-visual--static",
        className,
      )}
      role="img"
      aria-label={label}
      data-testid="hero-visual-system"
    >
      <div className="hamd-hero-visual__atmosphere" aria-hidden="true">
        <div className="hamd-hero-visual__glow hamd-hero-visual__glow--a" />
        <div className="hamd-hero-visual__glow hamd-hero-visual__glow--b" />
        <div className="hamd-hero-visual__grid" />
      </div>

      <svg
        className="hamd-hero-visual__canvas"
        viewBox="0 0 960 720"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="hamd-hero-orb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#0f766e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0b1220" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="hamd-hero-route" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#53b1fd" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#53b1fd" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="0.35" />
          </linearGradient>
          <filter id="hamd-hero-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <radialGradient id="hamd-hero-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="1" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* 3D-style isometric procurement platform slab */}
        <g className="hamd-hero-visual__platform">
          <ellipse cx="620" cy="520" rx="260" ry="48" fill="#0a1628" opacity="0.55" />
          <path
            d="M360 360 L620 250 L880 360 L620 470 Z"
            fill="url(#hamd-hero-orb)"
            opacity="0.45"
          />
          <path
            d="M360 360 L620 470 L620 510 L360 400 Z"
            fill="#0f1c33"
            opacity="0.85"
          />
          <path
            d="M620 470 L880 360 L880 400 L620 510 Z"
            fill="#13243f"
            opacity="0.9"
          />
          <path
            d="M420 390 L620 305 L820 390 L620 475 Z"
            fill="none"
            stroke="#93c5fd"
            strokeOpacity="0.45"
            strokeWidth="1.25"
            opacity="0.7"
          />
          {/* Tech rails on platform */}
          <path
            d="M460 400 H780 M500 420 H740 M540 440 H700"
            stroke="#53b1fd"
            strokeOpacity="0.28"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {showWorld ? (
          <g className="hamd-hero-visual__world">
            <circle
              cx="640"
              cy="300"
              r="118"
              fill="none"
              stroke="#334155"
              strokeWidth="18"
              opacity="0.35"
              filter="url(#hamd-hero-soft)"
            />
            <circle
              cx="640"
              cy="300"
              r="112"
              fill="#0b1729"
              stroke="#475569"
              strokeWidth="1.5"
              opacity="0.92"
            />
            {/* Stylized meridians / trade latitude - not a stock globe photo */}
            <ellipse cx="640" cy="300" rx="112" ry="40" fill="none" stroke="#64748b" strokeOpacity="0.45" />
            <ellipse cx="640" cy="300" rx="70" ry="112" fill="none" stroke="#64748b" strokeOpacity="0.35" />
            <path
              d="M528 300 H752 M640 188 V412"
              stroke="#64748b"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            {/* Trade indicator arcs */}
            <path
              className="hamd-hero-visual__arc"
              d="M545 250 C590 210, 690 210, 735 250"
              fill="none"
              stroke="url(#hamd-hero-route)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 8"
            />
            <path
              className="hamd-hero-visual__arc hamd-hero-visual__arc--b"
              d="M560 350 C610 390, 680 385, 720 340"
              fill="none"
              stroke="#5eead4"
              strokeOpacity="0.65"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeDasharray="3 7"
            />
            {/* Corridor pins */}
            <circle cx="560" cy="265" r="4.5" fill="#53b1fd" />
            <circle cx="720" cy="255" r="4.5" fill="#5eead4" />
            <circle cx="640" cy="330" r="4" fill="#fbbf24" opacity="0.85" />
          </g>
        ) : null}

        {showNetwork ? (
          <g className="hamd-hero-visual__network">
            <path
              d="M430 280 L520 310 L500 360 L430 280 Z M760 290 L820 330 L780 380 L760 290 Z M640 430 L700 470 L620 490 L640 430 Z"
              fill="none"
              stroke="#38bdf8"
              strokeOpacity="0.35"
              strokeWidth="1.25"
            />
            <circle cx="430" cy="280" r="7" fill="url(#hamd-hero-node)" />
            <circle cx="520" cy="310" r="5.5" fill="url(#hamd-hero-node)" />
            <circle cx="500" cy="360" r="5" fill="url(#hamd-hero-node)" />
            <circle cx="820" cy="330" r="7" fill="url(#hamd-hero-node)" />
            <circle cx="780" cy="380" r="5" fill="url(#hamd-hero-node)" />
            <circle cx="700" cy="470" r="6" fill="url(#hamd-hero-node)" />
            <circle cx="620" cy="490" r="5" fill="url(#hamd-hero-node)" />
          </g>
        ) : null}

        {showShipment ? (
          <g className="hamd-hero-visual__shipment">
            <path
              className="hamd-hero-visual__route"
              d="M400 470 C480 430, 560 450, 640 420 C720 390, 780 400, 850 370"
              fill="none"
              stroke="url(#hamd-hero-route)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 10"
            />
            {/* Abstract cargo unit - isometric box */}
            <g className="hamd-hero-visual__cargo">
              <path d="M640 400 L670 385 L700 400 L670 415 Z" fill="#1e3a5f" />
              <path d="M640 400 L670 415 L670 445 L640 430 Z" fill="#0f2744" />
              <path d="M670 415 L700 400 L700 430 L670 445 Z" fill="#164070" />
              <path
                d="M650 408 L660 403 M680 408 L690 403"
                stroke="#93c5fd"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
            </g>
          </g>
        ) : null}
      </svg>

      <ul className="hamd-hero-visual__cards" aria-hidden="true">
        {cards.map((card, index) => (
          <li
            key={card.id}
            className={cx(
              "hamd-hero-visual__card",
              `hamd-hero-visual__card--${index + 1}`,
            )}
          >
            <span className="hamd-hero-visual__card-icon" data-icon={card.id}>
              <CardGlyph kind={card.id} />
            </span>
            <span className="hamd-hero-visual__card-eyebrow">{card.eyebrow}</span>
            <span className="hamd-hero-visual__card-title">{card.title}</span>
            {card.meta ? (
              <span className="hamd-hero-visual__card-meta">{card.meta}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardGlyph({ kind }: { kind: string }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 16,
    height: 16,
    fill: "none",
    "aria-hidden": true as const,
  };
  if (kind.includes("ship")) {
    return (
      <svg {...common}>
        <path
          d="M3 7h11v10H3zM14 10h4l3 3v4h-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind.includes("net")) {
    return (
      <svg {...common}>
        <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="17" r="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M8.2 11 15.5 8M8.2 13l7.3 3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        d="M4 16c4-6 8-8 16-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="14" r="2" fill="currentColor" />
      <circle cx="17" cy="9" r="2" fill="currentColor" />
    </svg>
  );
}

export const defaultHeroVisualCards = defaultCards;
