import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { NewsletterCapture } from "../primitives/NewsletterCapture.js";
import {
  DEFAULT_POWERED_BY_LABEL,
  PoweredByAttribution,
} from "../primitives/PoweredByAttribution.js";
import { cx } from "../utils/cx.js";

export type FooterLink = {
  id: string;
  label: string;
  href: string;
  /** Short capability line under group business links. */
  summary?: string;
};

export type FooterOffice = {
  id: string;
  city: string;
  address: string;
  href?: string;
};

export type FooterSocialLink = {
  id: string;
  label: string;
  href: string;
  icon?: "linkedin" | "x" | "youtube" | "generic";
};

export type FooterContact = {
  email?: string;
  phone?: string;
  href?: string;
  responseNote?: string;
};

export type GlobalFooterProps = {
  brandName?: string;
  brandHref?: string;
  tagline?: string;
  groupName?: string;
  groupHref?: string;
  businessLinks?: readonly FooterLink[];
  companyLinks?: readonly FooterLink[];
  productLinks?: readonly FooterLink[];
  industryLinks?: readonly FooterLink[];
  serviceLinks?: readonly FooterLink[];
  supportLinks?: readonly FooterLink[];
  resourceLinks?: readonly FooterLink[];
  legalLinks?: readonly FooterLink[];
  offices?: readonly FooterOffice[];
  contact?: FooterContact;
  /** Verified profiles only - omit or pass [] until URLs are confirmed. */
  socialLinks?: readonly FooterSocialLink[];
  newsletterAction?: string | undefined;
  newsletterPrivacyHref?: string | undefined;
  onNewsletterSubmit?: ((email: string) => void | Promise<void>) | undefined;
  newsletterSuccessMessage?: string | undefined;
  poweredByHref?: string | undefined;
  poweredByLabel?: string | undefined;
  copyrightYear?: number | undefined;
  /** Emit Organization JSON-LD inside the footer landmark. */
  includeJsonLd?: boolean | undefined;
  organizationUrl?: string | undefined;
  className?: string | undefined;
};

export const defaultFooterLinks = {
  company: [
    { id: "home", label: "Home", href: "/" },
    { id: "about", label: "About", href: "/about" },
    { id: "group", label: "Almahbub Group", href: "/group" },
    { id: "request", label: "Request Procurement", href: "/contact" },
    { id: "signin", label: "Sign in", href: "/login" },
  ],
  products: [
    { id: "catalog", label: "Product Catalog", href: "/products" },
    { id: "categories", label: "Categories", href: "/products" },
  ],
  industries: [
    { id: "all-industries", label: "Industries", href: "/industries" },
  ],
  services: [
    { id: "all-services", label: "Services", href: "/services" },
  ],
  support: [
    { id: "contact", label: "Contact", href: "/contact" },
    { id: "faq", label: "FAQ", href: "/faq" },
  ],
  resources: [] as const,
  legal: [
    { id: "privacy", label: "Privacy Policy", href: "/privacy" },
    { id: "terms", label: "Terms", href: "/terms" },
    { id: "cookies", label: "Cookie Policy", href: "/cookies" },
  ],
} as const satisfies Record<string, readonly FooterLink[]>;

const DESKTOP_MQ = "(min-width: 768px)";

/**
 * Premium enterprise footer - durable orientation, support, legal, and
 * footer-only HAQQ TECH attribution (Brand Handbook §7.5).
 * Aligns with docs/56 Footer Experience blueprint.
 */
