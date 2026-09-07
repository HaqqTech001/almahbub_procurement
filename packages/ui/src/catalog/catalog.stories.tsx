import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ProductCatalog } from "../src/catalog/ProductCatalog";
import { catalogFixture } from "../src/catalog/fixtures";
import {
  emptyCatalogFilters,
  type CatalogFiltersState,
  type CatalogSortId,
  type CatalogViewMode,
} from "../src/catalog/types";
import "../src/styles/catalog.css";

function CatalogStory({
  scrollMode = "pages",
}: {
  scrollMode?: "pages" | "infinite";
}) {
  const [filters, setFilters] = useState<CatalogFiltersState>(emptyCatalogFilters());
  const [sort, setSort] = useState<CatalogSortId>("relevance");
  const [view, setView] = useState<CatalogViewMode>("grid");
  const [page, setPage] = useState(1);

  return (
    <ProductCatalog
      {...catalogFixture}
      filters={filters}
      onFiltersChange={setFilters}
      sort={sort}
      onSortChange={setSort}
      view={view}
      onViewChange={setView}
      pagination={{
        ...catalogFixture.pagination,
        page,
        hasMore: scrollMode === "infinite",
        total: scrollMode === "infinite" ? 40 : catalogFixture.pagination.total,
      }}
      scrollMode={scrollMode}
      onPageChange={setPage}
      onLoadMore={() => setPage((p) => p + 1)}
    />
  );
}

const meta: Meta = {
  title: "Catalog/ProductCatalog",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <CatalogStory />,
};

export const InfiniteScroll: Story = {
  render: () => <CatalogStory scrollMode="infinite" />,
};

export const Loading: Story = {
  render: () => (
    <ProductCatalog
      {...catalogFixture}
      products={[]}
      loading
      filters={emptyCatalogFilters()}
      onFiltersChange={() => undefined}
      sort="relevance"
      onSortChange={() => undefined}
      view="grid"
      onViewChange={() => undefined}
      pagination={{ page: 1, pageSize: 20, total: 0, hasMore: false }}
      onPageChange={() => undefined}
    />
  ),
};
