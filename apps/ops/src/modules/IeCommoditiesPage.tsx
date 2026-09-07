import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  archiveIeCommodity,
  createIeCommodity,
  getIeCommodity,
  listIeCommodities,
  updateIeCommodity,
  uploadIeCommodityHero,
  type IeCommodityListItem,
  type IeCommodityRow,
} from "../api/ie-commodity-api.js";
import { OpsApiError, requireToken } from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import {
  ModuleCardGrid,
  ModuleEmptyState,
  ModuleSkeleton,
  ModuleWorkspace,
} from "@hamd/ui/module-layout";

const emptyForm = {
  name: "",
  slug: "",
  category: "",
  shortDescription: "",
  description: "",
  packaging: "",
  qualityInformation: "",
  applications: "",
  markets: "",
  sortOrder: "0",
  published: false,
  heroSrc: "",
  heroAlt: "",
  galleryText: "",
  specificationsText: "",
};

function visibilityLabel(row: IeCommodityListItem & { published?: boolean; archivedAt?: string | null }): string {
  if (row.archivedAt) return "Archived";
  if (row.published) return "Published";
  return "Draft";
}

function visibilityBadgeClass(row: IeCommodityListItem & { published?: boolean; archivedAt?: string | null }): string {
  if (row.archivedAt) return "hamd-badge hamd-badge--info";
  if (row.published) return "hamd-badge hamd-badge--success";
  return "hamd-badge hamd-badge--warning";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parsePipeRows(text: string): Array<{ left: string; right: string }> {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf("|");
      if (idx === -1) return { left: line, right: "" };
      return {
        left: line.slice(0, idx).trim(),
        right: line.slice(idx + 1).trim(),
      };
    });
}

function formFromRow(row: IeCommodityRow) {
  return {
    name: row.name,
    slug: row.slug,
    category: row.category ?? "",
    shortDescription: row.shortDescription ?? "",
    description: row.description ?? "",
    packaging: row.packaging ?? "",
    qualityInformation: row.qualityInformation ?? "",
    applications: row.applications.join("\n"),
    markets: row.markets ?? "",
    sortOrder: String(row.sortOrder),
    published: row.published,
    heroSrc: row.heroMedia?.src ?? "",
    heroAlt: row.heroMedia?.alt ?? "",
    galleryText: row.gallery
      .map((item) => `${item.src} | ${item.alt}`)
      .join("\n"),
    specificationsText: row.specifications
      .map((item) => `${item.label} | ${item.value}`)
      .join("\n"),
  };
}

