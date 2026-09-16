import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PresentationImage } from "../components/PresentationImage.js";
import { COMMERCE } from "../content/commerce.js";
import { IE_PORTAL_MEDIA } from "../content/media-assets.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";
import { applyPageSeo } from "../lib/seo.js";
import "../styles/about.css";

const operations = [
  { ...COMMERCE.international, href: "/businesses/almahbub-international", action: "Explore International",
    copy: "Supporting businesses with international sourcing and procurement across devices, machinery, commercial equipment and general requirements.",
    image: "/media/international/categories/machineries/hero/intl-machineries-hero-01.webp", alt: "Technical drawings and workshop tools representing specification-led procurement",
    steps: ["Requirement", "Sourcing", "Options & Quotation", "Procurement", "Logistics", "Delivery"] },
  { ...COMMERCE.export, href: IE_PATHS.home, action: "Explore Integrated Export",
    copy: "Connecting agricultural commodities with international buyers through specification-led sourcing, quality processes and export coordination.",
    image: IE_PORTAL_MEDIA.homeHero.src, alt: "An assortment of spices representing agricultural commodity trade",
    steps: ["Commodity Enquiry", "Requirement / Specification", "Sourcing", "Quality Coordination", "Documentation", "Export"] },
];
const principles = [
  ["Requirement-led sourcing", "We begin with your specification, including requirements that sit outside the published catalogue."],
  ["Multi-commerce capability", "Our sourcing operation spans devices, machinery, commercial equipment and general procurement requirements."],
  ["Dedicated export operation", "Integrated Export provides a distinct path for agricultural commodity enquiries and export requirements."],
  ["Digital procurement visibility", "Our platform brings requests, quotations and procurement communication into a structured environment."],
];
export function AboutPage() {
  useEffect(() => {
    applyPageSeo({
      title: "About Almahbub | International Sourcing & Agricultural Export",
      description:
        "Meet Almahbub's two operations: International for sourcing and procurement, and Integrated Export for agricultural commodity trade.",
      path: "/about",
    });
  }, []);
  return <div className="about-page">
    <header className="about-hero">
      <p className="about-eyebrow">About Almahbub</p>
      <h1>Commerce built around real business needs.</h1>
      <p className="about-lead">Almahbub connects businesses and markets through international sourcing, procurement and agricultural commodity export, with dedicated operations serving each side of our trade network.</p>
    </header>
    <section className="about-section" aria-labelledby="about-operations">
      <p className="about-eyebrow">Our operations</p>
      <h2 id="about-operations">Two operations. One commitment to effective trade.</h2>
      <div className="about-operations">
        {operations.map(operation => <article className="about-operation" key={operation.name}>
          <PresentationImage src={operation.image} alt={operation.alt} className="about-operation__image" />
          <div className="about-operation__body">
            <h3>{operation.name}</h3>
            <p className="about-operation__positioning">{operation.positioning}</p>
            <p>{operation.copy}</p>
            <Link className="about-link" to={operation.href}>{operation.action}<span aria-hidden="true"> ↗</span></Link>
          </div>
        </article>)}
      </div>
    </section>
    <section className="about-section about-split" aria-labelledby="about-approach">
      <div><p className="about-eyebrow">Our approach</p><h2 id="about-approach">Built around a practical approach to trade.</h2></div>
      <div className="about-prose">
        <p>Cross-border commerce brings together requirements, suppliers, specifications, quotations, documentation and logistics. Our approach is to make those decisions clearer and the process more structured.</p>
        <p>International supports the sourcing and procurement of devices, machinery and general items. Integrated Export coordinates agricultural commodity enquiries and export requirements.</p>
        <p>Through the digital platform, customers can make enquiries, submit procurement requirements, review quotations and follow their requests as they progress.</p>
      </div>
    </section>
    <section className="about-section" aria-labelledby="about-process">
      <p className="about-eyebrow">From brief to movement</p><h2 id="about-process">How we work</h2>
      {operations.map(operation => <div className="about-process" key={operation.name}>
        <h3>{operation.name}</h3>
        <ol aria-label={`${operation.name} process`}>
          {operation.steps.map((step, index) => <li key={step}><span aria-hidden="true" className="about-step-number">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
        </ol>
      </div>)}
      <Link className="about-link" to={IE_PATHS.process}>Explore the export process <span aria-hidden="true">↗</span></Link>
    </section>
    <section className="about-section about-reach about-split" aria-labelledby="about-reach">
      <div><p className="about-eyebrow">Sourcing & trade markets</p><h2 id="about-reach">Trade beyond borders</h2></div>
      <div><p>Our sourcing and trade relationships connect requirements with markets including:</p>
        <ul className="about-markets" aria-label="Sourcing and trade markets">{["China", "USA", "UK", "UAE", "Korea"].map(market => <li key={market}>{market}</li>)}</ul>
        <p>And other international markets, according to the requirement.</p>
        <Link className="about-link" to={IE_PATHS.markets}>Explore export markets <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
    <section className="about-section" aria-labelledby="about-principles">
      <p className="about-eyebrow">Why Almahbub</p><h2 id="about-principles">A clear brief. A considered response.</h2>
      <div className="about-principles">{principles.map(([title, copy]) => <div key={title}><h3>{title}</h3><p>{copy}</p></div>)}</div>
    </section>
    <section className="about-section about-split" aria-labelledby="about-quality">
      <div><p className="about-eyebrow">Quality & responsible trade</p><h2 id="about-quality">Trade requires more than moving goods.</h2></div>
      <div><p>Suitability starts with a clear specification. Product verification, commodity requirements, documentation and logistics coordination need to be agreed for each enquiry.</p>
        <ul className="about-concepts" aria-label="Trade considerations">{["Specification", "Verification", "Documentation", "Coordination"].map(item => <li key={item}>{item}</li>)}</ul>
        <Link className="about-link" to={IE_PATHS.quality}>Our approach to export quality <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
    <section className="about-cta" aria-labelledby="about-next">
      <h2 id="about-next">Let's move your requirement forward.</h2>
      <div className="about-cta__paths">
        <div><p>Devices, machinery or general procurement<br /><strong>Almahbub International</strong></p><Link className="hamd-btn hamd-btn--primary" to="/app/requests/new">Start Procurement</Link></div>
        <div><p>Agricultural commodity enquiry<br /><strong>Almahbub Integrated Export</strong></p><Link className="hamd-btn hamd-btn--primary" to={IE_PATHS.request}>Request Export Quote</Link></div>
      </div>
    </section>
  </div>;
}
