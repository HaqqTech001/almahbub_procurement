import { ButtonLink } from "../../components/index.js";
import { IE_PATHS } from "../ie-paths.js";
import "../../styles/commerce.css";
export function IeQualityPage() {
  return (
    <div className="commerce-page commerce-wrap">
      <h1>Quality &amp; Compliance</h1>
      <p className="commerce-lead">
        Quality requirements are agreed for your commodity, specification and
        destination.
      </p>
      <section>
        <h2>Specifications to confirm</h2>
        <ul>
          <li>Commodity and required grade</li>
          <li>Quantity and packaging</li>
          <li>Quality parameters and inspection requirements</li>
          <li>Destination and delivery requirements</li>
        </ul>
      </section>
      <section>
        <h2>Documentation</h2>
        <p>
          Export documents depend on the commodity, destination and applicable
          shipment requirements. Confirm the documents and quality evidence you
          need with our team before committing to an order.
        </p>
      </section>
      <ButtonLink href={IE_PATHS.request}>Request a Quote</ButtonLink>
    </div>
  );
}
