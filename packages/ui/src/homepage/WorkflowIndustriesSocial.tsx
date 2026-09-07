import {
  useEffect,
  useRef,
  useState,
} from "react";
import { ButtonLink } from "../primitives/ButtonLink.js";
import { FaqAccordion } from "../primitives/FaqAccordion.js";
import { Section } from "../primitives/Section.js";
import {
  InteractiveProcurementTimeline,
  defaultProcurementTimelineSteps,
  type InteractiveProcurementTimelineProps,
  type ProcurementTimelineStep,
} from "./InteractiveProcurementTimeline.js";

export type WorkflowStep = {
  id: string;
  title: string;
  description: string;
};

export type ProcurementWorkflowSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** @deprecated Prefer `timelineSteps` for the interactive journey. */
  steps?: readonly WorkflowStep[];
  timelineSteps?: readonly ProcurementTimelineStep[];
  currentStepId?: string;
  defaultStepId?: string;
  onStepChange?: InteractiveProcurementTimelineProps["onStepChange"];
  primaryCta: { href: string; label: string };
};

export function ProcurementWorkflowSection({
  id = "procurement-workflow",
  eyebrow = "How it works",
  title,
  description,
  steps,
  timelineSteps,
  currentStepId,
  defaultStepId = "request",
  onStepChange,
  primaryCta,
}: ProcurementWorkflowSectionProps) {
  const interactiveSteps =
    timelineSteps ??
    (steps
      ? steps.map((step) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          nextHint: "Continue to the next stage in the procurement journey.",
          duration: "Varies",
        }))
      : defaultProcurementTimelineSteps);

  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      spacing="spacious"
      actions={<ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>}
    >
      <InteractiveProcurementTimeline
        steps={interactiveSteps}
        {...(currentStepId ? { currentStepId } : {})}
        defaultStepId={defaultStepId}
        {...(onStepChange ? { onStepChange } : {})}
      />
    </Section>
  );
}

export type IndustryItem = {
  id: string;
  name: string;
  challenge: string;
  outcome: string;
  href: string;
};

export type IndustriesSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  industries: readonly IndustryItem[];
};

