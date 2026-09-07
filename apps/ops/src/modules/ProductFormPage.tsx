import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  createOpsProduct,
  deleteOpsProductImage,
  deleteOpsProductVideo,
  fetchOpsBrands,
  fetchOpsCategories,
  fetchOpsManufacturers,
  fetchOpsProduct,
  OpsApiError,
  requireToken,
  setOpsProductImagePrimary,
  updateOpsProduct,
  uploadOpsProductImage,
  uploadOpsProductVideo,
  type OpsBrandRow,
  type OpsCategoryRow,
  type OpsManufacturerRow,
  type OpsProductImage,
  type OpsProductRow,
  type OpsProductVideo,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage } from "../components/OpsChrome.js";
import { OpsConfirmModal } from "../components/OpsConfirmModal.js";
import { resolveOpsMediaUrl, statusLabel, visibilityLabel } from "./ProductsPage.js";

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
};

type PendingVideo = {
  id: string;
  file: File;
  title: string;
  caption: string;
};

type ProductStatus = "draft" | "published" | "archived";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d="M12 16V6m0 0l-4 4m4-4l4 4M5 18h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MediaDropzone({
  title,
  hint,
  acceptTypes,
  maxBytes,
  multiple,
  disabled,
  onAddFiles,
}: {
  title: string;
  hint: string;
  acceptTypes: readonly string[];
  maxBytes: number;
  multiple?: boolean;
  disabled?: boolean;
  onAddFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const accept = acceptTypes.join(",");

  const valid = (files: FileList | null): File[] => {
    if (!files) return [];
    return Array.from(files).filter(
      (file) => acceptTypes.includes(file.type) && file.size > 0 && file.size <= maxBytes,
    );
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (disabled) return;
    const accepted = valid(event.dataTransfer.files);
    if (accepted.length > 0) onAddFiles(accepted);
  };

  return (
    <div
      className={dragActive ? "hamd-entity-dropzone is-drag" : "hamd-entity-dropzone"}
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!disabled) inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragActive(false);
      }}
      onDrop={onDrop}
    >
      <UploadIcon />
      <strong>{dragActive ? "Release to add files" : title}</strong>
      <p>Drag and drop files here, or browse files.</p>
      <span className="hamd-btn hamd-btn--secondary" aria-hidden="true">
        Browse files
      </span>
      <small>{hint}</small>
      <input
        ref={inputRef}
        type="file"
        className="hamd-sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          const accepted = valid(event.target.files);
          event.target.value = "";
          if (accepted.length > 0) onAddFiles(accepted);
        }}
      />
    </div>
  );
}

function focusFirstError(errors: Record<string, string>) {
  const order = ["name", "category", "description"];
  const first = order.find((key) => errors[key]);
  if (!first) return;
  const node = document.getElementById(`product-${first}`);
  node?.scrollIntoView({ block: "center" });
  if (node instanceof HTMLElement) node.focus();
}

