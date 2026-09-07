import { useMemo, useState } from "react";
import { ListModuleFrame } from "@hamd/ui/module-layout";

import { usePublishedIeCommodities } from "../integrated-export/commodities/use-published-ie-catalogue.js";
import { IeCommodityCard } from "../integrated-export/IeCommodityCard.js";
import { ieProcurementCreatePath } from "../integrated-export/ie-paths.js";

export function BuyerAgroProducePage() {
  const { previews, loading, error, retry } = usePublishedIeCommodities();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return previews;
    return previews.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category?.toLowerCase().includes(q) ?? false) ||
        (item.shortDescription?.toLowerCase().includes(q) ?? false),
    );
  }, [previews, query]);

  return (
    <ListModuleFrame
      className="hamd-agro-produce hamd-list-queue"
      header={{
        title: "Agro Produce",
        description: "Browse published commodities and request a quotation.",
      }}
      toolbar={{
        search: {
          value: query,
          onChange: setQuery,
          placeholder: "Search commodities",
        },
        onReset: () => setQuery(""),
      }}
      loading={loading}
      error={error}
      errorTitle="We couldn't load Agro Produce."
      retryLabel="Try Again"
      onRetry={retry}
      empty={{
        title: "No Agro Produce published yet.",
        description:
          previews.length === 0
            ? "Published commodities appear here after they are published in Ops."
            : "No published commodities match this search.",
      }}
      isEmpty={!loading && !error && rows.length === 0}
    >
      {rows.length > 0 ? (
        <ul className="hamd-agro-produce__grid">
          {rows.map((item) => (
            <li key={item.slug}>
              <IeCommodityCard
                commodity={item}
                headingLevel={3}
                detailHref={`/app/agro-produce/${item.slug}`}
                quoteHref={ieProcurementCreatePath(item.slug)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </ListModuleFrame>
  );
}
