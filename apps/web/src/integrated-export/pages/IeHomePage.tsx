import { Link } from "react-router-dom";
import { ButtonLink } from "../../components/index.js";
import { ExportCommodities } from "../../components/CommerceCatalogue.js";
import { COMMERCE } from "../../content/commerce.js";
import { IE_PATHS } from "../ie-paths.js";
export function IeHomePage() {
  return (
    <div className="commerce-page commerce-wrap">
      <p className="commerce-eyebrow">{COMMERCE.export.positioning}</p>
      <h1>{COMMERCE.export.name}</h1>
      <p className="commerce-lead">
        Browse agricultural commodities and discuss grades, packaging and export
        requirements with our team.
      </p>
      <ExportCommodities aboveFold />
      <section>
        <h2>Before you request a quotation</h2>
        <p>
          Share the commodity, grade, quantity, packaging and destination.
          Availability, quality requirements, documentation and shipping terms
          are confirmed for your order.
        </p>
        <p>
          <Link to={IE_PATHS.quality}>Quality requirements</Link>
          {" � "}
          <Link to={IE_PATHS.process}>Export process</Link>
        </p>
        <ButtonLink href={IE_PATHS.request}>Request a Quote</ButtonLink>
      </section>
    </div>
  );
}
