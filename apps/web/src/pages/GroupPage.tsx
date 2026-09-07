import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ButtonLink, Section } from "../components/index.js";
import { GroupBusinessCard } from "../components/GroupBusinessesSection.js";
import { GroupBusinessSwitcher } from "../components/GroupBusinessSwitcher.js";
import { PageHero } from "../components/PageHero.js";
import { GROUP, GROUP_BUSINESSES } from "../content/group.js";
import { SITE } from "../content/site.js";
import { applyJsonLd, applyPageSeo } from "../lib/seo.js";

export function GroupPage() {
  useEffect(() => {
    applyPageSeo({
      title: "Almahbub Group",
      description: GROUP.description,
      path: "/group",
    });
    applyJsonLd({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: GROUP.name,
      description: GROUP.description,
      url: `${SITE.url}/group`,
    });
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Corporate structure"
        title={GROUP.name}
        description={GROUP.tagline}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: GROUP.name },
        ]}
        actions={
          <ButtonLink href="/businesses/almahbub-international" variant="primary">
            Almahbub International
          </ButtonLink>
        }
      />

      <Section
        id="group-structure"
        title="How the businesses relate"
        description={GROUP.operatingNote}
      >
        <div className="hamd-group-structure" aria-label="Almahbub Group relationship">
          <div className="hamd-group-structure__parent">
            <p className="hamd-group-structure__kicker">Parent group</p>
            <p className="hamd-group-structure__name">{GROUP.name}</p>
            <p className="hamd-group-structure__child-focus">{GROUP.description}</p>
          </div>
          <div className="hamd-group-structure__connector" aria-hidden="true">
            <span className="hamd-group-structure__arrow" />
          </div>
          <ul className="hamd-group-structure__children">
            {GROUP_BUSINESSES.map((business) => {
              const isExport = business.slug === "almahbub-integrated-export";
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
                    <Link
                      to={business.href}
                      {...(isExport ? { "data-testid": "aie-portal-entry" } : {})}
                    >
                      {business.name}
                    </Link>
                  </h3>
                  <p className="hamd-group-structure__child-focus">{business.focusShort}</p>
                  <div className="hamd-group-structure__child-actions">
                    <ButtonLink
                      href={business.href}
                      variant={isExport ? "primary" : "secondary"}
                      {...(isExport ? { "data-testid": "aie-portal-entry-cta" } : {})}
                    >
                      {isExport ? "Enter business portal" : "View business profile"}
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <GroupBusinessSwitcher className="hamd-group-structure__switcher" variant="panel" />
      </Section>

      <Section
        id="group-businesses"
        title="The businesses"
        description="Each company has its own focus. Neither is a department of the other."
        tone="subtle"
      >
        <ul className="hamd-group-grid">
          {GROUP_BUSINESSES.map((business) => (
            <li key={business.id}>
              <GroupBusinessCard business={business} />
            </li>
          ))}
        </ul>
        <p className="hamd-prose">
          Looking for procurement, importation, sourcing, supply, or logistics? Start with{" "}
          <Link to="/businesses/almahbub-international">Almahbub International</Link>.
        </p>
      </Section>
    </>
  );
}
