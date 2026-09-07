import { useEffect } from "react";
import { Section } from "../components/index.js";
import { PageHero } from "../components/PageHero.js";
import { legalPages } from "../content/pages.js";
import { applyPageSeo } from "../lib/seo.js";

type LegalKey = keyof typeof legalPages;

export function LegalPage({ kind }: { kind: LegalKey }) {
  const page = legalPages[kind];

  useEffect(() => {
    applyPageSeo(page.seo);
  }, [page.seo]);

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={page.title}
        description={`Last updated ${page.updated}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: page.title },
        ]}
      />
      <Section id="legal-body" title="Policy" width="narrow">
        <div className="hamd-prose">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
            </section>
          ))}
          {kind === "cookies" ? (
            <p>
              <button
                type="button"
                className="hamd-btn hamd-btn--secondary"
                onClick={() =>
                  window.dispatchEvent(new Event("hamd:open-cookie-preferences"))
                }
              >
                Manage cookie preferences
              </button>
            </p>
          ) : null}
        </div>
      </Section>
    </>
  );
}
