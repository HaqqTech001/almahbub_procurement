import { useEffect } from "react";
import { Navigate, Link, useParams } from "react-router-dom";
import { ButtonLink, EmptyState } from "../components/index.js";
import { InternationalCategories } from "../components/CommerceCatalogue.js";
import { ServiceHero, ServiceProcess } from "../components/ServiceHero.js";
import { TestimonialsSection, FaqSection, CtaSection } from "@hamd/ui/homepage";
import { homepageBelowFold } from "../content/homepage.js";
import { COMMERCE } from "../content/commerce.js";
import { applyPageSeo } from "../lib/seo.js";
export function BusinessPage() {
  const { slug = "almahbub-international" } = useParams();
  useEffect(() => {
    applyPageSeo({
      title: "Global Procurement | Almahbub International",
      description: COMMERCE.international.description,
      path: "/businesses/almahbub-international",
    });
  }, []);
  if (slug === "almahbub-integrated-export")
    return <Navigate to="/businesses/almahbub-integrated-export" replace />;
  if (slug !== "almahbub-international")
    return (
      <EmptyState
        title="Business not found"
        description="Explore our import and export operations."
        actionHref="/"
        actionLabel="Home"
      />
    );
  return (
    <div className="service-page">
      <ServiceHero business="Almahbub International" eyebrow="Global procurement"
        title="Source globally. Procure with confidence."
        description="Phones and computers, office devices, appliances, fashion and footwear, machinery, mechanical spare parts, medical and professional equipment. We source from international markets around your requirements, beyond the products displayed here."
        image="/media/ie/portal/hero/ie-portal-home-hero-02.webp"
        imageSet="/media/services/procurement-640.webp 640w, /media/services/procurement-1280.webp 1280w, /media/ie/portal/hero/ie-portal-home-hero-02.webp 1920w"
        primary={{ href: "/app/requests/new", label: "Start a procurement request" }}
        secondary={{ href: "#categories", label: "Explore product categories" }}
        highlights={["Requirement-driven sourcing", "Specification-led quotations", "Delivery coordination"]} />
      <section id="categories" className="commerce-wrap service-section">
        <p className="commerce-eyebrow">Explore the possibilities</p>
        <h2>What does your business need?</h2>
        <p>Start with a category to explore reviewed product options. Have a different requirement? Share your specifications and we can discuss sourcing it.</p>
        <InternationalCategories />
        <Link to="/products">Browse the full product catalogue</Link>
      </section>
      <ServiceProcess title="How procurement works" steps={[
        { title: "Share your brief", description: "Tell us the product, specifications, quantity, budget and destination." },
        { title: "Review the options", description: "Our team clarifies your requirements and prepares sourcing options and a quotation." },
        { title: "Agree the next steps", description: "Confirm specifications, payment and delivery terms before proceeding with your order." },
      ]} />
      <section className="commerce-wrap service-section">
        <p className="commerce-eyebrow">Why procure with Almahbub</p>
        <h2>Your requirements set the direction.</h2>
        <p>Use one sourcing brief to explain what matters: compatibility, materials, capacity, quantities and delivery needs. We coordinate the conversation around those details, with pricing and supply terms confirmed in your quotation.</p>
        <ButtonLink href="/contact" variant="secondary">Discuss your requirements</ButtonLink>
      </section>
      {homepageBelowFold.testimonials && <TestimonialsSection {...homepageBelowFold.testimonials} autoRotateMs={0} />}
      <FaqSection title="Before you start" items={[
        { id: "range", question: "Am I limited to the products shown here?", answer: "No. The catalogue is a starting point for sourcing. Include any additional product requirements, specifications and reference details in your request." },
        { id: "brief", question: "What should I include in my request?", answer: "Share the item, quantity, specifications, budget and delivery destination. Our team may ask for further details before preparing a quotation." },
        { id: "terms", question: "When are price and delivery confirmed?", answer: "Availability, pricing, payment arrangements and delivery terms are confirmed in your quotation before an order proceeds." },
      ]} />
      <CtaSection title="Bring us your next sourcing requirement."
        description="Start with the details you have. We will help clarify the next steps."
        primaryCta={{ href: "/app/requests/new", label: "Start a procurement request" }} />
    </div>
  );
}
export function BusinessesIndexRedirect() {
  return <Navigate to="/" replace />;
}
