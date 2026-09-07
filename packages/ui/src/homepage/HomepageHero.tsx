import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ButtonLink } from "../primitives/ButtonLink.js";
import { cx } from "../utils/cx.js";
import {
  HeroVisualSystem,
  type HeroVisualCard,
  type HeroVisualSystemProps,
} from "./HeroVisualSystem.js";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

function useCountUp(target: number, enabled: boolean, durationMs = 900): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!enabled || reduced || target <= 0) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, enabled, reduced, target]);

  return value;
}

export type HeroTrustIndicator = {
  id: string;
  label: string;
};

export type HeroStatistic = {
  id: string;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  source: string;
};

export type HeroVisualMode = "layered" | "image" | "hybrid" | "placeholder";

export type HomepageHeroProps = {
  id?: string;
  brandName?: string;
  /** Secondary affiliation under the operating brand - keep short. */
  groupAffiliation?: string;
  groupHref?: string;
  /** Optional discovery link beside affiliation (e.g. Explore our businesses). */
  groupExploreLabel?: string;
  headline?: string;
  supportingText?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  tertiaryCta?: { href: string; label: string };
  searchLabel?: string;
  searchPlaceholder?: string;
  searchAction?: string;
  onSearchSubmit?: (query: string) => void;
  trustIndicators?: readonly HeroTrustIndicator[];
  statistics?: readonly HeroStatistic[];
  animateCounters?: boolean;
  /**
   * Visual plane mode.
   * - layered (default): SVG procurement system - not stock photography
   * - image: photographic LCP only
   * - hybrid: optional photo base + layered system
   * - placeholder: minimal fallback plane
   */
  visualMode?: HeroVisualMode;
  imageSrc?: string;
  imageSrcSet?: string;
  imageSizes?: string;
  imageAlt?: string;
  /** Lazy-load hybrid photo base (layered SVG remains eager). Default true. */
  lazyHybridImage?: boolean;
  visualCards?: readonly HeroVisualCard[];
  visualLabel?: string;
  visualSystemProps?: Omit<HeroVisualSystemProps, "cards" | "label" | "reduceMotion">;
  visualPlaceholderLabel?: string;
  scrollTargetId?: string;
  scrollLabel?: string;
  className?: string;
};

function HeroStat({
  stat,
  animate,
}: {
  stat: HeroStatistic;
  animate: boolean;
}) {
  const display = useCountUp(stat.value, animate);
  return (
    <div className="hamd-hero__stat">
      <dt className="hamd-hero__stat-value">
        {stat.prefix}
        {display}
        {stat.suffix}
      </dt>
      <dd className="hamd-hero__stat-label">{stat.label}</dd>
      <dd className="hamd-hero__stat-source">{stat.source}</dd>
    </div>
  );
}

/**
 * Accountable Corridor hero - Concept E from docs/48.
 * Visual plane: HeroVisualSystem (layered) by default - not stock photography.
 */
