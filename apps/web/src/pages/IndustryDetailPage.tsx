import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { ButtonLink } from "../components/index.js";
import { PageHero } from "../components/PageHero.js";
import { ContactCta } from "../components/ContactCta.js";
import { getIndustryBySlug, industrySlug } from "../content/industries.js";
import { applyPageSeo } from "../lib/seo.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import {
  listPublicCategories,
  listPublicProducts,
  type PublicCatalogCategory,
  type PublicCatalogProduct,
} from "../api/catalog-api.js";

function matchesHint(value: string, hints: readonly string[]): boolean {
  const hay = value.toLowerCase();
  return hints.some((hint) => hay.includes(hint.toLowerCase()));
}

export function IndustryDetailPage() {
  const { slug = "" } = useParams();
  const industry = getIndustryBySlug(slug);
  const auth = useAuth();
  const ctaHref =
    auth.status === "authenticated"
      ? industry?.ctaHref ?? "/app/requests/new"
      : `/login?returnTo=${encodeURIComponent(industry?.ctaHref ?? "/app/requests/new")}`;
  const [categories, setCategories] = useState<PublicCatalogCategory[]>([]);
  const [products, setProducts] = useState<PublicCatalogProduct[]>([]);

  useEffect(() => {
    if (!industry) return;
    applyPageSeo({
      title: `${industry.name} | Industries | Almahbub International`,
      description: industry.summary,
      path: `/industries/${industrySlug(industry)}`,
    });
    void listPublicCategories()
      .then((result) => setCategories(result.data))
      .catch(() => setCategories([]));
    void listPublicProducts({ pageSize: 24 })
      .then((result) => setProducts(result.data))
      .catch(() => setProducts([]));
  }, [industry]);

  const relatedCategories = useMemo(() => {
    if (!industry) return [];
    return categories.filter((row) => matchesHint(row.name, industry.relatedCategoryHints));
  }, [categories, industry]);

  const relatedProducts = useMemo(() => {
    if (!industry) return [];
    return products
      .filter((row) => {
        const blob = `${row.name} ${row.category?.name ?? ""}`;
        return matchesHint(blob, industry.relatedCategoryHints);
      })
      .slice(0, 6);
  }, [industry, products]);

  if (!industry) {
    return <Navigate to="/industries" replace />;
  }

  return (
    <>
      <PageHero
        eyebrow="Industries"
        title={industry.name}
        description={industry.summary}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Industries", href: "/industries" },
          { label: industry.name },
        ]}
        actions={
          <ButtonLink href={ctaHref} variant="primary">
            {industry.ctaLabel}
          </ButtonLink>
        }
      />

      <section className="hamd-industry-detail" aria-labelledby="industry-detail-heading">
        <div className="hamd-industry-detail__hero-media">
          <img src={industry.imageSrc} alt={industry.imageAlt} width={720} height={360} />
        </div>
        <h2 id="industry-detail-heading">How Almahbub supports this sector</h2>
        <p>{industry.description}</p>
        <p>{industry.howWeHelp}</p>

        <h3>Typical needs</h3>
        <p>
          Buyers in this sector ask us about needs including {industry.examples.slice(0, -1).join(", ")}
          {industry.examples.length > 1 ? ", and " : ""}
          {industry.examples.at(-1)}. These examples are illustrative, from first setup through recurring
          replenishment, not a closed list.
        </p>

        {relatedCategories.length > 0 ? (
          <>
            <h3>Related catalogue categories</h3>
            <ul className="hamd-industry-detail__chips">
              {relatedCategories.map((row) => (
                <li key={row.slug}>
                  <Link to={`/products?category=${encodeURIComponent(row.slug)}`}>{row.name}</Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {relatedProducts.length > 0 ? (
          <>
            <h3>Relevant published products</h3>
            <ul className="hamd-industry-detail__products">
              {relatedProducts.map((row) => (
                <li key={row.slug}>
                  <Link to={`/product/${row.slug}`}>{row.name}</Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p className="hamd-industry-detail__process">
          Procurement still follows request, clarification, sourcing, quotation, and delivery
          ownership. Formal pricing appears in quotations, not as self-serve checkout on this page.
        </p>
        <ButtonLink href={industry.ctaHref} variant="primary">
          {industry.ctaLabel}
        </ButtonLink>
      </section>
      <ContactCta />
    </>
  );
}
