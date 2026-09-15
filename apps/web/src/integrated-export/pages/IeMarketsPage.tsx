import { ButtonLink } from "../../components/index.js";
import { IE_PATHS } from "../ie-paths.js";
import "../../styles/commerce.css";
export function IeMarketsPage() {
  return (
    <div className="commerce-page commerce-wrap">
      <h1>International commodity trade</h1>
      <p className="commerce-lead">
        Share your destination so our export team can assess supply and shipment
        requirements.
      </p>
      <section>
        <h2>Confirm your destination requirements</h2>
        <p>
          Availability depends on the commodity, grade, quantity and
          destination. Include your delivery location, packaging preferences and
          required documents when requesting a quotation.
        </p>
        <p>
          Our team will confirm whether your requirement can be supported and
          discuss the relevant shipping terms.
        </p>
      </section>
      <ButtonLink href={IE_PATHS.request}>Request a Quote</ButtonLink>
    </div>
  );
}
