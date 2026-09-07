import { useEffect } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { ButtonLink, EmptyState, Section } from "../components/index.js";
import {
  BusinessDiscovery,
  GroupBusinessMark,
} from "../components/GroupBusinessSwitcher.js";
import { PageHero } from "../components/PageHero.js";
import {
  getGroupBusiness,
  GROUP,
  isIntegratedExportSlug,
} from "../content/group.js";
import { SITE } from "../content/site.js";
import { applyJsonLd, applyPageSeo } from "../lib/seo.js";

function businessSlugFromPath(pathname: string): string {
  const match = pathname.match(/^\/businesses\/([^/]+)\/?$/);
  return match?.[1]?.trim() ?? "";
}

/**
 * Almahbub International business profile (and unknown-slug empty state).
 * Integrated Export uses the dedicated portal route - do not render a card profile.
 */
export function BusinessPage() {
  const { slug: paramSlug = "" } = useParams();
  const { pathname } = useLocation();
  const slug = paramSlug.trim() || businessSlugFromPath(pathname);
  const isExportPortal = isIntegratedExportSlug(slug);
  const business = isExportPortal ? undefined : getGroupBusiness(slug);

  useEffect(() => {
    if (!business) return;
    applyPageSeo({
      title: business.name,
      description: business.summary,
      path: business.href,
    });
    applyJsonLd({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: business.legalName,
      description: business.summary,
      url: `${SITE.url}${business.href}`,
    });
  }, [business]);

  if (isExportPortal) {
    return <Navigate to="/businesses/almahbub-integrated-export" replace />;
  }

  if (!business) {
    return (
      <EmptyState
        title="Business not found"
        description="That company is not listed under Almahbub Group on this website."
        actionHref="/group"
        actionLabel="View Almahbub Group"
      />
    );
  }

  return (
    <>
      <PageHero
        eyebrow={GROUP.endorsement}
        title={business.name}
        description={business.focus}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: GROUP.name, href: "/group" },
          { label: business.name },
        ]}
        actions={
          <>
            <ButtonLink href={business.cta.href} variant="primary">
              {business.cta.label}
            </ButtonLink>
            <ButtonLink href={GROUP.href} variant="secondary">
              Explore Almahbub Group
            </ButtonLink>
          </>
        }
      />

      <Section
        id="business-profile"
        title="Business profile"
        description="Separately registered. The operating company behind this website."
      >
        <div className="hamd-group-profile">
          <div className="hamd-group-profile__visual" aria-hidden="true">
            <GroupBusinessMark business={business} size="lg" />
            <p className="hamd-group-profile__media-label">{business.mediaLabel}</p>
          </div>
          <div className="hamd-group-profile__body">
            <p className="hamd-group-profile__endorsement">
              <Link to={GROUP.href}>{GROUP.endorsement}</Link>
            </p>
            <p className="hamd-group-profile__focus">{business.focusShort}</p>
            {business.description.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="hamd-prose">
                {paragraph}
              </p>
            ))}
            <h3 className="hamd-group-profile__heading">Capabilities</h3>
            <ul className="hamd-group-profile__caps">
              {business.capabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="hamd-prose">
              Browse the <Link to="/products">product catalogue</Link> or{" "}
              <Link to="/services">services</Link> for Almahbub International.
            </p>
            <div className="hamd-group-profile__actions">
              <ButtonLink href={business.cta.href} variant="primary">
                {business.cta.label}
              </ButtonLink>
              <ButtonLink href={GROUP.href} variant="secondary">
                Explore Almahbub Group
              </ButtonLink>
            </div>
          </div>
        </div>
        <BusinessDiscovery currentSlug={business.slug} variant="panel" />
      </Section>
    </>
  );
}

export function BusinessesIndexRedirect() {
  return <Navigate to="/group" replace />;
}
