import { CollectionSkeleton } from "@hamd/ui/primitives";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toCategoryItem } from "../lib/homepage-products.js";
import { listPublicCategories } from "../api/catalog-api.js";
import { usePublishedIeCommodities } from "../integrated-export/commodities/use-published-ie-catalogue.js";
import { IeCommodityImage } from "../integrated-export/IeCommodityImage.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";
import "../styles/commerce.css";

async function loadCategories() {
  try {
    const result = await listPublicCategories({ pageSize: 50 });
    return { categoryItems: result.data.map(toCategoryItem), source: "api" };
  } catch {
    return { categoryItems: [], source: "error" };
  }
}

export function InternationalCategories() {
  const [catalog, setCatalog] = useState<Awaited<
    ReturnType<typeof loadCategories>
  > | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setCatalog(null);
    void loadCategories().then((data) => {
      if (!cancelled) setCatalog(data);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  if (!catalog) return <CollectionSkeleton label="Loading categories" gridClassName="commerce-grid" count={10} />;
  if (catalog.source === "error")
    return (
      <div role="status">
        <p>The catalogue is temporarily unavailable.</p>
        <button
          className="hamd-btn hamd-btn--secondary"
          onClick={() => setAttempt(attempt + 1)}
        >
          Retry categories
        </button>
      </div>
    );
  if (!catalog.categoryItems.length)
    return (
      <p>Tell us what you need, even if it is not listed in the catalogue.</p>
    );
  return (
    <ul className="commerce-grid" aria-label="International categories">
      {catalog.categoryItems.map((item) => (
        <li key={item.id}>
          <Link to={item.href}>
            {item.imageSrc ? (
              <img
                src={item.imageSrc}
                alt={item.imageAlt || item.name}
                width={480}
                height={320}
                loading="lazy"
              />
            ) : (
              <span className="commerce-grid__placeholder">
                Image unavailable
              </span>
            )}
            <h3>{item.name}</h3>
          </Link>
        </li>
      ))}
    </ul>
  );
}
export function ExportCommodities() {
  const { previews, loading, error, retry } = usePublishedIeCommodities();
  if (loading) return <CollectionSkeleton label="Loading commodities" gridClassName="commerce-grid" count={10} />;
  if (error)
    return (
      <div role="status">
        <p>The commodity catalogue is temporarily unavailable.</p>
        <button className="hamd-btn hamd-btn--secondary" onClick={retry}>
          Retry commodities
        </button>
      </div>
    );
  if (!previews.length)
    return <p>Contact our export team for current commodity availability.</p>;
  return (
    <ul className="commerce-grid" aria-label="Integrated Export commodities">
      {previews.map((item) => (
        <li key={item.slug}>
          <Link to={IE_PATHS.commodity(item.slug)}>
            {item.imageSrc ? (
              <IeCommodityImage
                src={item.imageSrc}
                alt={item.imageAlt || item.name}
              />
            ) : (
              <span className="commerce-grid__placeholder">
                Image unavailable
              </span>
            )}
            <h3>{item.name}</h3>
          </Link>
        </li>
      ))}
    </ul>
  );
}