export function IndustriesSection({
  id = "industries",
  eyebrow = "Industries",
  title,
  description,
  industries,
}: IndustriesSectionProps) {
  return (
    <Section id={id} eyebrow={eyebrow} title={title} description={description} tone="subtle">
      <div className="hamd-industries__visual" aria-hidden="true">
        <svg viewBox="0 0 640 160" role="presentation" width="100%" height="120">
          <rect x="0" y="0" width="640" height="160" rx="16" fill="currentColor" opacity="0.06" />
          <g fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55">
            <rect x="36" y="36" width="88" height="88" rx="10" />
            <rect x="156" y="28" width="72" height="104" rx="8" />
            <circle cx="312" cy="80" r="42" />
            <rect x="388" y="40" width="100" height="80" rx="6" />
            <path d="M532 116 V44 h56 v72" />
          </g>
          <text x="36" y="148" fontSize="12" fill="currentColor" opacity="0.7">
            Commercial equipment · technology · facilities · retail · industrial · textile
          </text>
        </svg>
      </div>
      <ul className="hamd-industries__grid">
        {industries.map((industry) => (
          <li key={industry.id}>
            <a href={industry.href} className="hamd-industries__card">
              <h3 className="hamd-industries__name">{industry.name}</h3>
              <p className="hamd-industries__challenge">{industry.challenge}</p>
              <p className="hamd-industries__outcome">{industry.outcome}</p>
              <span className="hamd-industries__cta">View industry focus</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export type TestimonialItem = {
  id: string;
  quote: string;
  name: string;
  role: string;
  organization: string;
  caseHref?: string;
  portraitSrc?: string;
};

export type TestimonialsSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  testimonials: readonly TestimonialItem[];
  /** Auto-advance interval in ms. Disabled when ≤1 quote. */
  autoRotateMs?: number;
};

export function TestimonialsSection({
  id = "testimonials",
  eyebrow = "Client voices",
  title,
  description,
  testimonials,
  autoRotateMs = 3000,
}: TestimonialsSectionProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const reduced = useRef(false);
  const count = testimonials.length;
  const multi = count > 1;

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    const phone = window.matchMedia("(max-width: 639px)");
    const tablet = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      if (phone.matches) setVisibleCount(1);
      else if (tablet.matches) setVisibleCount(2);
      else setVisibleCount(3);
    };
    apply();
    phone.addEventListener("change", apply);
    tablet.addEventListener("change", apply);
    return () => {
      phone.removeEventListener("change", apply);
      tablet.removeEventListener("change", apply);
    };
  }, []);

  const step = Math.max(1, Math.min(visibleCount, count));

  useEffect(() => {
    setIndex((current) => (count === 0 ? 0 : current % count));
  }, [count]);

  useEffect(() => {
    if (!multi || paused || autoRotateMs <= 0) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, autoRotateMs);
    return () => window.clearInterval(timer);
  }, [autoRotateMs, count, cycleKey, multi, paused]);

  if (count === 0) return null;

  const go = (delta: number) => {
    setIndex((current) => (current + delta + count) % count);
    setCycleKey((value) => value + 1);
  };

  return (
    <Section id={id} eyebrow={eyebrow} title={title} description={description}>
      <div
        className="hamd-testimonials"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
      >
        <div
          className="hamd-testimonials__viewport"
          role="region"
          aria-roledescription="carousel"
          aria-label={title}
        >
          <ul
            className="hamd-testimonials__track"
            style={{
              width: `${(count / step) * 100}%`,
              transform: `translateX(-${(index * 100) / count}%)`,
              transition: reduced.current ? "none" : "transform 420ms cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            {testimonials.map((item) => {
              const identity = [item.name, item.role, item.organization]
                .map((part) => part.trim())
                .filter(Boolean)
                .join(", ");
              const card = (
                <>
                  <span className="hamd-testimonials__mark" aria-hidden="true">
                    “
                  </span>
                  <blockquote className="hamd-testimonials__quote">
                    <p>{item.quote}</p>
                  </blockquote>
                  {identity ? (
                    <figcaption className="hamd-testimonials__caption">{identity}</figcaption>
                  ) : null}
                </>
              );
              return (
                <li
                  key={item.id}
                  className="hamd-testimonials__slide"
                  style={{ width: `${100 / count}%` }}
                  data-testid="testimonial-card"
                >
                  {item.caseHref ? (
                    <a className="hamd-testimonials__card hamd-testimonials__card--link" href={item.caseHref}>
                      {card}
                    </a>
                  ) : (
                    <article className="hamd-testimonials__card">{card}</article>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        {multi ? (
          <div className="hamd-testimonials__controls">
            <button
              type="button"
              className="hamd-testimonials__nav"
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
            >
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path
                  d="M12.5 4.5L7 10l5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className="hamd-testimonials__status" aria-live="polite">
              Showing {index + 1} of {count}
            </span>
            <button
              type="button"
              className="hamd-testimonials__nav"
              onClick={() => go(1)}
              aria-label="Next testimonial"
            >
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path
                  d="M7.5 4.5L13 10l-5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: readonly FaqItem[];
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export function FaqSection({
  id = "faq",
  eyebrow = "FAQ",
  title,
  description,
  items,
  primaryCta,
  secondaryCta,
}: FaqSectionProps) {
  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      width="narrow"
      spacing="compact"
      actions={
        primaryCta || secondaryCta ? (
          <div className="hamd-faq__actions">
            {primaryCta ? <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink> : null}
            {secondaryCta ? (
              <ButtonLink href={secondaryCta.href} variant="secondary">
                {secondaryCta.label}
              </ButtonLink>
            ) : null}
          </div>
        ) : undefined
      }
    >
      <FaqAccordion items={items} />
    </Section>
  );
}

export type WhyChooseReason = {
  id: string;
  title: string;
  description: string;
};

export type WhyChooseUsSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  reasons: readonly WhyChooseReason[];
  primaryCta?: { href: string; label: string };
};

/** Why Choose Us - accountable differentiators (V2, not V1 icon collage). */
export function WhyChooseUsSection({
  id = "why-choose-us",
  eyebrow = "Why Almahbub",
  title,
  description,
  reasons,
  primaryCta,
}: WhyChooseUsSectionProps) {
  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      tone="subtle"
      spacing="spacious"
      actions={
        primaryCta ? (
          <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
        ) : undefined
      }
    >
      <ul className="hamd-why__grid">
        {reasons.map((reason) => (
          <li key={reason.id} className="hamd-why__card">
            <h3 className="hamd-why__title">{reason.title}</h3>
            <p className="hamd-why__description">{reason.description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export type CtaSectionProps = {
  id?: string;
  title: string;
  description: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  reassurance?: string;
};

export function CtaSection({
  id = "request-cta",
  title,
  description,
  primaryCta,
  secondaryCta,
  reassurance,
}: CtaSectionProps) {
  return (
    <section
      id={id}
      className="hamd-section hamd-section--cta hamd-section--spacious"
      aria-labelledby={`${id}-title`}
    >
      <div className="hamd-container hamd-container--narrow hamd-cta">
        <h2 id={`${id}-title`} className="hamd-section__title">
          {title}
        </h2>
        <p className="hamd-section__description">{description}</p>
        {reassurance ? <p className="hamd-cta__reassurance">{reassurance}</p> : null}
        <div className="hamd-cta__actions">
          <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
          {secondaryCta ? (
            <ButtonLink href={secondaryCta.href} variant="secondary">
              {secondaryCta.label}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}
