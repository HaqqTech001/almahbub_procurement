import { useEffect } from "react";
import { FaqAccordion, Section, ButtonLink } from "../components/index.js";
import { PageHero } from "../components/PageHero.js";
import { faqContent } from "../content/pages.js";
import { applyJsonLd, applyPageSeo } from "../lib/seo.js";
import { SITE } from "../content/site.js";

export function FaqPage() {
  useEffect(() => {
    applyPageSeo(faqContent.seo);
    applyJsonLd({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqContent.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
      url: `${SITE.url}/faq`,
    });
  }, []);

  return (
    <>
      <PageHero
        eyebrow={faqContent.hero.eyebrow}
        title={faqContent.hero.title}
        description={faqContent.hero.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "FAQ" },
        ]}
        actions={
          <ButtonLink href="/contact" variant="primary">
            Contact specialist
          </ButtonLink>
        }
      />
      <Section id="faq-list" title="Answers" description="Clear before you contact a specialist." width="narrow">
        <FaqAccordion items={faqContent.items} />
        <div className="hamd-faq-ask" style={{ marginTop: "1.5rem" }}>
          <h2>Can't find your question?</h2>
          <p>Send it to the procurement desk. We will not publish it as an FAQ without review.</p>
          <ButtonLink href="/contact?topic=faq" variant="primary">
            Ask a Question
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
