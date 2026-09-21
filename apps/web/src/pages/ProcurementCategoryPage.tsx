import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ButtonLink } from "@hamd/ui/primitives";
import {
  CatalogApiError,
  getPublicCategoryPreview,
  type CategoryPreview,
} from "../api/catalog-api.js";
import { PresentationImage } from "../components/PresentationImage.js";
import { resolveMediaUrl } from "../lib/media-url.js";
import "../styles/commerce.css";

export function ProcurementCategoryPage() {
  const { slug = "" } = useParams();
  const filterSlug = slug === "electronics-mobile-digital-technology" ? slug : null;
  const [result, setResult] = useState<{
    slug: string;
    data: CategoryPreview;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    setError(null);
    setResult(null);
    setFailedImages([]);
    void getPublicCategoryPreview(slug)
      .then((data) => {
        if (active) setResult({ slug, data });
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof CatalogApiError && err.status === 404
              ? "This category is not available."
              : "We could not load this category. Please try again.",
          );
      });
    return () => {
      active = false;
    };
  }, [slug, attempt]);
  if (error)
    return (
      <section className="commerce-wrap commerce-page">
        <h1>Procurement category</h1>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
        <p>
          <Link to="/">Back to procurement categories</Link>
        </p>
      </section>
    );
  if (!result || result.slug !== slug)
    return (
      <section className="commerce-wrap commerce-page" aria-busy="true">
        <p role="status">Loading category...</p>
      </section>
    );
  const { category, products } = result.data;
  const visible = products
    .filter(
      (product) =>
        product.category?.slug === category.slug && product.images[0]?.url && !failedImages.includes(product.slug),
    )
    .slice(0, 16);
  return (
    <div className="commerce-wrap commerce-page">
      <nav aria-label="Breadcrumb">
        <Link to="/">Home</Link> /{" "}
        <Link to="/businesses/almahbub-international">Global Procurement</Link>{" "}
        / {category.name}
      </nav>
      <header className="commerce-category-hero">
        <div>
          <p className="commerce-eyebrow">Global Procurement</p>
          <h1>{category.name}</h1>
          <p className="commerce-lead">
            {category.description ||
              `Discuss your ${category.name.toLowerCase()} requirements with our procurement team. Specifications and commercial terms are confirmed during sourcing.`}
          </p>
        </div>
        {category.imageUrl && (
          <PresentationImage
            src={category.imageUrl}
            alt={category.imageAlt || category.name}
            loading="eager"
            hero
          />
        )}
      </header>
      <section aria-labelledby="category-products-title">
        <h2 id="category-products-title">Explore products</h2>
        {visible.length ? (
          <ul className="commerce-grid commerce-category-products">
            {visible.map((product, index) => (
              <li key={product.slug}>
                <Link to={`/product/${encodeURIComponent(product.slug)}`}>
                  <img
                    src={resolveMediaUrl(product.images[0]!.url)}
                    alt={product.images[0]!.altText || product.name}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    width={480}
                    height={320}
                    onError={() => setFailedImages(current => [...current, product.slug])}
                  />
                  <h3>{product.name}</h3>
                  <p>{category.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="commerce-category-empty">
            <p>
              Looking for something in this category? Tell us what you need and
              our team can source it.
            </p>
            <ButtonLink href="/app/requests/new">
              Engage in Global Procurement
            </ButtonLink>
          </div>
        )}
        <ButtonLink
          href={`/products?category=${encodeURIComponent(filterSlug ?? category.slug)}`}
          variant="secondary"
        >
          View More Products
        </ButtonLink>
      </section>
    </div>
  );
}
