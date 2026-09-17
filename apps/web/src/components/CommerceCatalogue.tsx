import { Link } from "react-router-dom";
import { CANONICAL_PRESENTATION } from "../content/canonical-presentation.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";
import { PresentationImage } from "./PresentationImage.js";
import "../styles/commerce.css";

/** Permanent operation introductions, not stock/publication claims. Live catalogues
 * still own product availability, commodity details and administrator-managed media. */
function PresentationGrid({ business, aboveFold = false }: { business: "International" | "IE"; aboveFold?: boolean }) {
  return <ul className="commerce-grid" aria-label={business === "International" ? "International categories" : "Integrated Export commodities"}>
    {CANONICAL_PRESENTATION.filter(item => item.business === business).map((item, index) => <li key={item.slug}>
      <Link to={business === "International" ? `/products?category=${encodeURIComponent(item.slug)}` : IE_PATHS.commodity(item.slug)}>
        <PresentationImage src={item.src} alt={item.alt} loading={aboveFold && index < 2 ? "eager" : "lazy"} />
        <h3>{item.name}</h3>
      </Link>
    </li>)}
  </ul>;
}
export function InternationalCategories({ aboveFold = false }: { aboveFold?: boolean }) {
  return <PresentationGrid business="International" aboveFold={aboveFold} />;
}
export function ExportCommodities({ aboveFold = false }: { aboveFold?: boolean }) {
  return <PresentationGrid business="IE" aboveFold={aboveFold} />;
}
