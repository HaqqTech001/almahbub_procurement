import { Link } from "react-router-dom";
import { ButtonLink } from "../../components/index.js";
import { IE_PATHS } from "../ie-paths.js";
import "../../styles/commerce.css";
export function IeAboutPage() {
  return (
    <div className="commerce-page commerce-wrap">
      <h1>About Almahbub Integrated Export</h1>
      <p className="commerce-lead">
        Agricultural commodity export connecting producers with international
        buyers and helping provide sustenance to the world.
      </p>
      <section>
        <h2>Plan your commodity order</h2>
        <p>
          We coordinate sourcing around your grade, volume and packaging
          requirements. Quality checks, export documents and shipping terms are
          agreed for each order.
        </p>
        <p>
          <Link to={IE_PATHS.commodities}>Browse commodities</Link>
          {" � "}
          <Link to={IE_PATHS.quality}>Quality requirements</Link>
          {" � "}
          <Link to={IE_PATHS.process}>Export process</Link>
        </p>
        <ButtonLink href={IE_PATHS.request}>Request a Quote</ButtonLink>
      </section>
      <p>
        For devices, machinery and general items import, visit{" "}
        <Link to="/businesses/almahbub-international">
          Almahbub International
        </Link>
        .
      </p>
    </div>
  );
}
