import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isCancelledRequest } from "@hamd/ui/auth";
import {
  ModuleCardGrid,
  ModuleTable,
  ModuleWorkspace,
} from "@hamd/ui/module-layout";

import {
  fetchOpsCategories,
  fetchOpsProducts,
  OpsApiError,
  requireToken,
  type OpsCategoryRow,
  type OpsProductRow,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { browserApiBase } from "../lib/api-origin.js";
import { OpsPage } from "../components/OpsChrome.js";
import { ProductListMedia } from "../components/ProductListMedia.js";

const VIEW_KEY = "hamd.ops.products.view";

type ViewMode = "grid" | "table";

export function resolveOpsMediaUrl(url: string): string {
  const value = url.trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  const base = browserApiBase().replace(/\/$/, "");
  if (value.startsWith("/")) return `${base}${value}`;
  return `${base}/${value}`;
}

export function statusLabel(status: string): string {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Draft";
}

export function visibilityLabel(status: string): string {
  if (status === "published") return "Visible in the public catalogue.";
  if (status === "archived") return "Hidden from the public catalogue.";
  return "Not visible until published.";
}

function statusBadgeClass(status: string): string {
  if (status === "published") return "hamd-badge hamd-badge--success";
  if (status === "archived") return "hamd-badge hamd-badge--info";
  return "hamd-badge hamd-badge--warning";
}

function readViewMode(): ViewMode {
  try {
    const stored = window.localStorage.getItem(VIEW_KEY);
    if (stored === "table" || stored === "grid") return stored;
  } catch {
    /* ignore */
  }
  return "grid";
}

export function ProductsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<OpsProductRow[]>([]);
  const [categories, setCategories] = useState<OpsCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState("recommended");
  const [listPage, setListPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    hasMore: false,
  });
  const [view, setView] = useState<ViewMode>(readViewMode);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const [products, cats] = await Promise.all([
        fetchOpsProducts(token, {
          q: debouncedQuery.trim() || undefined,
          sort: sortKey,
          page: listPage,
          pageSize: 25,
          status: statusFilter === "all" ? undefined : statusFilter,
          categoryId:
            categoryFilter !== "all" && categoryFilter !== "__none__"
              ? categoryFilter
              : undefined,
        }),
        fetchOpsCategories(token),
      ]);
      setRows(products.data);
      setPageMeta(products.page);
      setCategories(cats);
      setError(null);
    } catch (err) {
      if (isCancelledRequest(err)) return;
      const message =
        err instanceof OpsApiError && err.status === 401
          ? "Your session expired. Sign in again."
          : err instanceof OpsApiError && err.status === 403
            ? "You do not have permission to manage products."
            : err instanceof Error
              ? err.message
              : "Unable to load products.";
      if (rowsRef.current.length === 0) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, categoryFilter, debouncedQuery, listPage, statusFilter, sortKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    setListPage(1);
  }, [debouncedQuery, categoryFilter, statusFilter, sortKey]);

  const setViewMode = (next: ViewMode) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const resetFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSortKey("recommended");
    setListPage(1);
  };

  const categoryName = (id: string | null | undefined): string | null => {
    if (!id) return null;
    return categories.find((category) => category.id === id)?.name ?? null;
  };

  const filtered = rows;

  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];

  const stats = [
    { label: "Products", value: pageMeta.total || rows.length },
    {
      label: statusFilter === "published" ? "Published (this filter)" : "On this page",
      value: rows.filter((row) => row.status === "published").length,
    },
  ];



  return (
    <OpsPage className="hamd-list-queue">
      <ModuleWorkspace
        header={{
          title: "Products",
          description: pageMeta.total
            ? `${pageMeta.total.toLocaleString()} products match the current filters. Use Previous and Next to browse every page.`
            : "Published products appear in the public catalogue. Drafts stay internal until you publish them.",
          actions: (
            <>
              <div className="hamd-module-toolbar__segment" role="group" aria-label="View">
                <button
                  type="button"
                  className={view === "grid" ? "hamd-btn hamd-btn--secondary" : "hamd-btn hamd-btn--ghost"}
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </button>
                <button
                  type="button"
                  className={view === "table" ? "hamd-btn hamd-btn--secondary" : "hamd-btn hamd-btn--ghost"}
                  onClick={() => setViewMode("table")}
                >
                  Table
                </button>
              </div>
              <button
                type="button"
                className="hamd-btn hamd-btn--primary"
                onClick={() => navigate("/products/new")}
              >
                Create Product
              </button>
            </>
          ),
        }}
        toolbar={{
          search: {
            value: query,
            onChange: setQuery,
            placeholder: "Search products",
          },
          filters: [
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "All statuses" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
              ],
            },
            {
              label: "Category",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: categoryOptions,
            },
            {
              label: "Sort",
              value: sortKey,
              onChange: setSortKey,
              options: [
                { value: "recommended", label: "Recommended" },
                { value: "newest", label: "Newest" },
                { value: "name", label: "Name" },
                { value: "status", label: "Status" },
              ],
            },
          ],
          onReset: resetFilters,
        }}
        stats={stats}
        pagination={
          pageMeta.total > 0 ? (
            <div className="hamd-ops-module__pager" role="navigation" aria-label="Product pages">
              <span>
                Page {pageMeta.page} of {Math.max(1, Math.ceil(pageMeta.total / pageMeta.pageSize))} ·{" "}
                {pageMeta.total.toLocaleString()} products
              </span>
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                disabled={listPage <= 1}
                onClick={() => setListPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                disabled={!pageMeta.hasMore}
                onClick={() => setListPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          ) : null
        }
        loading={loading}
        loadingLabel="Loading products…"
        error={error}
        onRetry={() => {
          setLoading(true);
          void refresh();
        }}
        empty={
          !loading && rows.length === 0
            ? {
                title: "No products yet",
                description: "Create a product to add it to the operations catalogue.",
                action: (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--primary"
                    onClick={() => navigate("/products/new")}
                  >
                    Create Product
                  </button>
                ),
              }
            : !loading && filtered.length === 0
              ? {
                  title: "No products match these filters",
                  description: "Adjust search, status, or category to see more products.",
                  onReset: resetFilters,
                }
              : null
        }
      >
        {!loading && filtered.length > 0 && view === "grid" ? (
          <ModuleCardGrid
            items={filtered}
            getRowId={(row) => row.id}
            renderCard={(row) => {
              return (
                <Link className="hamd-module-card" to={`/products/${row.id}`}>
                  <span className="hamd-module-card__media">
                    <ProductListMedia name={row.name} images={(row.images ?? []).map(image => ({ ...image, url: resolveOpsMediaUrl(image.url) }))} />
                  </span>
                  <div className="hamd-module-card__body">
                    <span className="hamd-module-card__title" style={{ display: "block" }}>
                      {row.name}
                    </span>
                    <span className="hamd-module-card__meta">
                      {row.categoryName ?? categoryName(row.categoryId) ?? "Uncategorised"}
                    </span>
                    <div className="hamd-module-card__footer">
                      <span className={statusBadgeClass(row.status)}>{statusLabel(row.status)}</span>
                    </div>
                  </div>
                </Link>
              );
            }}
          />
        ) : null}
        {!loading && filtered.length > 0 && view === "table" ? (
          <ModuleTable
            rows={filtered}
            getRowId={(row) => row.id}
            onRowClick={(row) => navigate(`/products/${row.id}`)}
            columns={[
              {
                key: "name",
                label: "Product",
                render: (row) => <Link to={`/products/${row.id}`}>{row.name}</Link>,
              },
              {
                key: "category",
                label: "Category",
                render: (row) =>
                  row.categoryName ?? categoryName(row.categoryId) ?? "Uncategorised",
              },
              {
                key: "status",
                label: "Status",
                render: (row) => statusLabel(row.status),
              },
            ]}
          />
        ) : null}
      </ModuleWorkspace>
    </OpsPage>
  );
}
