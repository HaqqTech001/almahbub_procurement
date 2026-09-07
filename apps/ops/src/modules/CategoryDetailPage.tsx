import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MediaLightbox, StatusBadge } from "@hamd/ui/primitives";

import {
  fetchOpsCategories,
  fetchOpsProducts,
  requireToken,
  type OpsCategoryRow,
  type OpsProductRow,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage } from "../components/OpsChrome.js";
import { resolveOpsMediaUrl } from "./ProductsPage.js";

function formatWhen(iso?: string): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function CategoryDetailPage() {
  const auth = useAuth();
  const { id = "" } = useParams();
  const [row, setRow] = useState<OpsCategoryRow | null>(null);
  const [products, setProducts] = useState<OpsProductRow[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const [list, catalog] = await Promise.all([
        fetchOpsCategories(token),
        fetchOpsProducts(token, { categoryId: id, pageSize: 8, page: 1 }),
      ]);
      const current = list.find((item) => item.id === id) ?? null;
      if (!current) {
        setError("Category not found.");
        setRow(null);
        setProducts([]);
        return;
      }
      setRow(current);
      setProducts(catalog.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load category.");
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const imageSrc = row?.imageUrl ? resolveOpsMediaUrl(row.imageUrl) : null;
  const relatedCount = row?.productCount ?? products.length;

  return (
    <OpsPage>
      <p>
        <Link to="/categories">Categories</Link>
      </p>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {loading ? <OpsLoading label="Loading category…" /> : null}
      {!loading && row ? (
        <article className="hamd-entity-page hamd-ops-category-detail">
          <header className="hamd-ops-category-detail__header">
            {imageSrc ? (
              <button
                type="button"
                className="hamd-ops-category-preview-hit"
                onClick={() => setPreviewOpen(true)}
              >
                <img
                  className="hamd-ops-category-detail__hero"
                  src={imageSrc}
                  alt={`${row.name} procurement equipment`}
                />
              </button>
            ) : (
              <span className="hamd-ops-category-detail__hero hamd-ops-category-detail__hero--empty">
                {row.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <h1>{row.name}</h1>
              <StatusBadge status={row.status ?? "draft"} />
              <div className="hamd-entity-form__actions">
                <Link className="hamd-btn hamd-btn--primary" to={`/categories/${row.id}/edit`}>
                  Edit Category
                </Link>
                <Link className="hamd-btn hamd-btn--secondary" to="/products/new">
                  Add Product
                </Link>
              </div>
            </div>
          </header>
          <section className="hamd-entity-section">
            <h2>Overview</h2>
            <p>{row.description?.trim() || "No description yet."}</p>
            <p>{relatedCount} product{relatedCount === 1 ? "" : "s"} in this category.</p>
          </section>
          <section className="hamd-entity-section">
            <h2>Related products</h2>
            {products.length === 0 ? (
              <div>
                <p>No products in this category yet.</p>
                <Link className="hamd-btn hamd-btn--secondary" to="/products/new">
                  Add Product
                </Link>
              </div>
            ) : (
              <ul className="hamd-ops-category-detail__products">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link to={`/products/${product.id}`}>{product.name}</Link>
                    <StatusBadge status={product.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="hamd-entity-section">
            <h2>Metadata</h2>
            <dl className="hamd-entity-meta">
              <div>
                <dt>Created</dt>
                <dd>{formatWhen(row.createdAt)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatWhen(row.updatedAt)}</dd>
              </div>
            </dl>
          </section>
        </article>
      ) : null}
      <MediaLightbox
        open={previewOpen && Boolean(imageSrc)}
        items={imageSrc ? [{ src: imageSrc, kind: "image", alt: row?.name || "Category image" }] : []}
        index={0}
        onClose={() => setPreviewOpen(false)}
      />
    </OpsPage>
  );
}
