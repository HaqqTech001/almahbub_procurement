import { ButtonLink } from "../../components/index.js";
import { SITE } from "../../content/site.js";
import { IE_PATHS } from "../ie-paths.js";
import "../../styles/commerce.css";
export function IeContactPage() {
  return (
    <div className="commerce-page commerce-wrap">
      <h1>Let's discuss your export requirement</h1>
      <p className="commerce-lead">
        Share the commodity, specification, quantity, packaging and destination.
      </p>
      <section>
        <h2>Contact the export team</h2>
        <a
          href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Integrated Export enquiry")}`}
        >
          {SITE.contactEmail}
        </a>
        <p>
          Use an export quotation request to keep your requirements together for
          follow-up.
        </p>
      </section>
      <ButtonLink href={IE_PATHS.request}>Request a Quote</ButtonLink>
    </div>
  );
}
