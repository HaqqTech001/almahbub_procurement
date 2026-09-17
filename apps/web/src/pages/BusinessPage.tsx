import { useEffect } from "react";
import { Navigate, Link, useParams } from "react-router-dom";
import { ButtonLink, EmptyState } from "../components/index.js";
import { InternationalCategories } from "../components/CommerceCatalogue.js";
import { COMMERCE } from "../content/commerce.js";
import { applyPageSeo } from "../lib/seo.js";
export function BusinessPage() {
  const { slug = "almahbub-international" } = useParams();
  useEffect(() => {
    applyPageSeo({
      title: COMMERCE.international.name,
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
    <div className="commerce-page commerce-wrap">
      <p className="commerce-eyebrow">{COMMERCE.international.positioning}</p>
      <h1>{COMMERCE.international.name}</h1>
      <p className="commerce-lead">
        Source devices, machinery and general merchandise to your
        specifications.
      </p>
      <InternationalCategories aboveFold />
      <p>
        <Link to="/products">Browse the full product catalogue</Link>
      </p>
      <section>
        <h2>Request sourcing</h2>
        <p>
          Include specifications, quantity, budget and delivery destination. Our
          team confirms supplier options, pricing and delivery terms in your
          quotation.
        </p>
        <ButtonLink href="/app/requests/new">
          Start a procurement request
        </ButtonLink>
      </section>
    </div>
  );
}
export function BusinessesIndexRedirect() {
  return <Navigate to="/" replace />;
}