export function HomepageHero({
  id = "homepage-hero",
  brandName = "Almahbub International",
  groupAffiliation,
  groupHref = "/group",
  groupExploreLabel,
  headline = "Global procurement. Local accountability.",
  supportingText = "We source, clarify, quote, and deliver for buyers who need a partner that owns every next step.",
  primaryCta = { href: "/request", label: "Request Procurement" },
  secondaryCta = { href: "/services", label: "Explore Services" },
  tertiaryCta,
  searchLabel = "Start a request",
  searchPlaceholder = "Product, destination, or shipment reference",
  searchAction = "/request",
  onSearchSubmit,
  trustIndicators = [
    { id: "process", label: "Managed end-to-end process" },
    { id: "rooted", label: "Nigeria-rooted partner" },
    { id: "verify", label: "Quotes & tracking you can verify" },
  ],
  statistics = [],
  animateCounters = true,
  visualMode,
  imageSrc,
  imageSrcSet,
  imageSizes = "(max-width: 960px) 100vw, 56vw",
  imageAlt = "Documentary trade operations supporting global procurement",
  lazyHybridImage = true,
  visualCards,
  visualLabel,
  visualSystemProps,
  visualPlaceholderLabel = "Professional procurement visual",
  scrollTargetId = "trust",
  scrollLabel = "Scroll to explore",
  className,
}: HomepageHeroProps) {
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [query, setQuery] = useState("");
  const [entered, setEntered] = useState(false);

  const resolvedMode: HeroVisualMode =
    visualMode ?? (imageSrc ? "hybrid" : "layered");

  useEffect(() => {
    if (reducedMotion) {
      setEntered(true);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const submitSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = query.trim();
      if (onSearchSubmit) {
        onSearchSubmit(trimmed);
        return;
      }
      const url = new URL(searchAction, window.location.origin);
      if (trimmed) {
        url.searchParams.set("q", trimmed);
      }
      window.location.assign(`${url.pathname}${url.search}`);
    },
    [onSearchSubmit, query, searchAction],
  );

  let planeInner: ReactNode = null;
  if (resolvedMode === "image" && imageSrc) {
    planeInner = (
      <img
        className="hamd-hero__image"
        src={imageSrc}
        srcSet={imageSrcSet}
        sizes={imageSizes}
        alt={imageAlt}
        width={1600}
        height={1200}
        decoding="async"
        {...({ fetchpriority: "high" } as Record<string, string>)}
      />
    );
  } else if (resolvedMode === "placeholder") {
    planeInner = (
      <div className="hamd-hero__visual-placeholder" role="img" aria-label={visualPlaceholderLabel}>
        <span className="hamd-hero__visual-placeholder-mark" aria-hidden="true" />
        <span className="hamd-hero__visual-placeholder-label">{visualPlaceholderLabel}</span>
      </div>
    );
  } else {
    planeInner = (
      <>
        {resolvedMode === "hybrid" && imageSrc ? (
          <img
            className="hamd-hero__image"
            src={imageSrc}
            srcSet={imageSrcSet}
            sizes={imageSizes}
            alt=""
            width={1600}
            height={1200}
            decoding="async"
            loading={lazyHybridImage ? "lazy" : "eager"}
            aria-hidden="true"
          />
        ) : null}
        <HeroVisualSystem
          {...visualSystemProps}
          {...(visualCards ? { cards: visualCards } : {})}
          {...(visualLabel ? { label: visualLabel } : {})}
          reduceMotion={reducedMotion}
        />
      </>
    );
  }

  const isSplitVisual =
    resolvedMode === "layered" || resolvedMode === "hybrid" || resolvedMode === "placeholder";

  const copy = (
    <div className="hamd-hero__copy">
      <p className="hamd-hero__brand">
        <span className="hamd-hero__brand-name">{brandName}</span>
        {groupAffiliation || groupExploreLabel ? (
          <span className="hamd-hero__group-cluster">
            {groupAffiliation ? (
              <a href={groupHref} className="hamd-hero__group">
                {groupAffiliation}
              </a>
            ) : null}
            {groupExploreLabel ? (
              <a href={groupHref} className="hamd-hero__group-explore">
                {groupExploreLabel}
                <span aria-hidden="true"> →</span>
              </a>
            ) : null}
          </span>
        ) : null}
      </p>

      <h1 id={`${id}-headline`} className="hamd-hero__headline">
        {headline}
      </h1>

      <p className="hamd-hero__support">{supportingText}</p>

      <div className="hamd-hero__cta-row">
        <ButtonLink href={primaryCta.href} className="hamd-hero__cta-primary">
          {primaryCta.label}
        </ButtonLink>
        <ButtonLink href={secondaryCta.href} variant="secondary" className="hamd-hero__cta-secondary">
          {secondaryCta.label}
        </ButtonLink>
        {tertiaryCta ? (
          <a href={tertiaryCta.href} className="hamd-hero__tertiary">
            {tertiaryCta.label}
          </a>
        ) : null}
      </div>

      <form className="hamd-hero__search" action={searchAction} method="get" onSubmit={submitSearch}>
        <label className="hamd-hero__search-label" htmlFor={searchId}>
          {searchLabel}
        </label>
        <div className="hamd-hero__search-row">
          <input
            ref={inputRef}
            id={searchId}
            name="q"
            type="search"
            className="hamd-hero__search-input"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            enterKeyHint="go"
          />
          <button type="submit" className="hamd-btn hamd-btn--primary hamd-hero__search-submit">
            Continue
          </button>
        </div>
        <p className="hamd-hero__search-hint">
          Starts a procurement request, not a marketplace checkout.
        </p>
      </form>

      <ul className="hamd-hero__trust" aria-label="Trust indicators">
        {trustIndicators.map((item) => (
          <li key={item.id} className="hamd-hero__trust-item">
            {item.label}
          </li>
        ))}
      </ul>

      {statistics.length > 0 ? (
        <dl className="hamd-hero__stats" aria-label="Global statistics">
          {statistics.map((stat) => (
            <HeroStat key={stat.id} stat={stat} animate={animateCounters && !reducedMotion} />
          ))}
        </dl>
      ) : null}
    </div>
  );

  const plane = (
    <div
      className={cx(
        "hamd-hero__plane",
        resolvedMode === "layered" && "hamd-hero__plane--layered",
        resolvedMode === "hybrid" && "hamd-hero__plane--hybrid",
      )}
    >
      {planeInner}
      <div className="hamd-hero__scrim" aria-hidden="true" />
    </div>
  );

  return (
    <section
      id={id}
      className={cx(
        "hamd-hero",
        isSplitVisual && "hamd-hero--split",
        entered && "hamd-hero--entered",
        className,
      )}
      aria-labelledby={`${id}-headline`}
      data-visual-mode={resolvedMode}
    >
      {isSplitVisual ? (
        <div className="hamd-hero__layout">
          <div className="hamd-hero__content">{copy}</div>
          <div className="hamd-hero__stage">{plane}</div>
        </div>
      ) : (
        <>
          {plane}
          <div className="hamd-hero__content hamd-container hamd-container--default">{copy}</div>
        </>
      )}

      {scrollTargetId ? (
        <a href={`#${scrollTargetId}`} className="hamd-hero__scroll" aria-label={scrollLabel}>
          <span className="hamd-hero__scroll-label">{scrollLabel}</span>
          <span className="hamd-hero__scroll-chevron" aria-hidden="true" />
        </a>
      ) : null}
    </section>
  );
}
