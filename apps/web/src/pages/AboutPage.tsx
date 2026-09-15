import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "../components/index.js";
import { applyPageSeo } from "../lib/seo.js";
import "../styles/commerce.css";
export function AboutPage() {
  useEffect(() => {
    applyPageSeo({
      title: "About Almahbub International",
      description:
        "Devices, machinery and general merchandise sourcing and procurement.",
      path: "/about",
    });
  }, []);
  return (
    <div className="commerce-page commerce-wrap">
      <h1>About Almahbub International</h1>
      <p className="commerce-lead">
        We source devices, machinery and general merchandise from international
        suppliers for individuals and businesses.
      </p>
      <section>
        <h2>From requirements to delivery</h2>
        <p>
          Our team clarifies your specifications, sources options and prepares a
          quotation. You review pricing and delivery terms before approval, then
          follow your request through delivery.
        </p>
        <p>
          <Link to="/products">Browse import categories and products</Link>
        </p>
        <ButtonLink href="/app/requests/new">
          Start a procurement request
        </ButtonLink>
      </section>
      <p>
        For agricultural commodities, visit{" "}
        <Link to="/businesses/almahbub-integrated-export">
          Almahbub Integrated Export
        </Link>
        .
      </p>
    </div>
  );
}