function CommodityCard({
  row,
  onOpen,
}: {
  row: IeCommodityListItem;
  onOpen: () => void;
}) {
  return (
    <div className="hamd-module-card">
      <button
        type="button"
        className="hamd-module-card__media"
        onClick={onOpen}
        aria-label={`Open ${row.name}`}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        {row.heroMedia?.src ? (
          <img
            className="hamd-module-card__image"
            src={row.heroMedia.src}
            alt={row.heroMedia.alt ?? row.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="hamd-module-card__media-fallback" aria-hidden="true">
            {row.name.trim().slice(0, 1).toUpperCase() || "C"}
          </span>
        )}
      </button>
      <div className="hamd-module-card__body">
        <span className="hamd-module-card__eyebrow">
          {row.category || "Unclassified"}
        </span>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${row.name}`}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "inherit",
            font: "inherit",
            textAlign: "left",
            width: "100%",
          }}
        >
          <span className="hamd-module-card__title" style={{ display: "block" }}>
            {row.name}
          </span>
        </button>
        <span className="hamd-module-card__meta">{row.slug}</span>
        <div className="hamd-module-card__footer">
          <span className={visibilityBadgeClass(row)}>
            {visibilityLabel(row)}
          </span>
          <span className="hamd-module-card__meta">
            Sort {row.sortOrder}
          </span>
        </div>
      </div>
    </div>
  );
}

export function IeCommoditiesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === "new";
  const [rows, setRows] = useState<IeCommodityListItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(
    isNew ? null : id ?? null,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [heroFile, setHeroFile] = useState<File | null>(null);

  const refresh = useCallback(async () => {
    const token = await requireToken(auth.ensureSession);
    const { data } = await listIeCommodities(token, { includeUnpublished: true });
    setRows(data);
  }, [auth.ensureSession]);

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        await refresh();
      } catch (err) {
        setError(
          err instanceof OpsApiError && err.status === 403
            ? "You do not have permission to manage Integrated Export commodities."
            : err instanceof Error
              ? err.message
              : "Unable to load commodities.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const loadEditor = useCallback(
    async (slug: string) => {
      setError(null);
      setSuccess(null);
      try {
        const token = await requireToken(auth.ensureSession);
        const row = await getIeCommodity(token, slug);
        setSelectedId(row.id);
        setForm(formFromRow(row));
        setSlugManual(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load commodity.");
      }
    },
    [auth.ensureSession],
  );

  useEffect(() => {
    if (isNew) {
      setSelectedId(null);
      setForm(emptyForm);
      setSlugManual(false);
      return;
    }
    if (id) void loadEditor(id);
  }, [id, isNew, loadEditor]);

  const categories = useMemo(() => {
    const values = new Set<string>();
    for (const row of rows) {
      if (row.category) values.add(row.category);
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter === "published" && !row.published) return false;
      if (statusFilter === "draft" && row.published) return false;
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (
        q &&
        !row.name.toLowerCase().includes(q) &&
        !row.slug.toLowerCase().includes(q) &&
        !(row.category ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, categoryFilter]);

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyForm);
    setHeroFile(null);
    setSlugManual(false);
    setSuccess(null);
    navigate("/integrated-export/commodities/new");
  };

  const buildBody = () => {
    const gallery = parsePipeRows(form.galleryText)
      .filter((row) => row.left && row.right)
      .map((row, index) => ({
        src: row.left,
        alt: row.right,
        sortOrder: index,
      }));
    const specifications = parsePipeRows(form.specificationsText)
      .filter((row) => row.left && row.right)
      .map((row) => ({ label: row.left, value: row.right }));
    const applications = form.applications
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const heroSrc = form.heroSrc.trim();
    const heroAlt = form.heroAlt.trim();
    return {
      name: form.name.trim(),
      slug: (form.slug.trim() || slugify(form.name)).toLowerCase(),
      published: form.published,
      category: form.category.trim() || null,
      shortDescription: form.shortDescription.trim() || null,
      description: form.description.trim() || null,
      packaging: form.packaging.trim() || null,
      qualityInformation: form.qualityInformation.trim() || null,
      markets: form.markets.trim() || null,
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      heroMedia:
        heroSrc && heroAlt ? { src: heroSrc, alt: heroAlt } : null,
      gallery: gallery.length ? gallery : null,
      specifications: specifications.length ? specifications : null,
      applications: applications.length ? applications : null,
    };
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    if (form.published) {
      setSuccess("Publishing commodity to the public Integrated Export catalogue.");
    }
    setSaving(true);
    try {
      const token = await requireToken(auth.ensureSession);
      const body = buildBody();
      const saved = selectedId
        ? await updateIeCommodity(token, selectedId, body)
        : await createIeCommodity(token, body);
      const withMedia = heroFile
        ? await uploadIeCommodityHero(token, saved.id, heroFile)
        : saved;
      setHeroFile(null);
      setSelectedId(withMedia.id);
      setForm(formFromRow(withMedia));
      await refresh();
      setSuccess(
        withMedia.published
          ? "Commodity published to the public Integrated Export catalogue."
          : "Draft saved. It is not visible on the public catalogue.",
      );
      navigate(`/integrated-export/commodities/${withMedia.slug}`);
    } catch (err) {
      setError(
        err instanceof OpsApiError && err.status === 409
          ? "That slug is already in use."
          : err instanceof Error
            ? err.message
            : "Unable to save commodity.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      await archiveIeCommodity(token, selectedId);
      setSuccess("Commodity archived.");
      resetForm();
      await refresh();
      navigate("/integrated-export/commodities");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to archive.");
    } finally {
      setSaving(false);
    }
  };

  const isEditor = Boolean(id);

  const listView = !isEditor ? (
    <>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      {loading ? (
        <ModuleSkeleton variant="card" />
      ) : visible.length === 0 ? (
        <ModuleEmptyState
          title="No commodities yet"
          description="Create a commodity record to add it to the Integrated Export catalogue."
          action={
            <button
              type="button"
              className="hamd-btn hamd-btn--primary"
              onClick={resetForm}
            >
              Create Commodity
            </button>
          }
        />
      ) : (
        <ModuleCardGrid
          items={visible}
          getRowId={(row) => row.id}
          renderCard={(row) => (
            <CommodityCard
              row={row}
              onOpen={() => navigate(`/integrated-export/commodities/${row.slug}`)}
            />
          )}
        />
      )}
    </>
  ) : null;

  const specEditors =
    parsePipeRows(form.specificationsText).length > 0
      ? parsePipeRows(form.specificationsText)
      : [{ left: "", right: "" }];

  const editorView = isEditor ? (
    <form className="hamd-entity-form" onSubmit={(event) => void onSave(event)}>
      <div className="hamd-entity-form__main">
        <section className="hamd-entity-section">
          <h2>Basic information</h2>
          <p>Name and descriptions shown on the Integrated Export catalogue.</p>
          <div className="hamd-entity-grid">
            <label className="hamd-entity-field" htmlFor="ie-commodity-name">
              Name
              <input
                id="ie-commodity-name"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: slugManual ? current.slug : slugify(event.target.value),
                  }))
                }
              />
            </label>
            <label className="hamd-entity-field">
              Trade category
              <input
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
              />
              <span className="hamd-entity-field__hint">
                Optional free text. This is not an International product category.
              </span>
            </label>
            <label className="hamd-entity-field hamd-entity-field--wide">
              Short description
              <input
                value={form.shortDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
              />
            </label>
            <label className="hamd-entity-field hamd-entity-field--wide">
              Description
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>
        <section className="hamd-entity-section">
          <h2>Trade and procurement information</h2>
          <div className="hamd-entity-grid">
            <label className="hamd-entity-field">
              Packaging
              <textarea
                rows={3}
                value={form.packaging}
                onChange={(event) =>
                  setForm((current) => ({ ...current, packaging: event.target.value }))
                }
              />
            </label>
            <label className="hamd-entity-field">
              Quality information
              <textarea
                rows={3}
                value={form.qualityInformation}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    qualityInformation: event.target.value,
                  }))
                }
              />
            </label>
            <label className="hamd-entity-field">
              Applications (one per line)
              <textarea
                rows={3}
                value={form.applications}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    applications: event.target.value,
                  }))
                }
              />
            </label>
            <label className="hamd-entity-field">
              Markets
              <textarea
                rows={3}
                value={form.markets}
                onChange={(event) =>
                  setForm((current) => ({ ...current, markets: event.target.value }))
                }
              />
            </label>
          </div>
        </section>
        <section className="hamd-entity-section">
          <h2>Specifications</h2>
          <p>Structured name and value pairs stored on the commodity record.</p>
          <ul className="hamd-spec-rows">
            {specEditors.map((row, index) => (
              <li key={`spec-${index}`} className="hamd-entity-grid">
                <label className="hamd-entity-field">
                  Specification name
                  <input
                    value={row.left}
                    onChange={(event) => {
                      const next = specEditors.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, left: event.target.value } : item,
                      );
                      setForm((current) => ({
                        ...current,
                        specificationsText: next
                          .map((item) => `${item.left} | ${item.right}`)
                          .join("\n"),
                      }));
                    }}
                  />
                </label>
                <label className="hamd-entity-field">
                  Value
                  <input
                    value={row.right}
                    onChange={(event) => {
                      const next = specEditors.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, right: event.target.value } : item,
                      );
                      setForm((current) => ({
                        ...current,
                        specificationsText: next
                          .map((item) => `${item.left} | ${item.right}`)
                          .join("\n"),
                      }));
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            onClick={() =>
              setForm((current) => ({
                ...current,
                specificationsText: `${current.specificationsText.trim()}\n | `.trimStart(),
              }))
            }
          >
            Add specification
          </button>
        </section>
        <section className="hamd-entity-section">
          <h2>Media gallery</h2>
          <p>
            Upload a hero image with drag and drop or browse. Licensed catalogue
            paths remain available for gallery stages only.
          </p>
          <label className="hamd-entity-dropzone" htmlFor="ie-commodity-hero">
            <span>Drag and drop or browse a JPEG, PNG, WebP or GIF file.</span>
            <input
              id="ie-commodity-hero"
              className="hamd-sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => setHeroFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {heroFile || form.heroSrc ? (
            <img
              className="hamd-ops-category-preview"
              src={heroFile ? URL.createObjectURL(heroFile) : form.heroSrc}
              alt={form.heroAlt || form.name || "Commodity hero preview"}
            />
          ) : (
            <p>No hero image yet.</p>
          )}
          {heroFile || form.heroSrc ? (
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              onClick={() => {
                setHeroFile(null);
                setForm((current) => ({ ...current, heroSrc: "", heroAlt: "" }));
              }}
            >
              Remove image
            </button>
          ) : null}
          <label className="hamd-entity-field">
            Gallery stages (one per line: licensed path | alt text)
            <textarea
              rows={4}
              value={form.galleryText}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  galleryText: event.target.value,
                }))
              }
            />
          </label>
        </section>
      </div>
      <aside className="hamd-entity-form__aside">
        <section className="hamd-entity-section">
          <h2>Publishing</h2>
          <p>
            {form.published
              ? "Visible on the public Integrated Export catalogue."
              : "Draft: not visible on the public catalogue."}
          </p>
          <label className="hamd-entity-field">
            <span className="hamd-ops-cms__check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    published: event.target.checked,
                  }))
                }
              />{" "}
              Published
            </span>
          </label>
          <label className="hamd-entity-field">
            Sort order
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({ ...current, sortOrder: event.target.value }))
              }
            />
          </label>
        </section>
        <details className="hamd-entity-advanced">
          <summary>Advanced</summary>
          <label className="hamd-entity-field">
            URL identifier
            <input
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Lowercase kebab-case"
              value={form.slug}
              onChange={(event) => {
                setSlugManual(true);
                setForm((current) => ({ ...current, slug: event.target.value }));
              }}
            />
            <span className="hamd-entity-field__hint">
              Generated from the commodity name.
            </span>
          </label>
        </details>
        <div className="hamd-entity-form__actions">
          <Link className="hamd-btn hamd-btn--ghost" to="/integrated-export/commodities">
            Cancel
          </Link>
          <button type="submit" className="hamd-btn hamd-btn--primary" disabled={saving}>
            {saving ? "Saving..." : selectedId ? "Save commodity" : "Create draft"}
          </button>
          {selectedId ? (
            <button
              type="button"
              className="hamd-btn hamd-btn--secondary"
              disabled={saving}
              onClick={() => void onArchive()}
            >
              Archive
            </button>
          ) : null}
        </div>
      </aside>
    </form>
  ) : null;

  if (isEditor) {
    return (
      <OpsPage className="hamd-ops-ie-commodities hamd-entity-page">
        {error ? <OpsAlert>{error}</OpsAlert> : null}
        {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
        {loading ? <OpsLoading label="Loading commodity..." /> : null}
        <nav className="hamd-entity-form__crumb" aria-label="Breadcrumb">
          <Link to="/integrated-export/commodities">Commodities</Link>
          <span aria-hidden="true">/</span>
          <span>{selectedId ? "Edit commodity" : "Create commodity"}</span>
        </nav>
        <header className="hamd-entity-form__header">
          <div>
            <h1>{selectedId ? "Edit commodity" : "Create commodity"}</h1>
            <p>New records default to draft. Publishing requires confirmation.</p>
          </div>
        </header>
        {editorView}
      </OpsPage>
    );
  }

  return (
    <OpsPage className="hamd-ops-ie-commodities hamd-list-queue">
      <ModuleWorkspace
        header={{
          title: "Commodities",
          description:
            "Author Integrated Export catalogue records. Share the grade, specification, quantity, packaging, and destination in a procurement request so the export team can prepare a sourcing response.",
          actions: (
            <button
              type="button"
              className="hamd-btn hamd-btn--primary"
              onClick={resetForm}
            >
              Create Commodity
            </button>
          ),
        }}
        toolbar={{
          search: {
            value: search,
            onChange: setSearch,
            placeholder: "Search name, slug, category",
          },
          filters: [
            {
              label: "Status",
              value: statusFilter,
              onChange: (value) => setStatusFilter(value as typeof statusFilter),
              options: [
                { value: "all", label: "All active" },
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ],
            },
            {
              label: "Category",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: "all", label: "All categories" },
                ...categories.map((category) => ({
                  value: category,
                  label: category,
                })),
              ],
            },
          ],
          onReset: () => {
            setSearch("");
            setStatusFilter("all");
            setCategoryFilter("all");
          },
        }}
        loading={loading}
        loadingLabel="Loading commodities..."
        error={error}
      >
        {listView}
      </ModuleWorkspace>
    </OpsPage>
  );
}
