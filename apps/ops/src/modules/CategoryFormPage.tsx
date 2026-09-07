import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { MediaLightbox } from "@hamd/ui/primitives";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  OpsApiError,
  createOpsCategory,
  fetchOpsCategories,
  requireToken,
  updateOpsCategory,
  uploadOpsCategoryImage,
  type OpsCategoryRow,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage } from "../components/OpsChrome.js";
import { resolveOpsMediaUrl } from "./ProductsPage.js";

type CategoryStatus = "draft" | "published" | "archived";

export function CategoryFormPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;
  const [row, setRow] = useState<OpsCategoryRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CategoryStatus>("published");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(!isCreate);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const previewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    if (removeExisting) return null;
    return row?.imageUrl ? resolveOpsMediaUrl(row.imageUrl) : null;
  }, [imageFile, removeExisting, row]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const list = await fetchOpsCategories(token);
      const current = list.find((item) => item.id === id) ?? null;
      if (!current) {
        setError("Category not found.");
        setRow(null);
        return;
      }
      setRow(current);
      setName(current.name);
      setDescription(current.description ?? "");
      setStatus((current.status as CategoryStatus) || "published");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load category.");
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, id]);

  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      return;
    }
    void load();
  }, [isCreate, load]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        ...(removeExisting && !imageFile ? { clearImage: true } : {}),
      };
      const saved = isCreate
        ? await createOpsCategory(token, body)
        : await updateOpsCategory(token, id!, body);
      if (imageFile) {
        await uploadOpsCategoryImage(token, saved.id, imageFile);
      }
      navigate(`/categories/${saved.id}`);
    } catch (err) {
      setError(
        err instanceof OpsApiError && (err.status === 413 || err.status === 415 || err.status === 422)
          ? err.message
          : err instanceof OpsApiError && err.status >= 500 && imageFile
            ? "Image could not be uploaded. Please try again."
            : err instanceof Error
              ? err.message
              : "Save failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OpsPage className="hamd-entity-page">
      <p>
        <Link to="/categories">Categories</Link>
      </p>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {loading ? <OpsLoading label="Loading category…" /> : null}
      {!loading ? (
        <form className="hamd-entity-form hamd-entity-form--simple" onSubmit={(event) => void onSubmit(event)}>
          <header className="hamd-entity-form__header">
            <div>
              <h1>{isCreate ? "Create category" : row?.name || "Edit category"}</h1>
              <p>Name, optional image, and visibility. The public URL is generated automatically.</p>
            </div>
          </header>
          <div className="hamd-entity-form__main">
            <section className="hamd-entity-section">
              <h2>Basic information</h2>
              <label className="hamd-entity-field" htmlFor="ops-category-name">
                Name
                <input
                  id="ops-category-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
              <label className="hamd-entity-field" htmlFor="ops-category-description">
                Description
                <textarea
                  id="ops-category-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                />
              </label>
            </section>
            <section className="hamd-entity-section">
              <h2>Category image</h2>
              <p>Upload a catalogue image. This is not an image URL field.</p>
              <label className="hamd-entity-dropzone" htmlFor="ops-category-image">
                <span>{previewUrl ? "Replace image" : "Drag and drop or browse a JPEG, PNG, WebP or GIF file."}</span>
                <input
                  id="ops-category-image"
                  className="hamd-sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    setImageFile(event.target.files?.[0] ?? null);
                    setRemoveExisting(false);
                  }}
                />
              </label>
              {previewUrl ? (
                <button
                  type="button"
                  className="hamd-ops-category-preview-hit"
                  onClick={() => setPreviewOpen(true)}
                >
                  <img
                    className="hamd-ops-category-preview"
                    src={previewUrl}
                    alt={name ? `${name} category image preview` : "Category image preview"}
                  />
                </button>
              ) : (
                <p>No image yet.</p>
              )}
              {previewUrl ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => {
                    setImageFile(null);
                    setRemoveExisting(true);
                    setPreviewOpen(false);
                  }}
                >
                  Remove image
                </button>
              ) : null}
            </section>
          </div>
          <aside className="hamd-entity-form__aside">
            <section className="hamd-entity-section">
              <h2>Publishing</h2>
              <label className="hamd-entity-field">
                Visibility
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as CategoryStatus)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </section>
            <div className="hamd-entity-form__actions">
              <button type="submit" className="hamd-btn hamd-btn--primary" disabled={busy}>
                {isCreate ? "Create category" : "Save category"}
              </button>
              {!isCreate ? (
                <Link className="hamd-btn hamd-btn--secondary" to={`/categories/${id}`}>
                  View category
                </Link>
              ) : null}
            </div>
          </aside>
        </form>
      ) : null}
      <MediaLightbox
        open={previewOpen && Boolean(previewUrl)}
        items={previewUrl ? [{ src: previewUrl, kind: "image", alt: name || "Category image" }] : []}
        index={0}
        onClose={() => setPreviewOpen(false)}
      />
    </OpsPage>
  );
}
