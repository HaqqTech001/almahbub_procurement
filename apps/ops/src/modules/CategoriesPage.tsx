import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  fetchOpsCategories,
  requireToken,
  type OpsCategoryRow,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsPage } from "../components/OpsChrome.js";
import { resolveOpsMediaUrl } from "./ProductsPage.js";
import {
  ModuleCardGrid,
  ModuleWorkspace,
} from "@hamd/ui/module-layout";

function statusBadgeClass(status: string): string {
  if (status === "published") return "hamd-badge hamd-badge--success";
  if (status === "draft") return "hamd-badge hamd-badge--warning";
  return "hamd-badge hamd-badge--info";
}

function statusLabel(status: string): string {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Draft";
}

export function CategoriesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<OpsCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const refresh = useCallback(async () => {
    setError(null);
    const token = await requireToken(auth.ensureSession);
    setRows(await fetchOpsCategories(token));
  }, [auth.ensureSession]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        setRows([]);
        setError(err instanceof Error ? err.message : "Unable to load categories.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && (row.status ?? "") !== statusFilter) return false;
      if (!needle) return true;
      return [row.name, row.slug ?? "", row.description ?? ""].join(" ").toLowerCase().includes(needle);
    });
  }, [rows, query, statusFilter]);

  const stats = [
    { label: "Categories", value: rows.length },
    { label: "Published", value: rows.filter((r) => r.status === "published").length },
    { label: "Draft", value: rows.filter((r) => r.status === "draft").length },
    { label: "Archived", value: rows.filter((r) => r.status === "archived").length },
  ];

  return (
    <OpsPage className="hamd-list-queue">
      <ModuleWorkspace
        header={{
          title: "Categories",
          description:
            "Published categories appear in public catalogue filters and the request product picker.",
          actions: (
            <button
              type="button"
              className="hamd-btn hamd-btn--primary"
              onClick={() => navigate("/categories/new")}
            >
              Create Category
            </button>
          ),
        }}
        toolbar={{
          search: {
            value: query,
            onChange: setQuery,
            placeholder: "Search categories",
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
          ],
          onReset: resetFilters,
        }}
        stats={stats}
        loading={loading}
        loadingLabel="Loading categories…"
        error={error}
        empty={
          !loading && rows.length === 0
            ? {
                title: "No categories yet",
                description: "Create a category to organize your product catalogue.",
                action: (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--primary"
                    onClick={() => navigate("/categories/new")}
                  >
                    Create Category
                  </button>
                ),
              }
            : !loading && filtered.length === 0
              ? {
                  title: "No categories match these filters",
                  description: "Adjust search or status to see more categories.",
                  onReset: resetFilters,
                }
              : null
        }
      >
        {!loading && filtered.length > 0 ? (
          <ModuleCardGrid
            items={filtered}
            getRowId={(row) => row.id}
            renderCard={(row) => (
              <Link className="hamd-module-card" to={`/categories/${row.id}`}>
                <span className="hamd-module-card__media">
                  {row.imageUrl ? (
                    <img
                      src={resolveOpsMediaUrl(row.imageUrl)}
                      alt={`${row.name} procurement category`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="hamd-module-card__media-fallback" aria-hidden="true">
                      {row.name.trim().slice(0, 1).toUpperCase() || "C"}
                    </span>
                  )}
                </span>
                <div className="hamd-module-card__body">
                  <span className="hamd-module-card__title" style={{ display: "block" }}>
                    {row.name}
                  </span>
                  <span className="hamd-module-card__meta">
                    {row.productCount ?? 0} products
                  </span>
                  <div className="hamd-module-card__footer">
                    <span className={statusBadgeClass(row.status ?? "")}>
                      {statusLabel(row.status ?? "draft")}
                    </span>
                  </div>
                </div>
              </Link>
            )}
          />
        ) : null}
      </ModuleWorkspace>
    </OpsPage>
  );
}
