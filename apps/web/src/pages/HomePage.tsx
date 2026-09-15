import { useEffect } from "react";
import {
  GlobalHeader,
  GlobalFooter,
  FooterSeoJsonLd,
} from "@hamd/ui/navigation";
import { ButtonLink } from "@hamd/ui/primitives";
import { useTheme } from "../app/providers/ThemeProvider.js";
import { homepageFooter, homepageSeo } from "../content/homepage.js";
import { COMMERCE } from "../content/commerce.js";
import {
  InternationalCategories,
  ExportCommodities,
} from "../components/CommerceCatalogue.js";
import { usePublicHeaderProps } from "../lib/use-public-header-props.js";
import {
  newsletterSuccessMessage,
  subscribeNewsletter,
} from "../lib/newsletter.js";
import { applyDocumentSeo } from "../lib/seo-homepage.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";

export function HomePage() {
  const { theme, setTheme } = useTheme();
  const header = usePublicHeaderProps({
    theme,
    onThemeChange: setTheme,
    transparentUntilScroll: false,
  });
  useEffect(() => {
    applyDocumentSeo(homepageSeo);
  }, []);
  return (
    <div className="commerce-home" data-testid="homepage">
      <FooterSeoJsonLd
        organizationName="Almahbub"
        url={homepageSeo.canonicalUrl}
      />
      <GlobalHeader
        {...header}
        brandName="Almahbub Multi-Commerce"
        brandAffiliation="Import & Export"
      />
      <main id="main-content">
        <section className="commerce-hero">
          <div className="commerce-wrap">
            <p className="commerce-eyebrow">{COMMERCE.eyebrow}</p>
            <h1>
              {COMMERCE.headline}
              <span>{COMMERCE.sourcing}</span>
              <span>{COMMERCE.supplying}</span>
            </h1>
            <p className="commerce-lead">{COMMERCE.description}</p>
            <nav
              className="commerce-actions"
              aria-label="Explore our operations"
            >
              <ButtonLink href="#international" variant="secondary">
                Almahbub International
              </ButtonLink>
              <ButtonLink href="#integrated-export" variant="secondary">
                Almahbub Integrated Export
              </ButtonLink>
            </nav>
          </div>
        </section>
        <section
          id="international"
          className="commerce-operation commerce-wrap"
          aria-labelledby="international-title"
        >
          <p className="commerce-eyebrow">
            {COMMERCE.international.positioning}
          </p>
          <h2 id="international-title">{COMMERCE.international.name}</h2>
          <p className="commerce-lead">{COMMERCE.international.description}</p>
          <InternationalCategories />
          <ButtonLink href="/businesses/almahbub-international">
            Explore International
          </ButtonLink>
        </section>
        <section
          id="integrated-export"
          className="commerce-operation commerce-wrap"
          aria-labelledby="export-title"
        >
          <p className="commerce-eyebrow">{COMMERCE.export.positioning}</p>
          <h2 id="export-title">{COMMERCE.export.name}</h2>
          <p className="commerce-lead">{COMMERCE.export.description}</p>
          <ExportCommodities />
          <ButtonLink href={IE_PATHS.home}>
            Explore Integrated Export
          </ButtonLink>
        </section>
        <section
          className="commerce-final commerce-wrap"
          aria-labelledby="trade-request-title"
        >
          <h2 id="trade-request-title">Tell us what you need.</h2>
          <p>
            Share the item or commodity, quantity, specifications and
            destination so our team can prepare your quotation.
          </p>
          <div className="commerce-actions">
            <ButtonLink href="/app/requests/new">
              Request import procurement
            </ButtonLink>
            <ButtonLink href={IE_PATHS.request} variant="secondary">
              Request an export quotation
            </ButtonLink>
          </div>
        </section>
      </main>
      <GlobalFooter
        {...homepageFooter}
        onNewsletterSubmit={async (email) => {
          await subscribeNewsletter(email);
        }}
        newsletterSuccessMessage={newsletterSuccessMessage}
      />
    </div>
  );
}
