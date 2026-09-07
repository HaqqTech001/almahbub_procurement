import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ContactCta } from "../components/ContactCta.js";
import { ButtonLink, Section } from "../components/index.js";
import { PageHero } from "../components/PageHero.js";
import { servicesContent } from "../content/pages.js";
import { applyPageSeo } from "../lib/seo.js";

const SERVICE_DETAILS: Record<
  string,
  {
    overview: string;
    covers: readonly string[];
    process: string;
    audience: string;
  }
> = {
  "global-procurement": {
    overview:
      "We take ownership of complex cross-border buying so your team has one accountable counterpart from requirement to quotation.",
    covers: [
      "Requirement capture and specification clarification",
      "Supplier identification and commercial comparison",
      "Quotation, approval, and delivery follow-through",
    ],
    process:
      "You raise a request, we clarify what is needed, source suitable options, issue a quotation, and keep status on confirmed records.",
    audience:
      "Buying teams that need a named owner for electronics, medical equipment, facility kit, and other commercial procurement.",
  },
  "import-export": {
    overview:
      "Trade execution with documentation awareness and a named owner for each milestone, not a marketplace listing.",
    covers: [
      "Import and export documentation coordination",
      "Milestone ownership from booking to arrival",
      "Exception handling when documents or dates change",
    ],
    process:
      "We agree the corridor and documents, track each milestone against confirmed records, and keep you informed when something changes.",
    audience:
      "Organisations moving goods across borders that need accountable trade execution rather than open-ended freight browsing.",
  },
  logistics: {
    overview:
      "Shipment planning with honest ETA ranges, exceptions, and tracking you can verify against records.",
    covers: [
      "Shipment planning and carrier coordination",
      "ETA ranges with documented exceptions",
      "Tracking linked to the procurement record",
    ],
    process:
      "Once a quotation is accepted, logistics is planned against the request, then tracked until delivery confirmation.",
    audience:
      "Buyers who need shipment status they can show internally, not informal chat updates.",
  },
  warehousing: {
    overview:
      "Storage and handling aligned to your delivery plan, not open marketplace inventory.",
    covers: [
      "Receiving and handling against the agreed plan",
      "Release in line with your delivery windows",
      "Coordination with the procurement record",
    ],
    process:
      "Warehousing is scoped as part of the engagement, then executed against confirmed instructions rather than as a public stock room.",
    audience:
      "Teams that need holding or consolidation as part of a procurement journey, not a self-serve warehouse marketplace.",
  },
};

export function ServiceDetailPage() {
  const { slug = "" } = useParams();
  const service = servicesContent.services.find((item) => item.id === slug);
  const detail = SERVICE_DETAILS[slug];

  useEffect(() => {
    if (!service) return;
    applyPageSeo({
      title: `${service.title} | Services | Almahbub International`,
      description: service.description,
      path: `/services/${slug}`,
    });
  }, [service, slug]);

  if (!service || !detail) {
    return <Navigate to="/services" replace />;
  }

  return (
    <>
      <PageHero
        eyebrow="Services"
        title={service.title}
        description={detail.overview}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: service.title },
        ]}
        actions={
          <ButtonLink href="/contact" variant="primary">
            Request Procurement
          </ButtonLink>
        }
      />
      <Section id="service-covers" title="What this service covers" spacing="compact">
        <ul className="hamd-service-detail__rows">
          {detail.covers.map((item) => (
            <li key={item} className="hamd-service-detail__row">
              <span className="hamd-service-detail__check" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M6.2 10.2 8.7 12.6 13.8 7.6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="hamd-service-detail__copy">{item}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section id="service-process" title="How the engagement works" spacing="compact">
        <p>{detail.process}</p>
      </Section>
      <Section id="service-audience" title="Who it is useful for" spacing="compact">
        <p>{detail.audience}</p>
      </Section>
      <ContactCta />
    </>
  );
}
