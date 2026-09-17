import { Link } from "react-router-dom";
import { GROUP, GROUP_BUSINESSES, type GroupBusiness } from "../content/group.js";
import { BUSINESS_LOGOS } from "../content/business-logos.js";
import { cx } from "./cx.js";

type Props = {
  /** Highlight the current business profile when on a business page. */
  currentSlug?: string;
  className?: string;
  compact?: boolean;
  /** Show capability focus under each business name. */
  showFocus?: boolean;
  /** Card-style corporate selector (group / portal). */
  variant?: "links" | "panel";
};

/**
 * Almahbub Group business discovery - not a second International navbar.
 */
export function GroupBusinessSwitcher({
  currentSlug,
  className,
  compact = false,
  showFocus = false,
  variant = "links",
}: Props) {
  const isPanel = variant === "panel" || showFocus;

  return (
    <nav
      className={cx(
        "hamd-group-switcher",
        compact && "hamd-group-switcher--compact",
        isPanel && "hamd-group-switcher--detailed",
        variant === "panel" && "hamd-group-switcher--panel",
        className,
      )}
      aria-label="Almahbub Group businesses"
    >
      <div className="hamd-group-switcher__heading">
        <p className="hamd-group-switcher__label">
          <Link to={GROUP.href}>{GROUP.name}</Link>
        </p>
        <p className="hamd-group-switcher__sublabel">{GROUP.switcherLabel}</p>
      </div>
      <ul className="hamd-group-switcher__list">
        {GROUP_BUSINESSES.map((business) => {
          const current = currentSlug === business.slug;
          const isExport = business.slug === "almahbub-integrated-export";
          return (
            <li
              key={business.id}
              className={cx(
                "hamd-group-switcher__item",
                isExport && "hamd-group-switcher__item--export",
                !isExport && "hamd-group-switcher__item--international",
                current && "is-current",
              )}
            >
              <Link
                to={business.href}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "hamd-group-switcher__link",
                  current && "is-current",
                )}
                {...(isExport ? { "data-testid": "aie-portal-entry-switcher" } : {})}
              >
                {business.name}
              </Link>
              {isPanel ? (
                <p className="hamd-group-switcher__focus">{business.focusShort}</p>
              ) : null}
              {current ? (
                <p className="hamd-group-switcher__current-tag">Current</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Alias - emphasises discovery / switcher usage. */
export const BusinessDiscovery = GroupBusinessSwitcher;

export function GroupBusinessMark({
  business,
  size = "md",
}: {
  business: GroupBusiness;
  size?: "sm" | "md" | "lg";
}) {
  const isInternational = business.slug === "almahbub-international";
  const isExport = business.slug === "almahbub-integrated-export";
  const logoSrc = isInternational
    ? BUSINESS_LOGOS.international.src
    : isExport
      ? BUSINESS_LOGOS.export.src
      : null;
  return (
    <div
      className={cx(
        "hamd-group-mark",
        `hamd-group-mark--${size}`,
        logoSrc ? "hamd-group-mark--logo" : "hamd-group-mark--type",
      )}
      aria-hidden="true"
    >
      {logoSrc ? (
        <img src={logoSrc} alt="" width={48} height={48} decoding="async" />
      ) : (
        <span className="hamd-group-mark__letters">{business.mark}</span>
      )}
    </div>
  );
}
