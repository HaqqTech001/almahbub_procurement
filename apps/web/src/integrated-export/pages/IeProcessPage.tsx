import { ButtonLink } from "../../components/index.js";
import { IE_PATHS } from "../ie-paths.js";
import "../../styles/commerce.css";
export function IeProcessPage() {
  return (
    <div className="commerce-page commerce-wrap">
      <h1>From enquiry to export</h1>
      <p className="commerce-lead">
        Specifications and commercial terms are confirmed before export
        coordination.
      </p>
      <ol className="commerce-process">
        <li>
          <h2>Share your requirement</h2>
          <p>Send the commodity, grade, quantity, packaging and destination.</p>
        </li>
        <li>
          <h2>Review sourcing and terms</h2>
          <p>
            Our team clarifies specifications, supply options, pricing and
            delivery expectations for your quotation.
          </p>
        </li>
        <li>
          <h2>Agree quality and documents</h2>
          <p>
            Confirm quality requirements and the documents needed for your
            shipment.
          </p>
        </li>
        <li>
          <h2>Coordinate export and delivery</h2>
          <p>
            Export preparation and logistics are arranged against the agreed
            specifications and commercial terms.
          </p>
        </li>
      </ol>
      <ButtonLink href={IE_PATHS.request}>Request a Quote</ButtonLink>
    </div>
  );
}