export function ProductFormPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const editing = Boolean(id);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmRemove, setConfirmRemove] = useState<{
    kind: "image" | "video";
    recordId: string;
    label: string;
  } | null>(null);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [status, setStatus] = useState<ProductStatus>("draft");

  const [categories, setCategories] = useState<OpsCategoryRow[]>([]);
  const [brands, setBrands] = useState<OpsBrandRow[]>([]);
  const [manufacturers, setManufacturers] = useState<OpsManufacturerRow[]>([]);

  const [row, setRow] = useState<OpsProductRow | null>(null);
  const [existingImages, setExistingImages] = useState<OpsProductImage[]>([]);
  const [existingVideos, setExistingVideos] = useState<OpsProductVideo[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);

  const createdIdRef = useRef<string | null>(id || null);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  pendingImagesRef.current = pendingImages;
  const slugTouched = useRef(false);

  useEffect(() => {
    return () => {
      for (const item of pendingImagesRef.current) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const [cats, brandRows, manufacturerRows] = await Promise.all([
        fetchOpsCategories(token),
        fetchOpsBrands(token).catch(() => [] as OpsBrandRow[]),
        fetchOpsManufacturers(token).catch(() => [] as OpsManufacturerRow[]),
      ]);
      setCategories(cats);
      setBrands(brandRows);
      setManufacturers(manufacturerRows);
      if (id) {
        const product = await fetchOpsProduct(token, id);
        setRow(product);
        setName(product.name);
        setSlug(product.slug);
        slugTouched.current = true;
        setDescription(product.description ?? "");
        setCategoryId(product.categoryId ?? "");
        setBrandId(product.brandId ?? "");
        setManufacturerId(product.manufacturerId ?? "");
        setStatus((product.status as ProductStatus) || "draft");
        setExistingImages(product.images ?? []);
        setExistingVideos(product.videos ?? []);
      }
    } catch (err) {
      setError(
        err instanceof OpsApiError && err.status === 403
          ? "You do not have permission to manage products."
          : err instanceof Error
            ? err.message
            : editing
              ? "Unable to load this product."
              : "Unable to load catalogue data.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, editing, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSlugFromName = (value: string) => {
    setName(value);
    if (!slugTouched.current) setSlug(slugify(value));
  };

  const addImageFiles = (files: File[]) => {
    const rejected = files.filter(
      (file) => !IMAGE_TYPES.includes(file.type) || file.size <= 0 || file.size > MAX_IMAGE_BYTES,
    );
    if (rejected.length > 0) {
      setError(
        "Some images were skipped. Accepted formats: JPEG, PNG, GIF, WebP. Each file must be 10 MB or smaller.",
      );
    }
    const accepted = files.filter(
      (file) => IMAGE_TYPES.includes(file.type) && file.size > 0 && file.size <= MAX_IMAGE_BYTES,
    );
    setFieldErrors((current) => ({ ...current, images: "" }));
    setPendingImages((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: `img-${crypto.randomUUID?.() ?? `${file.name}-${file.size}`}`,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: "",
      })),
    ]);
  };

  const removePendingImage = (imageId: string) => {
    setPendingImages((current) => {
      const item = current.find((rowItem) => rowItem.id === imageId);
      if (item) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          /* ignore */
        }
      }
      return current.filter((rowItem) => rowItem.id !== imageId);
    });
  };

  const addVideoFiles = (files: File[]) => {
    const rejected = files.filter(
      (file) => file.type !== "video/mp4" || file.size <= 0 || file.size > MAX_VIDEO_BYTES,
    );
    if (rejected.length > 0) {
      setError("Some videos were skipped. Only MP4 video up to 80 MB is accepted.");
    }
    const accepted = files.filter(
      (file) => file.type === "video/mp4" && file.size > 0 && file.size <= MAX_VIDEO_BYTES,
    );
    setPendingVideos((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: `vid-${crypto.randomUUID?.() ?? `${file.name}-${file.size}`}`,
        file,
        title: "",
        caption: "",
      })),
    ]);
  };

  const persist = async (nextStatus: ProductStatus) => {
    setError(null);
    setFieldErrors({});
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Product name is required.";
    else if (name.trim().length < 2) errors.name = "Product name must be at least 2 characters.";
    const finalSlug = slug.trim() || slugify(name);
    if (nextStatus === "published") {
      if (!categoryId) errors.category = "A category is required before publishing.";
      if (!description.trim()) errors.description = "A description is required before publishing.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }

    setSaving(true);
    try {
      const token = await requireToken(auth.ensureSession);
      const body = {
        name: name.trim(),
        slug: finalSlug || undefined,
        description: description.trim() ? description.trim() : null,
        categoryId: categoryId || null,
        brandId: brandId || null,
        manufacturerId: manufacturerId || null,
        status: nextStatus,
      };
      let productId = createdIdRef.current ?? "";
      if (productId) {
        await updateOpsProduct(token, productId, body);
      } else {
        const created = await createOpsProduct(token, body);
        productId = created.id;
        createdIdRef.current = created.id;
      }

      let uploadedImages = 0;
      for (const image of pendingImages) {
        await uploadOpsProductImage(token, productId, image.file, image.altText || null);
        uploadedImages += 1;
      }
      let uploadedVideos = 0;
      for (const video of pendingVideos) {
        await uploadOpsProductVideo(token, productId, video.file, {
          title: video.title.trim() || null,
          caption: video.caption.trim() || null,
        });
        uploadedVideos += 1;
      }

      const mediaNote =
        uploadedImages + uploadedVideos > 0
          ? ` ${uploadedImages} image${uploadedImages === 1 ? "" : "s"}${
              uploadedVideos > 0
                ? ` and ${uploadedVideos} video${uploadedVideos === 1 ? "" : "s"}`
                : ""
            } uploaded.`
          : "";
      for (const item of pendingImages) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          /* ignore */
        }
      }
      navigate(`/products/${productId}`, {
        state: { message: `Saved.${mediaNote}` },
      });
    } catch (err) {
      setError(
        err instanceof OpsApiError && err.status === 403
          ? "You do not have permission to manage products."
          : err instanceof OpsApiError && (err.status === 413 || err.status === 415 || err.status === 422)
            ? err.message
            : err instanceof OpsApiError && err.status >= 500
              ? "Image could not be uploaded. Please try again."
          : err instanceof Error
            ? err.message
            : "Unable to save the product.",
      );
      setSaving(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void persist(status);
  };

  const markPrimary = async (imageId: string) => {
    const productId = createdIdRef.current ?? id;
    if (!productId) return;
    setSaving(true);
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      await setOpsProductImagePrimary(token, productId, imageId);
      setExistingImages((current) => {
        const chosen = current.find((item) => item.id === imageId);
        if (!chosen) return current;
        return [chosen, ...current.filter((item) => item.id !== imageId)];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to set the primary image.");
    } finally {
      setSaving(false);
    }
  };

  const runConfirmRemove = async () => {
    if (!confirmRemove) return;
    const productId = createdIdRef.current ?? id;
    setSaving(true);
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      if (confirmRemove.kind === "image") {
        await deleteOpsProductImage(token, productId, confirmRemove.recordId);
        setExistingImages((current) => current.filter((item) => item.id !== confirmRemove.recordId));
      } else {
        await deleteOpsProductVideo(token, productId, confirmRemove.recordId);
        setExistingVideos((current) => current.filter((item) => item.id !== confirmRemove.recordId));
      }
      setConfirmRemove(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to remove ${confirmRemove.label}.`);
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(q));
  }, [categories, categoryQuery]);

  const primaryImage = existingImages[0] ?? null;
  const selectedCategory = categories.find((category) => category.id === categoryId);

  const actions = (
    <div className="hamd-entity-form__actions">
      <Link className="hamd-btn hamd-btn--ghost" to="/products">
        Cancel
      </Link>
      <button
        type="button"
        className="hamd-btn hamd-btn--secondary"
        disabled={saving}
        onClick={() => void persist("draft")}
      >
        Save draft
      </button>
      <button type="submit" className="hamd-btn hamd-btn--primary" disabled={saving} form="ops-product-form">
        {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
      </button>
    </div>
  );

  return (
    <OpsPage className="hamd-entity-page">
      <nav className="hamd-entity-form__crumb" aria-label="Breadcrumb">
        <Link to="/products">Products</Link>
        <span aria-hidden="true">/</span>
        <span>{editing ? "Edit product" : "Create product"}</span>
      </nav>

      <header className="hamd-entity-form__header">
        <div>
          <h1>{editing ? "Edit product" : "Create product"}</h1>
          <p>
            {editing
              ? "Update catalogue details, media, and publishing for this item."
              : "Add a catalogue item with clear details, media, and publishing controls."}
          </p>
        </div>
        {actions}
      </header>

      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {loading ? <OpsLoading label="Loading product…" /> : null}

      {!loading ? (
        <form id="ops-product-form" className="hamd-entity-form" onSubmit={onSubmit} noValidate>
          <div className="hamd-entity-form__main">
            <section className="hamd-entity-section">
              <h2>Basic information</h2>
              <p>Name and category are what buyers see first in the catalogue.</p>
              <div className="hamd-entity-grid">
                <label className="hamd-entity-field">
                  Product name
                  <input
                    id="product-name"
                    value={name}
                    onChange={(event) => updateSlugFromName(event.target.value)}
                    aria-invalid={fieldErrors.name ? true : undefined}
                    autoComplete="off"
                  />
                  {fieldErrors.name ? (
                    <span className="hamd-entity-field__error" role="alert">
                      {fieldErrors.name}
                    </span>
                  ) : null}
                </label>
                <label className="hamd-entity-field">
                  Category
                  {categories.length > 6 ? (
                    <input
                      type="search"
                      value={categoryQuery}
                      onChange={(event) => setCategoryQuery(event.target.value)}
                      placeholder="Search categories"
                      aria-label="Search categories"
                    />
                  ) : null}
                  <select
                    id="product-category"
                    value={categoryId}
                    onChange={(event) => {
                      setCategoryId(event.target.value);
                      setFieldErrors((current) => ({ ...current, category: "" }));
                    }}
                    aria-invalid={fieldErrors.category ? true : undefined}
                  >
                    <option value="">Uncategorised</option>
                    {(categories.length > 6 ? filteredCategories : categories).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category ? (
                    <span className="hamd-entity-field__error" role="alert">
                      {fieldErrors.category}
                    </span>
                  ) : null}
                  {categories.length === 0 ? (
                    <span className="hamd-entity-field__hint">
                      No categories yet.{" "}
                      <Link to="/categories">Create a category</Link> first.
                    </span>
                  ) : null}
                </label>
              </div>
            </section>

            <section className="hamd-entity-section">
              <h2>Product details</h2>
              <p>Describe the item clearly. Brand and manufacturer are optional.</p>
              <div className="hamd-entity-grid">
                <label className="hamd-entity-field">
                  Brand
                  <select value={brandId} onChange={(event) => setBrandId(event.target.value)}>
                    <option value="">No brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="hamd-entity-field">
                  Manufacturer
                  <select
                    value={manufacturerId}
                    onChange={(event) => setManufacturerId(event.target.value)}
                  >
                    <option value="">No manufacturer</option>
                    {manufacturers.map((manufacturer) => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.legalName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="hamd-entity-field hamd-entity-field--wide">
                  Description
                  <textarea
                    id="product-description"
                    rows={5}
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      setFieldErrors((current) => ({ ...current, description: "" }));
                    }}
                    aria-invalid={fieldErrors.description ? true : undefined}
                    placeholder="What this product is, materials, sizes, and anything buyers should know."
                  />
                  <span className="hamd-entity-field__hint">
                    Required before publishing. Keep this concise and factual.
                  </span>
                  {fieldErrors.description ? (
                    <span className="hamd-entity-field__error" role="alert">
                      {fieldErrors.description}
                    </span>
                  ) : null}
                </label>
              </div>
            </section>

            <section className="hamd-entity-section">
              <h2>Media gallery</h2>
              <p>Upload catalogue images. The first image is the primary listing image unless you set another.</p>
              <MediaDropzone
                title="Upload product media"
                hint="JPEG, PNG, GIF or WebP, up to 10 MB each"
                acceptTypes={IMAGE_TYPES}
                maxBytes={MAX_IMAGE_BYTES}
                multiple
                disabled={saving}
                onAddFiles={addImageFiles}
              />
              {existingImages.length + pendingImages.length > 0 ? (
                <ul className="hamd-media-grid" role="list">
                  {existingImages.map((image, index) => (
                    <li key={image.id} className="hamd-media-tile">
                      <button
                        type="button"
                        className="hamd-media-tile__preview"
                        onClick={() =>
                          setPreview({
                            src: resolveOpsMediaUrl(image.url),
                            alt: image.altText?.trim() || name || "Product image",
                          })
                        }
                      >
                        <img
                          src={resolveOpsMediaUrl(image.url)}
                          alt={image.altText ?? ""}
                        />
                      </button>
                      {index === 0 ? <span className="hamd-media-tile__badge">Primary</span> : null}
                      <div className="hamd-media-tile__bar">
                        <button type="button" onClick={() => setPreview({
                          src: resolveOpsMediaUrl(image.url),
                          alt: image.altText?.trim() || "Product image",
                        })}>
                          Preview
                        </button>
                        {index > 0 ? (
                          <button type="button" disabled={saving} onClick={() => void markPrimary(image.id)}>
                            Set primary
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            setConfirmRemove({
                              kind: "image",
                              recordId: image.id,
                              label: image.altText?.trim() || "this image",
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                  {pendingImages.map((image) => (
                    <li key={image.id} className="hamd-media-tile">
                      <button
                        type="button"
                        className="hamd-media-tile__preview"
                        onClick={() =>
                          setPreview({
                            src: image.previewUrl,
                            alt: image.altText || "Product image",
                          })
                        }
                      >
                        <img src={image.previewUrl} alt="" />
                      </button>
                      <span className="hamd-media-tile__badge hamd-media-tile__badge--pending">
                        Ready to upload
                      </span>
                      <label className="hamd-media-tile__alt">
                        Alt text
                        <input
                          value={image.altText}
                          onChange={(event) =>
                            setPendingImages((current) =>
                              current.map((item) =>
                                item.id === image.id ? { ...item, altText: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </label>
                      <div className="hamd-media-tile__bar">
                        <button type="button" onClick={() => removePendingImage(image.id)}>
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="hamd-entity-section">
              <h2>Videos</h2>
              <p>Optional short MP4 clips for the public product page.</p>
              <MediaDropzone
                title="Upload product video"
                hint="MP4 video, up to 80 MB each"
                acceptTypes={["video/mp4"]}
                maxBytes={MAX_VIDEO_BYTES}
                multiple
                disabled={saving}
                onAddFiles={addVideoFiles}
              />
              {existingVideos.length + pendingVideos.length > 0 ? (
                <ul className="hamd-media-docs" role="list">
                  {existingVideos.map((video) => (
                    <li key={video.id}>
                      <div>
                        <strong>{video.title?.trim() || "Catalogue video"}</strong>
                        <span>{video.caption?.trim() || "No caption"}</span>
                      </div>
                      <button
                        type="button"
                        className="hamd-btn hamd-btn--ghost"
                        disabled={saving}
                        onClick={() =>
                          setConfirmRemove({
                            kind: "video",
                            recordId: video.id,
                            label: video.title?.trim() || "this video",
                          })
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                  {pendingVideos.map((video) => (
                    <li key={video.id}>
                      <div className="hamd-entity-grid">
                        <label className="hamd-entity-field">
                          Title
                          <input
                            value={video.title}
                            onChange={(event) =>
                              setPendingVideos((current) =>
                                current.map((item) =>
                                  item.id === video.id ? { ...item, title: event.target.value } : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="hamd-entity-field">
                          Caption
                          <input
                            value={video.caption}
                            onChange={(event) =>
                              setPendingVideos((current) =>
                                current.map((item) =>
                                  item.id === video.id ? { ...item, caption: event.target.value } : item,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="hamd-btn hamd-btn--ghost"
                        onClick={() =>
                          setPendingVideos((current) => current.filter((item) => item.id !== video.id))
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>

          <aside className="hamd-entity-form__aside">
            <section className="hamd-entity-section">
              <h2>Publishing</h2>
              <label className="hamd-entity-field">
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProductStatus)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <span className="hamd-entity-field__hint">{visibilityLabel(status)}</span>
              </label>
              {row ? (
                <p className="hamd-entity-field__hint">
                  Current: {statusLabel(row.status)}
                </p>
              ) : null}
            </section>
            <section className="hamd-entity-section">
              <h2>Category</h2>
              <p>{selectedCategory?.name ?? "Uncategorised"}</p>
            </section>
            <section className="hamd-entity-section">
              <h2>Primary image</h2>
              {primaryImage ? (
                <img
                  className="hamd-entity-primary-preview"
                  src={resolveOpsMediaUrl(primaryImage.url)}
                  alt={primaryImage.altText ?? ""}
                />
              ) : pendingImages[0] ? (
                <img
                  className="hamd-entity-primary-preview"
                  src={pendingImages[0].previewUrl}
                  alt=""
                />
              ) : (
                <p className="hamd-entity-field__hint">No image selected yet.</p>
              )}
            </section>
            <details className="hamd-entity-advanced">
              <summary>Advanced</summary>
              <label className="hamd-entity-field">
                URL identifier
                <input
                  value={slug}
                  onChange={(event) => {
                    slugTouched.current = true;
                    setSlug(event.target.value);
                  }}
                  autoComplete="off"
                />
                <span className="hamd-entity-field__hint">
                  Generated from the product name. Change this only if you need a specific public URL.
                </span>
              </label>
            </details>
            <div className="hamd-entity-form__aside-actions">{actions}</div>
          </aside>
        </form>
      ) : null}

      {preview ? (
        <div className="hamd-media-lightbox" role="dialog" aria-modal="true" aria-label="Image preview">
          <button
            type="button"
            className="hamd-media-lightbox__scrim"
            aria-label="Close preview"
            onClick={() => setPreview(null)}
          />
          <figure>
            <img src={preview.src} alt={preview.alt} />
            <button type="button" className="hamd-btn hamd-btn--secondary" onClick={() => setPreview(null)}>
              Close
            </button>
          </figure>
        </div>
      ) : null}

      <OpsConfirmModal
        open={Boolean(confirmRemove)}
        title={confirmRemove?.kind === "image" ? "Remove this image?" : "Remove this video?"}
        confirmLabel={confirmRemove?.kind === "image" ? "Remove image" : "Remove video"}
        tone="danger"
        busy={saving}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => void runConfirmRemove()}
      >
        <p>
          {confirmRemove
            ? `"${confirmRemove.label}" will be removed from the product media. This cannot be undone.`
            : ""}
        </p>
      </OpsConfirmModal>
    </OpsPage>
  );
}