export function GlobalFooter({
  brandName = "Almahbub International",
  brandHref = "/",
  tagline = "Global procurement, local accountability.",
  groupName,
  groupHref = "/group",
  businessLinks = [],
  companyLinks = defaultFooterLinks.company,
  productLinks = defaultFooterLinks.products,
  industryLinks = defaultFooterLinks.industries,
  serviceLinks = defaultFooterLinks.services,
  supportLinks = defaultFooterLinks.support,
  resourceLinks = defaultFooterLinks.resources,
  legalLinks = defaultFooterLinks.legal,
  offices = [
    {
      id: "ilorin",
      city: "Ilorin",
      address: "Oye's complex Grace Land junction along Sanrab, Tanke Rd, University Rd, Ilorin 240103, Kwara",
      href: "/contact#ilorin",
    },
  ],
  contact = {
    email: "almahbubinternational@gmail.com",
    href: "/contact",
    responseNote: "Typical response within 1 to 2 business days.",
  },
  socialLinks = [],
  newsletterAction = "/newsletter",
  newsletterPrivacyHref = "/privacy",
  onNewsletterSubmit,
  newsletterSuccessMessage,
  poweredByHref,
  poweredByLabel = DEFAULT_POWERED_BY_LABEL,
  copyrightYear = new Date().getFullYear(),
  includeJsonLd = false,
  organizationUrl = "https://almahbub.com",
  className,
}: GlobalFooterProps) {
  const newsletterId = useId();
  const navRef = useRef<HTMLElement>(null);

  // SSR/SEO: columns render open so all links are in the DOM.
  // On small screens only, collapse into accordion (progressive enhancement).
  useEffect(() => {
    const root = navRef.current;
    if (!root) return;

    const sync = (desktop: boolean) => {
      root.querySelectorAll<HTMLDetailsElement>("details.hamd-footer__accordion").forEach((el) => {
        el.open = desktop;
      });
    };

    const media = window.matchMedia(DESKTOP_MQ);
    sync(media.matches);
    const onChange = () => sync(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <footer className={cx("hamd-footer", className)} data-testid="global-footer">
      {includeJsonLd ? (
        <FooterSeoJsonLd
          organizationName={brandName}
          url={organizationUrl}
          {...(contact.email ? { contactEmail: contact.email } : {})}
        />
      ) : null}

      <div className="hamd-footer__glow" aria-hidden="true" />

      <div className="hamd-footer__inner">
        <div className="hamd-footer__identity">
          {groupName ? (
            <p className="hamd-footer__group">
              <a href={groupHref}>{groupName}</a>
            </p>
          ) : null}
          {businessLinks.length > 0 ? (
            <ul className="hamd-footer__businesses" aria-label="Almahbub Group businesses">
              {businessLinks.map((link, index) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className={
                      index === 0
                        ? "hamd-footer__brand-link"
                        : "hamd-footer__business-link"
                    }
                    {...(link.href === "/businesses/almahbub-integrated-export"
                      ? { "data-testid": "aie-portal-entry-footer" }
                      : {})}
                  >
                    {index === 0 ? (
                      <>
                        <span className="hamd-footer__mark" aria-hidden="true" />
                        <h2 className="hamd-footer__brand">{link.label}</h2>
                      </>
                    ) : (
                      <span className="hamd-footer__business-name">{link.label}</span>
                    )}
                  </a>
                  {link.summary ? (
                    <p className="hamd-footer__business-summary">{link.summary}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <>
              <a href={brandHref} className="hamd-footer__brand-link">
                <span className="hamd-footer__mark" aria-hidden="true" />
                <h2 className="hamd-footer__brand">{brandName}</h2>
              </a>
              <p className="hamd-footer__tagline">{tagline}</p>
            </>
          )}

          {offices.length > 0 ? (
            <div className="hamd-footer__offices">
              <h3 className="hamd-footer__label">Offices</h3>
              <ul>
                {offices.map((office) => (
                  <li key={office.id}>
                    {office.href ? (
                      <a href={office.href}>
                        <span className="hamd-footer__office-city">{office.city}</span>
                        <span className="hamd-footer__office-address">{office.address}</span>
                      </a>
                    ) : (
                      <>
                        <span className="hamd-footer__office-city">{office.city}</span>
                        <span className="hamd-footer__office-address">{office.address}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="hamd-footer__contact">
            <h3 className="hamd-footer__label">Contact</h3>
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="hamd-footer__contact-line">
                {contact.email}
              </a>
            ) : null}
            {contact.phone ? (
              <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hamd-footer__contact-line">
                {contact.phone}
              </a>
            ) : null}
            {contact.href ? (
              <a href={contact.href} className="hamd-footer__contact-line">
                Contact page
              </a>
            ) : null}
            {contact.responseNote ? (
              <p className="hamd-footer__note">{contact.responseNote}</p>
            ) : null}
          </div>

          {socialLinks.length > 0 ? (
            <ul className="hamd-footer__social" aria-label="Social media">
              {socialLinks.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    rel="noopener noreferrer"
                    className="hamd-footer__social-link"
                  >
                    <SocialGlyph kind={item.icon ?? "generic"} />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav className="hamd-footer__nav" aria-label="Footer" ref={navRef}>
          {companyLinks.length > 0 ? <FooterColumn title="Company" links={companyLinks} /> : null}
          {productLinks.length > 0 ? <FooterColumn title="Products" links={productLinks} /> : null}
          {industryLinks.length > 0 ? (
            <FooterColumn title="Industries" links={industryLinks} />
          ) : null}
          {serviceLinks.length > 0 ? <FooterColumn title="Services" links={serviceLinks} /> : null}
          {supportLinks.length > 0 ? <FooterColumn title="Support" links={supportLinks} /> : null}
          {resourceLinks.length > 0 ? (
            <FooterColumn title="Resources" links={resourceLinks} />
          ) : null}
          {legalLinks.length > 0 ? <FooterColumn title="Legal" links={legalLinks} /> : null}

          <div
            className="hamd-footer__column hamd-footer__newsletter"
            aria-labelledby={`${newsletterId}-title`}
          >
            <h3 className="hamd-footer__column-title" id={`${newsletterId}-title`}>
              Newsletter
            </h3>
            <NewsletterCapture
              id={newsletterId}
              tone="inverse"
              privacyHref={newsletterPrivacyHref}
              action={newsletterAction}
              {...(onNewsletterSubmit ? { onSubmit: onNewsletterSubmit } : {})}
              {...(newsletterSuccessMessage
                ? { successMessage: newsletterSuccessMessage }
                : {})}
            />
          </div>
        </nav>
      </div>

      <div className="hamd-footer__basebar">
        <div className="hamd-footer__basebar-inner">
          <p className="hamd-footer__copyright">
            © {copyrightYear} {brandName}
          </p>
          <PoweredByAttribution
            label={poweredByLabel}
            {...(poweredByHref ? { href: poweredByHref } : {})}
            className="hamd-footer__powered"
          />
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly FooterLink[];
}) {
  const headingId = useId();
  return (
    <details className="hamd-footer__column hamd-footer__accordion" open>
      <summary className="hamd-footer__summary">
        <h3 className="hamd-footer__column-title" id={headingId}>
          {title}
        </h3>
      </summary>
      <ul className="hamd-footer__list" aria-labelledby={headingId}>
        {links.map((link) => (
          <li key={link.id}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function SocialGlyph({ kind }: { kind: NonNullable<FooterSocialLink["icon"]> }) {
  if (kind === "linkedin") {
    return (
      <svg className="hamd-footer__social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.84v1.98h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-6.6c0-1.57-.03-3.6-2.19-3.6-2.2 0-2.53 1.71-2.53 3.48V23h-4V8.5z"
        />
      </svg>
    );
  }
  return (
    <svg className="hamd-footer__social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        d="M3.5 12h17M12 3.5c2.5 2.7 3.8 5.7 3.8 8.5S14.5 17.8 12 20.5C9.5 17.8 8.2 14.8 8.2 12S9.5 6.2 12 3.5z"
      />
    </svg>
  );
}

export function FooterSeoJsonLd({
  organizationName = "Almahbub International",
  url = "https://almahbub.com",
  contactEmail,
}: {
  organizationName?: string;
  url?: string;
  contactEmail?: string;
}): ReactNode {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organizationName,
    url,
    ...(contactEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            email: contactEmail,
            contactType: "customer support",
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
