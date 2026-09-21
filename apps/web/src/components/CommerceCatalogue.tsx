import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  listPublicCategories,
  type PublicCatalogCategory,
} from "../api/catalog-api.js";
import { usePublishedIeCommodities } from "../integrated-export/commodities/use-published-ie-catalogue.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";
import { PresentationImage } from "./PresentationImage.js";
import "../styles/commerce.css";

export const procurementCategoryPath = (slug: string) =>
  `/global-procurement/category/${encodeURIComponent(slug)}`;

export function InternationalCategories({
  aboveFold = false,
}: {
  aboveFold?: boolean;
}) {
  const [categories, setCategories] = useState<PublicCatalogCategory[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState("loading");
    void (async () => {
      const records: PublicCatalogCategory[] = [];
      let page = 1;
      while (active) {
        const result = await listPublicCategories({ page, pageSize: 50 });
        records.push(...result.data);
        if (!result.page.hasMore) break;
        if (!result.data.length) throw new Error("Invalid category pagination");
        page += 1;
      }
      if (active) {
        setCategories(records);
        setState("ready");
      }
    })().catch(() => {
      if (active) setState("error");
    });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (state === "loading")
    return <p role="status">Loading procurement categories...</p>;
  if (state === "error")
    return (
      <div role="alert">
        <p>Procurement categories could not be loaded.</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
      </div>
    );
  if (!categories.length)
    return (
      <p>
        Tell us what you need and our procurement team can help you source it.
      </p>
    );
  return (
    <ul className="commerce-grid" aria-label="Global Procurement categories">
      {categories.map((category, index) => (
        <li key={category.id ?? category.slug}>
          <Link to={procurementCategoryPath(category.slug)}>
            {category.imageUrl && (
              <PresentationImage
                src={category.imageUrl}
                alt={category.imageAlt ?? category.name}
                loading={aboveFold && index < 2 ? "eager" : "lazy"}
              />
            )}
            <h3>{category.name}</h3>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ExportCommodities({
  aboveFold = false,
}: {
  aboveFold?: boolean;
}) {
  const { commodities, loading, error, retry } = usePublishedIeCommodities();
  if (loading)
    return <p role="status">Loading Nigerian export commodities...</p>;
  if (error)
    return (
      <div role="alert">
        <p>Export commodities could not be loaded.</p>
        <button type="button" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (!commodities.length)
    return (
      <p>Contact our export team to discuss your sourcing requirements.</p>
    );
  return (
    <ul className="commerce-grid" aria-label="Nigerian Export commodities">
      {commodities.map((commodity, index) => (
        <li key={commodity.id}>
          <Link to={IE_PATHS.commodity(commodity.slug)}>
            {commodity.heroMedia && (
              <PresentationImage
                src={commodity.heroMedia.src}
                alt={commodity.heroMedia.alt}
                loading={aboveFold && index < 2 ? "eager" : "lazy"}
              />
            )}
            <h3>{commodity.name}</h3>
          </Link>
        </li>
      ))}
    </ul>
  );
}
