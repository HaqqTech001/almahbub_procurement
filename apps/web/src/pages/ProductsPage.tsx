import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ListModuleFrame, FilterToolbar } from "@hamd/ui/module-layout";
import { EmptyState, ErrorState, Pagination } from "../components/index.js";
import {
  PublicProductCard,
  PublicProductCardSkeleton,
} from "../components/PublicProductCard.js";
import {
  CatalogApiError,
  listPublicCategories,
  listPublicProducts,
  type PublicCatalogCategory,
  type PublicCatalogProduct,
} from "../api/catalog-api.js";
import { productsContent } from "../content/pages.js";
import { productsPath, toCatalogCard } from "../lib/catalog-display.js";
import { applyPageSeo } from "../lib/seo.js";
import { useOptionalAuth } from "../auth/session/AuthProvider.js";

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 400;

export function ProductsPage() {
  const location = useLocation();
  const auth = useOptionalAuth();
  const workspace = location.pathname.startsWith("/app/products");
  const authenticated = auth?.status === "authenticated";
  const [params, setParams] = useSearchParams();
  const category = (params.get("category") ?? "").trim();
  const q = (params.get("q") ?? "").trim();
  const sort = params.get("sort") === "name" ? "name" : "newest";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const [draftQuery, setDraftQuery] = useState(q);
  const [products, setProducts] = useState<PublicCatalogProduct[]>([]);
  const [categories, setCategories] = useState<PublicCatalogCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    applyPageSeo(productsContent.seo);
  }, []);

  useEffect(() => {
    setDraftQuery(q);
  }, [q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draftQuery.trim();
      if (next === q) return;
      const nextParams = new URLSearchParams(params);
      if (next) nextParams.set("q", next);
      else nextParams.delete("q");
      nextParams.delete("page");
      setParams(nextParams, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draftQuery, params, q, setParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setErrorCode(null);
    void listPublicProducts({
      ...(category ? { category } : {}),
      ...(q ? { q } : {}),
      page,
      pageSize: PAGE_SIZE,
      sort,
    })
      .then((result) => {
        if (cancelled) return;
        setProducts(result.data);
        setTotal(result.page.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProducts([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "Unable to load products.");
        setErrorCode(err instanceof CatalogApiError ? err.code : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, q, page, sort, reloadNonce]);

  useEffect(() => {
    let cancelled = false;
    void listPublicCategories({ pageSize: 50 })
      .then((result) => {
        if (!cancelled) setCategories(result.data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const cards = useMemo(
    () =>
      products.map((product) =>
        toCatalogCard(product, { workspace, authenticated }),
      ),
    [products, workspace, authenticated],
  );
  const catalogueEmpty = !loading && !error && total === 0 && !q && !category;
  const filteredEmpty = !loading && !error && total === 0 && Boolean(q || category);

  const setFilter = (next: {
    category?: string | null;
    page?: number;
    sort?: string;
  }) => {
    const nextParams = new URLSearchParams(params);
    if (next.category === null) nextParams.delete("category");
    else if (next.category) nextParams.set("category", next.category);
    if (next.sort && next.sort !== "newest") nextParams.set("sort", next.sort);
    else if (next.sort === "newest") nextParams.delete("sort");
    if (next.page && next.page > 1) nextParams.set("page", String(next.page));
    else nextParams.delete("page");
    setParams(nextParams);
  };

  const toolbar = {
    search: {
      value: draftQuery,
      onChange: setDraftQuery,
      placeholder: "Search products",
    },
    filters: [
      {
        label: "Category",
        value: category || "all",
        onChange: (value: string) =>
          setFilter({ category: value === "all" ? null : value }),
        options: [
          { value: "all", label: "All categories" },
          ...categories.map((item) => ({
            value: item.slug,
            label: item.name,
          })),
        ],
      },
    ],
    sort: {
      value: sort,
      onChange: (value: string) => setFilter({ sort: value }),
      options: [
        { value: "newest", label: "Newest" },
        { value: "name", label: "Name" },
      ],
    },
    onReset: () => {
      setDraftQuery("");
      setParams(new URLSearchParams());
    },
  };

  const records = (
    <>
      {category ? (
        <p className="hamd-catalog-status" role="status">
          {categories.find((item) => item.slug === category)?.name ?? category}
          {" · "}
          <Link to={productsPath({ q: q || null, workspace })}>Clear</Link>
        </p>
      ) : null}

      {loading ? (
        <ul className="hamd-product-grid" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 12 }, (_, index) => (
            <li key={index}>
              <PublicProductCardSkeleton />
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <ErrorState
          title={
            errorCode === "NOT_FOUND" ? "Category not found" : "Unable to load products"
          }
          description={
            errorCode === "NOT_FOUND"
              ? "That category is not in the published catalogue."
              : errorCode === "NETWORK_ERROR" || errorCode === "TIMEOUT"
                ? "We couldn't load this information."
                : error
          }
          actionHref="/products"
          actionLabel="Back to products"
          onRetry={() => setReloadNonce((value) => value + 1)}
        />
      ) : null}

      {catalogueEmpty ? (
        <EmptyState
          title="Published products will appear here"
          description="The catalogue is ready for live Almahbub International products."
          actionHref={workspace ? "/app/requests/new" : "/contact"}
          actionLabel="Request Procurement"
        />
      ) : null}

      {filteredEmpty ? (
        <EmptyState
          title="No products matched your search."
          description="Try another search or category."
          actionHref={productsPath({ workspace })}
          actionLabel="Clear filters"
        />
      ) : null}

      {!loading && !error && cards.length > 0 ? (
        <ul className="hamd-product-grid">
          {cards.map((item, index) => (
            <li key={item.slug}>
              <PublicProductCard product={item} eager={index < 8} />
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !error && total > PAGE_SIZE ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={(nextPage) => setFilter({ page: nextPage })}
        />
      ) : null}
    </>
  );

  if (workspace) {
    return (
      <ListModuleFrame
        className="hamd-catalog-page hamd-list-queue"
        header={{ title: "Products" }}
        toolbar={toolbar}
      >
        {records}
      </ListModuleFrame>
    );
  }

  return (
    <div className="hamd-catalog-page">
      <header className="hamd-catalog-page__header hamd-catalog-page__header--compact">
        <h1>Products</h1>
      </header>
      <FilterToolbar {...toolbar} />
      {records}
    </div>
  );
}
