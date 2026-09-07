import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCatalog } from "./ProductCatalog.js";
import { ProductCard } from "./ProductCard.js";
import { CategoryTree } from "./CategoryTree.js";
import { catalogFixture, catalogFixtureProducts } from "./fixtures.js";
import {
  COMPARE_LIMIT,
  availabilityLabel,
  emptyCatalogFilters,
  type CatalogFiltersState,
  type CatalogSortId,
  type CatalogViewMode,
} from "./types.js";
import { useCatalogSelection } from "./useCatalogSelection.js";

function CatalogHarness({
  scrollMode = "pages" as const,
  onQuickQuote,
}: {
  scrollMode?: "pages" | "infinite";
  onQuickQuote?: (p: (typeof catalogFixtureProducts)[0]) => void;
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
      pagination={{ ...catalogFixture.pagination, page }}
      scrollMode={scrollMode}
      onPageChange={setPage}
      onLoadMore={() => setPage((p) => p + 1)}
      onQuickQuote={onQuickQuote}
    />
  );
}

describe("catalog helpers", () => {
  it("labels availability without inventing stock language", () => {
    expect(availabilityLabel("available_to_source")).toBe("Available to source");
    expect(availabilityLabel("unknown")).toBe("Unknown");
  });
});

describe("ProductCard", () => {
  it("renders grid fields and procurement actions", async () => {
    const user = userEvent.setup();
    const onBookmark = vi.fn();
    const onCompare = vi.fn();
    const onQuickQuote = vi.fn();
    const product = catalogFixtureProducts[0]!;

    render(
      <ProductCard
        product={product}
        view="grid"
        onBookmark={onBookmark}
        onCompare={onCompare}
        onQuickQuote={onQuickQuote}
      />,
    );

    expect(screen.getByRole("heading", { name: product.name })).toBeInTheDocument();
    expect(screen.getByText(product.manufacturer)).toBeInTheDocument();
    expect(screen.getByText("Available to source")).toBeInTheDocument();
    expect(screen.queryByText(/in stock/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Quote on request")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save .* bookmarks/i }));
    expect(onBookmark).toHaveBeenCalledWith(product.id);

    await user.click(screen.getByRole("link", { name: /request procurement/i }));
    expect(onQuickQuote).toHaveBeenCalled();
  });

  it("supports list and compact variants", () => {
    const product = catalogFixtureProducts[1]!;
    const { rerender } = render(<ProductCard product={product} view="list" />);
    expect(screen.getByText("Brand")).toBeInTheDocument();

    rerender(<ProductCard product={product} view="compact" />);
    expect(screen.queryByText("Origin")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request procurement/i })).toBeInTheDocument();
  });
});

describe("CategoryTree", () => {
  it("expands children and toggles selection", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <CategoryTree
        nodes={catalogFixture.categories}
        selectedIds={[]}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByText("Ball valves")).toBeInTheDocument();
    await user.click(screen.getByLabelText(/industrial valves/i));
    expect(onToggle).toHaveBeenCalledWith("c-valves");
  });
});

function SelectionProbe() {
  const s = useCatalogSelection();
  return (
    <div>
      <button type="button" onClick={() => s.toggleCompare("a")}>
        Add A
      </button>
      <button type="button" onClick={() => s.toggleCompare("b")}>
        Add B
      </button>
      <button type="button" onClick={() => s.toggleCompare("c")}>
        Add C
      </button>
      <button type="button" onClick={() => s.toggleCompare("d")}>
        Add D
      </button>
      <button type="button" onClick={() => s.toggleCompare("e")}>
        Add E
      </button>
      <span data-testid="count">{s.compare.length}</span>
      <span data-testid="announce">{s.announce}</span>
    </div>
  );
}

describe("useCatalogSelection", () => {
  it("enforces compare limit of 4", async () => {
    const user = userEvent.setup();
    render(<SelectionProbe />);
    for (const name of ["Add A", "Add B", "Add C", "Add D", "Add E"]) {
      await user.click(screen.getByRole("button", { name }));
    }
    expect(screen.getByTestId("count")).toHaveTextContent(String(COMPARE_LIMIT));
    expect(screen.getByTestId("announce")).toHaveTextContent(/limit is 4/i);
  });
});

describe("ProductCatalog", () => {
  it("renders category tree, facets, results, and view modes", async () => {
    const user = userEvent.setup();
    render(<CatalogHarness />);

    expect(screen.getByRole("heading", { name: "Product catalog" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Manufacturers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Brands" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Suppliers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip to results/i })).toHaveAttribute(
      "href",
      "#catalog-results",
    );
    expect(document.getElementById("catalog-results")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "List" }));
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Compact" }));
    expect(screen.getByRole("button", { name: "Compact" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    expect(screen.getByRole("heading", { name: "Recently viewed" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recommendations" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Related products" })).toBeInTheDocument();
  });

  it("filters via search, sorts, bookmarks, and compare tray", async () => {
    const user = userEvent.setup();
    render(<CatalogHarness />);

    const search = screen.getByLabelText(/search catalog/i);
    await user.type(search, "valve");
    expect(search).toHaveValue("valve");

    await user.selectOptions(screen.getByLabelText("Sort"), "name_asc");
    expect(screen.getByLabelText("Sort")).toHaveValue("name_asc");

    const firstCard = screen.getAllByRole("article")[0]!;
    await user.click(
      within(firstCard).getByRole("button", { name: /save .* bookmarks/i }),
    );
    expect(
      within(firstCard).getByRole("button", { name: /remove .* bookmarks/i }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(within(firstCard).getByRole("button", { name: /compare /i }));
    expect(screen.getByRole("complementary", { name: /compare products/i })).toBeInTheDocument();
  });

  it("supports infinite scroll load-more mode", async () => {
    const user = userEvent.setup();
    render(
      <ProductCatalog
        {...catalogFixture}
        filters={emptyCatalogFilters()}
        onFiltersChange={() => undefined}
        sort="relevance"
        onSortChange={() => undefined}
        view="grid"
        onViewChange={() => undefined}
        pagination={{ page: 1, pageSize: 20, total: 40, hasMore: true }}
        scrollMode="infinite"
        onPageChange={() => undefined}
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /load more/i }));
  });

  it("clears smart filters", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ProductCatalog
        {...catalogFixture}
        filters={{
          ...emptyCatalogFilters(),
          manufacturerIds: ["m1"],
          query: "steel",
        }}
        onFiltersChange={onChange}
        sort="relevance"
        onSortChange={() => undefined}
        view="grid"
        onViewChange={() => undefined}
        pagination={catalogFixture.pagination}
        onPageChange={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: /clear all/i }));
    expect(onChange).toHaveBeenCalledWith(emptyCatalogFilters());
  });
});
