import { ButtonLink } from "../primitives/ButtonLink.js";
import { NewsletterCapture } from "../primitives/NewsletterCapture.js";
import { OptimizedImage } from "../primitives/OptimizedImage.js";
import { Section } from "../primitives/Section.js";
import type { TrustPartner, TrustStat } from "./TrustServicesCatalog.js";

export type GroupBusinessItem = {
  id: string;
  name: string;
  href: string;
  focus: string;
  summary: string;
  capabilities: readonly string[];
  ctaHref: string;
  ctaLabel: string;
  note?: string;
  mark?: string;
  mediaLabel?: string;
  /** Official logo path when available (International). Do not invent logos. */
  logoSrc?: string;
};

export type GroupSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  body?: string;
  structureHref?: string;
  /** Primary path into the full group overview page. */
  overviewCta?: { href: string; label: string };
  businesses: readonly GroupBusinessItem[];
};

export function GroupSection({
  id = "almahbub-group",
  eyebrow = "Part of Almahbub Group",
  title,
  description,
  body,
  structureHref = "/group",
  overviewCta = { href: "/group", label: "Explore Almahbub Group" },
  businesses,
}: GroupSectionProps) {
  return (
    <Section id={id} eyebrow={eyebrow} title={title} description={description} tone="subtle">
      {body ? <p className="hamd-overview__body">{body}</p> : null}
      {businesses.length > 0 ? (
        <div
          className="hamd-group-structure hamd-group-structure--compact"
          aria-label={`${title} relationship`}
        >
          <div className="hamd-group-structure__parent">
            <p className="hamd-group-structure__kicker">Parent group</p>
            <p className="hamd-group-structure__name">
              <a href={structureHref}>{title}</a>
            </p>
          </div>
          <div className="hamd-group-structure__connector" aria-hidden="true">
            <span className="hamd-group-structure__arrow" />
          </div>
          <ul className="hamd-group-structure__children">
            {businesses.map((business) => {
              const isExport = /integrated export/i.test(business.name);
              return (
                <li
                  key={business.id}
                  className={
                    isExport
                      ? "hamd-group-structure__child hamd-group-structure__child--export"
                      : "hamd-group-structure__child hamd-group-structure__child--international"
                  }
                >
                  <p className="hamd-group-structure__kicker">
                    {isExport ? "Agro and export" : "Procurement and supply"}
                  </p>
                  <h3 className="hamd-group-structure__child-name">
                    <a
                      href={business.href}
                      {...(isExport ? { "data-testid": "aie-portal-entry" } : {})}
                    >
                      {business.name}
                    </a>
                  </h3>
                  <p className="hamd-group-structure__child-focus">{business.focus}</p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {overviewCta ? (
        <div className="hamd-group-section__cta">
          <ButtonLink href={overviewCta.href} variant="secondary">
            {overviewCta.label}
            <span aria-hidden="true"> →</span>
          </ButtonLink>
        </div>
      ) : null}
      <ul className="hamd-group-grid">
        {businesses.map((business) => (
          <li key={business.id}>
            <article className="hamd-group-card">
              {business.mediaLabel || business.mark || business.logoSrc ? (
                <div className="hamd-group-card__media" aria-hidden="true">
                  {business.logoSrc ? (
                    <span className="hamd-group-mark hamd-group-mark--md hamd-group-mark--logo">
                      <img src={business.logoSrc} alt="" width={48} height={48} decoding="async" />
                    </span>
                  ) : (
                    <span className="hamd-group-mark hamd-group-mark--md hamd-group-mark--type">
                      <span className="hamd-group-mark__letters">
                        {business.mark ?? business.name.slice(0, 2).toUpperCase()}
                      </span>
                    </span>
                  )}
                  {business.mediaLabel ? (
                    <p className="hamd-group-card__media-label">{business.mediaLabel}</p>
                  ) : null}
                </div>
              ) : null}
              <h3 className="hamd-group-card__title">
                <a href={business.href}>{business.name}</a>
              </h3>
              <p className="hamd-group-card__focus">{business.focus}</p>
              <p className="hamd-group-card__summary">{business.summary}</p>
              <ul className="hamd-group-card__caps">
                {business.capabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {business.note ? <p className="hamd-group-card__note">{business.note}</p> : null}
              <div className="hamd-group-card__actions">
                <ButtonLink href={business.href} variant="secondary">
                  View profile
                </ButtonLink>
                <ButtonLink href={business.ctaHref} variant="primary">
                  {business.ctaLabel}
                </ButtonLink>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export type SisterBusinessDiscoveryProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  focus: string;
  href: string;
  ctaLabel: string;
  capabilities?: readonly string[];
  mediaLabel?: string;
  /** Typographic provisional mark only, not an official logo. */
  mark?: string;
  groupHref?: string;
  groupLabel?: string;
  /** Optional Group framing above the discovery panel. */
  groupEyebrow?: string;
  groupTagline?: string;
  /** Current website (International) panel. */
  currentLabel?: string;
  currentName?: string;
  currentHref?: string;
  currentFocus?: string;
  currentSummary?: string;
  currentDescription?: string;
  currentCapabilities?: readonly string[];
  currentLogoSrc?: string;
  currentMediaLabel?: string;
  currentCta?: { href: string; label: string };
  logoSrc?: string;
  /** Sister panel kicker, e.g. Explore our other business. */
  exploreLabel?: string;
  /** Visual tone: export uses a distinct but brand-compatible accent. */
  tone?: "default" | "export";
};

/**
 * Homepage business relationship transition.
 * After International introduction; communicates Group → current → sister.
 */
export function SisterBusinessDiscoverySection({
  id = "sister-business-discovery",
  eyebrow,
  title,
  description,
  focus,
  href,
  ctaLabel,
  capabilities = [],
  mediaLabel,
  mark,
  groupHref = "/group",
  groupLabel = "Part of Almahbub Group",
  groupEyebrow,
  groupTagline,
  currentLabel = "Current website",
  currentName,
  currentHref = "/businesses/almahbub-international",
  currentFocus,
  currentSummary,
  currentDescription,
  currentCapabilities = [],
  currentLogoSrc,
  currentMediaLabel,
  currentCta,
  exploreLabel = "Explore our other business",
  logoSrc,
  tone = "default",
}: SisterBusinessDiscoveryProps) {
  const isRelation = Boolean(groupEyebrow && currentName);

  return (
    <Section
      id={id}
      eyebrow={groupEyebrow ?? eyebrow}
      title={groupEyebrow ? (groupTagline ?? title) : title}
      description={groupEyebrow ? undefined : focus}
      className={
        tone === "export"
          ? "hamd-section--export-discovery hamd-section--business-relation"
          : "hamd-section--business-relation"
      }
    >
      {isRelation ? (
        <div className="hamd-business-relation" aria-label="Almahbub Group businesses">
          <div className="hamd-business-relation__intro">
            <p className="hamd-business-relation__intro-copy">
              You are exploring Almahbub International. Almahbub Group also includes another
              separately registered business.
            </p>
            <p className="hamd-business-relation__group-link">
              <a href={groupHref}>{groupLabel}</a>
            </p>
          </div>

          <div className="hamd-business-relation__flow">
            <article className="hamd-business-relation__panel hamd-business-relation__panel--current">
              <p className="hamd-business-relation__kicker">{currentLabel}</p>
              <div className="hamd-business-relation__identity">
                {currentLogoSrc ? (
                  <span className="hamd-group-mark hamd-group-mark--md hamd-group-mark--logo" aria-hidden="true">
                    <img src={currentLogoSrc} alt="" width={40} height={40} decoding="async" />
                  </span>
                ) : null}
                <div className="hamd-business-relation__identity-text">
                  <h3 className="hamd-business-relation__name">
                    <a href={currentHref}>{currentName}</a>
                  </h3>
                  {currentFocus ? (
                    <p className="hamd-business-relation__focus">{currentFocus}</p>
                  ) : null}
                </div>
              </div>
              {currentSummary ? (
                <p className="hamd-business-relation__copy">{currentSummary}</p>
              ) : null}
              {currentDescription ? (
                <p className="hamd-business-relation__copy">{currentDescription}</p>
              ) : null}
              {currentCapabilities.length > 0 ? (
                <ul className="hamd-business-relation__caps">
                  {currentCapabilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {currentMediaLabel ? (
                <p className="hamd-business-relation__media-label">{currentMediaLabel}</p>
              ) : null}
              {currentCta ? (
                <div className="hamd-business-relation__actions">
                  <ButtonLink href={currentHref} variant="secondary">
                    View profile
                  </ButtonLink>
                  <ButtonLink href={currentCta.href} variant="primary">
                    {currentCta.label}
                  </ButtonLink>
                </div>
              ) : null}
            </article>

            <div className="hamd-business-relation__bridge" aria-hidden="true">
              <span className="hamd-business-relation__bridge-line" />
              <span className="hamd-business-relation__bridge-label">and</span>
              <span className="hamd-business-relation__bridge-line" />
            </div>

            <article
              className={
                tone === "export"
                  ? "hamd-business-relation__panel hamd-business-relation__panel--sister hamd-business-relation__panel--export"
                  : "hamd-business-relation__panel hamd-business-relation__panel--sister"
              }
            >
              <p className="hamd-business-relation__kicker">{exploreLabel}</p>
              <p className="hamd-business-relation__interest">{eyebrow}</p>
              <div className="hamd-business-relation__identity">
                {logoSrc ? (
                  <span className="hamd-group-mark hamd-group-mark--md hamd-group-mark--logo" aria-hidden="true">
                    <img src={logoSrc} alt="" width={40} height={40} decoding="async" />
                  </span>
                ) : (
                  <span className="hamd-group-mark hamd-group-mark--md hamd-group-mark--type" aria-hidden="true">
                    <span className="hamd-group-mark__letters">{mark ?? "IE"}</span>
                  </span>
                )}
                <div className="hamd-business-relation__identity-text">
                  <h3 className="hamd-business-relation__name">
                    <a href={href} data-testid="aie-portal-entry">
                      {title.replace(/^Explore\s+/i, "")}
                    </a>
                  </h3>
                  <p className="hamd-business-relation__focus">{focus}</p>
                </div>
              </div>
              {description ? <p className="hamd-business-relation__copy">{description}</p> : null}
              {capabilities.length > 0 ? (
                <ul className="hamd-business-relation__caps">
                  {capabilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {mediaLabel ? (
                <p className="hamd-business-relation__media-label">{mediaLabel}</p>
              ) : null}
              <div className="hamd-business-relation__actions">
                <ButtonLink
                  href={href}
                  variant="primary"
                  className="hamd-sister-discovery__cta"
                  data-testid="aie-portal-entry-cta"
                >
                  {ctaLabel}
                </ButtonLink>
              </div>
            </article>
          </div>
        </div>
      ) : (
        <div
          className={
            tone === "export"
              ? "hamd-sister-discovery hamd-sister-discovery--export"
              : "hamd-sister-discovery"
          }
        >
          <div className="hamd-sister-discovery__visual" aria-hidden="true">
            <span className="hamd-group-mark hamd-group-mark--lg hamd-group-mark--type">
              <span className="hamd-group-mark__letters">{mark ?? "IE"}</span>
            </span>
            {mediaLabel ? <p className="hamd-sister-discovery__media-label">{mediaLabel}</p> : null}
          </div>
          <div className="hamd-sister-discovery__body">
            <p className="hamd-sister-discovery__kicker">{eyebrow}</p>
            <h3 className="hamd-sister-discovery__title">{title}</h3>
            <p className="hamd-sister-discovery__focus">{focus}</p>
            <p className="hamd-sister-discovery__affiliation">
              <a href={groupHref}>{groupLabel}</a>
            </p>
            {description ? <p className="hamd-sister-discovery__copy">{description}</p> : null}
            {capabilities.length > 0 ? (
              <ul className="hamd-sister-discovery__caps">
                {capabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            <div className="hamd-sister-discovery__actions">
              <ButtonLink
                href={href}
                variant="primary"
                className="hamd-sister-discovery__cta"
                data-testid="aie-portal-entry-cta"
              >
                {ctaLabel}
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

export type CompanyOverviewSectionProps = {
  id?: string | undefined;
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  body: readonly string[];
  primaryCta?: { href: string; label: string } | undefined;
  secondaryCta?: { href: string; label: string } | undefined;
  imageSrc?: string | undefined;
  imageAlt?: string | undefined;
};

export function CompanyOverviewSection({
  id = "company-overview",
  eyebrow = "Company",
  title,
  description,
  body,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt = "",
}: CompanyOverviewSectionProps) {
  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      spacing="spacious"
      actions={
        primaryCta || secondaryCta ? (
          <div className="hamd-overview__actions">
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
      <div className="hamd-overview__layout">
        <div className="hamd-overview__copy">
          {body.map((paragraph, index) => (
            <p key={`${id}-p-${index}`}>{paragraph}</p>
          ))}
        </div>
        <div className="hamd-overview__media">
          {imageSrc ? (
            <OptimizedImage
              src={imageSrc}
              alt={imageAlt}
              className="hamd-overview__image"
              sizes="(max-width: 960px) 100vw, 40vw"
              width={720}
              height={480}
            />
          ) : (
            <div
              className="hamd-overview__media-fallback"
              role="img"
              aria-label={imageAlt || "Company operations"}
            >
              <span>Operations &amp; accountability</span>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

export type SupplierNetworkSectionProps = {
  id?: string | undefined;
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  partners: readonly TrustPartner[];
  viewAllHref?: string | undefined;
  viewAllLabel?: string | undefined;
};

export function SupplierNetworkSection({
  id = "supplier-network",
  eyebrow = "Supplier network",
  title,
  description,
  partners,
  viewAllHref = "/services",
  viewAllLabel = "View supplier network",
}: SupplierNetworkSectionProps) {
  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      tone="subtle"
      actions={
        viewAllHref ? (
          <ButtonLink href={viewAllHref} variant="secondary">
            {viewAllLabel}
          </ButtonLink>
        ) : undefined
      }
    >
      <ul className="hamd-network__grid" aria-label="Supplier and logistics partners">
        {partners.map((partner) => {
          const content = (
            <>
              {partner.logoSrc ? (
                <OptimizedImage
                  src={partner.logoSrc}
                  alt=""
                  className="hamd-network__logo"
                  width={120}
                  height={40}
                />
              ) : (
                <span className="hamd-network__mark" aria-hidden="true" />
              )}
              <span className="hamd-network__name">{partner.name}</span>
              <span className="hamd-network__rel">{partner.relationship}</span>
            </>
          );
          return (
            <li key={partner.id} className="hamd-network__item">
              {partner.href ? (
                <a href={partner.href} className="hamd-network__card">
                  {content}
                </a>
              ) : (
                <div className="hamd-network__card">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** Sourced platform metrics - static values only (no count-up). */
export type PlatformStatisticsSectionProps = {
  id?: string | undefined;
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  stats: readonly TrustStat[];
  methodologyHref?: string | undefined;
  methodologyLabel?: string | undefined;
};

export function PlatformStatisticsSection({
  id = "platform-statistics",
  eyebrow = "Platform statistics",
  title,
  description,
  stats,
  methodologyHref = "/about#methodology",
  methodologyLabel = "How we measure",
}: PlatformStatisticsSectionProps) {
  return (
    <Section id={id} eyebrow={eyebrow} title={title} description={description} spacing="compact">
      <dl className="hamd-stats__grid">
        {stats.map((stat) => (
          <div key={stat.id} className="hamd-stats__item">
            <dt className="hamd-stats__value">{stat.value}</dt>
            <dd className="hamd-stats__label">{stat.label}</dd>
            <dd className="hamd-stats__source">
              {stat.sourceHref ? <a href={stat.sourceHref}>{stat.source}</a> : stat.source}
            </dd>
          </div>
        ))}
      </dl>
      {methodologyHref ? (
        <p className="hamd-stats__methodology">
          <a href={methodologyHref}>{methodologyLabel}</a>
        </p>
      ) : null}
    </Section>
  );
}

export type NewsletterSectionProps = {
  id?: string | undefined;
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  privacyHref?: string | undefined;
  action?: string | undefined;
  onSubscribe?: ((email: string) => void | Promise<void>) | undefined;
  helpText?: string | undefined;
  successMessage?: string | undefined;
};

export function NewsletterSection({
  id = "newsletter",
  eyebrow = "Newsletter",
  title,
  description,
  privacyHref,
  action,
  onSubscribe,
  helpText,
  successMessage,
}: NewsletterSectionProps) {
  return (
    <Section id={id} eyebrow={eyebrow} title={title} description={description} width="narrow" spacing="compact">
      <NewsletterCapture
        {...(privacyHref ? { privacyHref } : {})}
        {...(action ? { action } : {})}
        {...(onSubscribe ? { onSubmit: onSubscribe } : {})}
        {...(helpText ? { helpText } : {})}
        {...(successMessage ? { successMessage } : {})}
        tone="default"
      />
    </Section>
  );
}
