import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  deleteOpsProductImage,
  fetchOpsProduct,
  OpsApiError,
  requireToken,
  setOpsProductImagePrimary,
  updateOpsProduct,
  type OpsProductRow,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { OpsConfirmModal } from "../components/OpsConfirmModal.js";
import { StatusBadge } from "@hamd/ui";
import { resolveOpsMediaUrl, statusLabel, visibilityLabel } from "./ProductsPage.js";

function formatDate(iso?: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type ConfirmState = {
  title: string;
  body: string;
  confirmLabel: string;
  tone: "danger" | "default";
  run: () => Promise<void>;
};

export function ProductDetailPage() {
  const auth = useAuth();
  const location = useLocation();
  const { id = "" } = useParams();
  const [row, setRow] = useState<OpsProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const notice = (location.state as { message?: string } | null)?.message ?? null;
  const seenNotice = useRef(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      setRow(await fetchOpsProduct(token, id));
    } catch (err) {
      setRow(null);
      setError(
        err instanceof OpsApiError && err.status === 404
          ? "Product not found. It may have been removed."
          : err instanceof OpsApiError && err.status === 403
            ? "You do not have permission to manage products."
            : err instanceof Error
              ? err.message
              : "Unable to load this product.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (notice && !seenNotice.current) {
      seenNotice.current = true;
      setSuccess(notice);
    }
  }, [notice]);

  const primary = useMemo(() => {
    const image = row?.images?.find((image) => image.url.trim().length > 0);
    return image ? { ...image, url: resolveOpsMediaUrl(image.url) } : null;
  }, [row]);

  const remainingImages = useMemo(() => {
    if (!row?.images) return [];
    const primaryId = primary?.id;
    return row.images.filter((image) => image.id !== primaryId);
  }, [primary, row]);

  const setStatus = useCallback(
    async (status: "draft" | "published" | "archived") => {
      if (!row || busy) return;
      setBusy(true);
      setError(null);
      try {
        const token = await requireToken(auth.ensureSession);
        await updateOpsProduct(token, row.id, { status });
        setSuccess(
          status === "published"
            ? "Product published to the public catalogue."
            : status === "archived"
              ? "Product archived and hidden from the public catalogue."
              : "Product saved as draft.",
        );
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update product status.");
      } finally {
        setBusy(false);
      }
    },
    [auth.ensureSession, busy, refresh, row],
  );

  const confirmArchive = () => {
    setConfirm({
      title: "Archive this product?",
      body: `"${row?.name}" will be hidden from the public catalogue and marked as archived. You can save it back to draft later.`,
      confirmLabel: "Archive product",
      tone: "danger",
      run: async () => {
        await setStatus("archived");
      },
    });
  };

  const confirmDeleteImage = (imageId: string, alt: string) => {
    setConfirm({
      title: "Remove this image?",
      body: `The image${alt ? ` "${alt}"` : ""} will be removed from the product gallery. This cannot be undone.`,
      confirmLabel: "Remove image",
      tone: "danger",
      run: async () => {
        if (!row) return;
        setBusy(true);
        try {
          const token = await requireToken(auth.ensureSession);
          await deleteOpsProductImage(token, row.id, imageId);
          setSuccess("Image removed from the product gallery.");
          await refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to remove the image.");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const setPrimary = async (imageId: string) => {
    if (!row || busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      await setOpsProductImagePrimary(token, row.id, imageId);
      setSuccess("Primary image updated.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the primary image.");
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await confirm.run();
      setConfirm(null);
    } catch {
      /* error already surfaced by the run handler */
    } finally {
      setBusy(false);
    }
  };

  return (
    <OpsPage className="hamd-ops-product-detail">
      <div className="hamd-ops-product-detail__rail">
        <Link className="hamd-ops-product-detail__back" to="/products">
          <span aria-hidden="true">←</span> All products
        </Link>
      </div>

      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      {loading ? <OpsLoading label="Loading product…" /> : null}

      {!loading && row ? (
        <>
          <header className="hamd-ops-product-detail__header">
            <div>
              <p className="hamd-ops-product-detail__kicker">Product</p>
              <h1 className="hamd-ops-module__title">{row.name}</h1>
              <p className="hamd-ops-product-detail__status-line">
                <StatusBadge status={row.status} label={statusLabel(row.status)} />
                <span>{row.categoryName ?? "Uncategorised"}</span>
              </p>
              <p className="hamd-ops-product-detail__visibility">{visibilityLabel(row.status)}</p>
            </div>
            <div className="hamd-ops-product-detail__actions">
              <Link
                className="hamd-btn hamd-btn--secondary"
                to={`/products/${row.id}/edit`}
              >
                Edit Product
              </Link>
              {row.status !== "published" ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--primary"
                  disabled={busy}
                  onClick={() => void setStatus("published")}
                >
                  Publish
                </button>
              ) : null}
              {row.status !== "draft" ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  disabled={busy}
                  onClick={() => void setStatus("draft")}
                >
                  Save as draft
                </button>
              ) : null}
              {row.status !== "archived" ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  disabled={busy}
                  onClick={confirmArchive}
                >
                  Archive
                </button>
              ) : null}
            </div>
          </header>

          <div className="hamd-ops-product-detail__stack">
            <section className="hamd-ops-product-detail__panel hamd-ops-product-detail__media" aria-labelledby="product-media">
              <h2 id="product-media">Media</h2>
              <div className="hamd-ops-product-detail__hero">
                {primary ? (
                  <img src={primary.url} alt={primary.altText?.trim() || row.name} />
                ) : (
                  <span className="hamd-ops-product-detail__no-media" aria-hidden="true">
                    {row.name.trim().slice(0, 1).toUpperCase() || "P"}
                  </span>
                )}
              </div>
              {remainingImages.length > 0 ? (
                <ul className="hamd-ops-product-detail__gallery" role="list">
                  {remainingImages.map((image) => (
                    <li key={image.id} className="hamd-ops-product-detail__gallery-item">
                      <img
                        src={resolveOpsMediaUrl(image.url)}
                        alt={image.altText?.trim() || row.name}
                      />
                      <span className="hamd-ops-product-detail__gallery-actions">
                        <button
                          type="button"
                          className="hamd-btn hamd-btn--ghost"
                          disabled={busy}
                          onClick={() => void setPrimary(image.id)}
                        >
                          Make primary
                        </button>
                        <button
                          type="button"
                          className="hamd-btn hamd-btn--ghost"
                          disabled={busy}
                          onClick={() =>
                            confirmDeleteImage(image.id, image.altText?.trim() ?? "")
                          }
                        >
                          Remove
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="hamd-ops-product-detail__panel hamd-ops-product-detail__overview" aria-labelledby="product-overview">
              <h2 id="product-overview">Overview</h2>
              {row.description ? (
                <p className="hamd-ops-product-detail__description">{row.description}</p>
              ) : (
                <p className="hamd-ops-product-detail__empty">No description recorded.</p>
              )}
            </section>

            <section className="hamd-ops-product-detail__panel" aria-labelledby="product-specs">
              <h2 id="product-specs">Specifications</h2>
              <dl className="hamd-admin-dl">
                <div>
                  <dt>Brand</dt>
                  <dd>{row.brandName ?? "Not specified"}</dd>
                </div>
                <div>
                  <dt>Manufacturer</dt>
                  <dd>{row.manufacturerName ?? "Not specified"}</dd>
                </div>
                <div>
                  <dt>Country of manufacture</dt>
                  <dd>{row.manufacturerCountry ?? "Not specified"}</dd>
                </div>
              </dl>
            </section>

            <section className="hamd-ops-product-detail__panel hamd-ops-product-detail__info" aria-labelledby="product-catalogue">
              <h2 id="product-catalogue">Catalogue information</h2>
              <dl className="hamd-admin-dl">
                <div>
                  <dt>Category</dt>
                  <dd>{row.categoryName ?? "Uncategorised"}</dd>
                </div>
                <div>
                  <dt>Visibility</dt>
                  <dd>{visibilityLabel(row.status)}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(row.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDateTime(row.updatedAt)}</dd>
                </div>
              </dl>

              {row.videos && row.videos.length > 0 ? (
                <div className="hamd-ops-product-detail__section">
                  <h3>Videos</h3>
                  <ul className="hamd-ops-product-detail__videos" role="list">
                    {row.videos.map((video) => (
                      <li key={video.id}>
                        <span className="hamd-ops-product-detail__video-title">
                          {video.title ?? "Catalogue video"}
                        </span>
                        {video.caption ? (
                          <span className="hamd-ops-product-detail__video-caption">
                            {video.caption}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </div>
        </>
      ) : null}

      <OpsConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        tone={confirm?.tone ?? "default"}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
      >
        <p>{confirm?.body}</p>
      </OpsConfirmModal>
    </OpsPage>
  );
}