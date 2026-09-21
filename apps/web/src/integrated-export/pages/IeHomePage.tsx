import { Link } from "react-router-dom";
import { FaqSection, CtaSection } from "@hamd/ui/homepage";
import { ExportCommodities } from "../../components/CommerceCatalogue.js";
import { ServiceHero, ServiceProcess } from "../../components/ServiceHero.js";
import { INTEGRATED_EXPORT_BRAND } from "../../content/group.js";
import { IE_PATHS } from "../ie-paths.js";

export function IeHomePage() {
  return (
    <div className="service-page service-page--export">
      <ServiceHero business={INTEGRATED_EXPORT_BRAND.wordmark} eyebrow="Nigerian export solutions"
        title="Nigerian produce, prepared for global markets."
        description="Agricultural commodity sourcing for international buyers, with specification and quality coordination, export preparation and fulfilment planning built around your destination."
        image="/media/ie/commodities/sesame-seeds/hero/ie-sesame-seeds-hero-01.webp"
        imageSet="/media/services/export-640.webp 640w, /media/services/export-1280.webp 1280w, /media/ie/commodities/sesame-seeds/hero/ie-sesame-seeds-hero-01.webp 1920w"
        primary={{ href: IE_PATHS.request, label: "Request export supply" }}
        secondary={{ href: "#commodities", label: "Explore commodities" }}
        highlights={["Nigerian agricultural supply", "Buyer specifications", "Export coordination"]} />
      <section id="commodities" className="commerce-wrap service-section">
        <p className="commerce-eyebrow">Our commodity range</p>
        <h2>Explore agricultural export supply.</h2>
        <p>Browse our published commodities, then discuss grade, volume, packaging and destination requirements with the team.</p>
        <ExportCommodities />
        <Link to={IE_PATHS.commodities}>View all commodities</Link>
      </section>
      <ServiceProcess title="From your specification to export planning" steps={[
        { title: "Export process", href: IE_PATHS.process, description: "Start with your commodity requirements, then coordinate sourcing, preparation and shipment terms." },
        { title: "Quality coordination", href: IE_PATHS.quality, description: "Discuss grades, inspection, packaging and documentation appropriate to your order." },
        { title: "Destination requirements", href: IE_PATHS.markets, description: "Plan around your market, delivery destination and applicable import requirements." },
      ]} />
      <FaqSection title="Planning your export supply" items={[
        { id: "requirements", question: "What information do you need for a quotation?", answer: "Please include the commodity, grade or specification, volume, preferred packaging, destination and expected delivery window." },
        { id: "quality", question: "How are quality requirements agreed?", answer: "Share your specifications and any inspection or documentation requirements. These are reviewed with availability and supply terms for your order." },
        { id: "availability", question: "Does a listed commodity mean supply is immediately available?", answer: "No. Availability, lead time, pricing and shipping terms are confirmed in your quotation for the requested grade and quantity." },
      ]} />
      <CtaSection title="Plan your next supply from Nigeria."
        description="Share your commodity specifications and destination with Almahbub Integrated Export Ltd."
        primaryCta={{ href: IE_PATHS.request, label: "Request export supply" }}
        secondaryCta={{ href: IE_PATHS.contact, label: "Contact the team" }} />
    </div>
  );
}
