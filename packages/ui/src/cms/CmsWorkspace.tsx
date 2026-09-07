import { useEffect, useId, useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import { useCmsDirectory } from "./useCmsDirectory.js";
import {
  CMS_CONTENT_TYPES,
  CMS_STATUSES,
  availableCmsCommands,
  cmsCommandLabel,
  cmsContentTypeLabel,
  cmsStatusLabel,
  emptyCmsFilters,
  filterCmsMedia,
  type CmsCommand,
  type CmsContentRecord,
  type CmsCreateInput,
  type CmsMediaAsset,
  type CmsSaveDraftInput,
} from "./types.js";

export type CmsWorkspaceTab =
  | "editor"
  | "preview"
  | "versions"
  | "schedule"
  | "seo"
  | "media"
  | "create";

export type CmsWorkspaceProps = {
  items: CmsContentRecord[];
  media?: CmsMediaAsset[] | undefined;
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  canCreate?: boolean | undefined;
  canPublish?: boolean | undefined;
  onSelect?: ((item: CmsContentRecord) => void) | undefined;
  onCreate?: ((input: CmsCreateInput) => void | Promise<void>) | undefined;
  onSaveDraft?: ((
    id: string,
    input: CmsSaveDraftInput,
    meta: { rowVersion: number },
  ) => void | Promise<void>) | undefined;
  onTransition?: ((
    id: string,
    command: CmsCommand,
    meta: { rowVersion: number; reason?: string; scheduledFor?: string; versionId?: string },
  ) => void | Promise<void>) | undefined;
  onPreview?: ((id: string) => void | Promise<void>) | undefined;
  onUploadMedia?: ((file: File) => void | Promise<void>) | undefined;
  onOpenMedia?: ((asset: CmsMediaAsset) => void) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function CmsWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-cms", "hamd-cms--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-cms-skel hamd-cms-skel--list" />
      <div className="hamd-cms-skel hamd-cms-skel--detail" />
    </div>
  );
}

/**
 * Enterprise CMS workspace - structured content, lifecycle, versions,
 * scheduling, SEO, and media library. Presentational; hosts own API.
 */
export function CmsWorkspace({
  items,
  media = [],
  title = "Enterprise CMS",
  loading,
  className,
  canCreate = true,
  canPublish = true,
  onSelect,
  onCreate,
  onSaveDraft,
  onTransition,
  onPreview,
  onUploadMedia,
  onOpenMedia,
}: CmsWorkspaceProps) {
  const mediaInputId = useId();
  const [tab, setTab] = useState<CmsWorkspaceTab>("editor");
  const [reason, setReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [mediaQuery, setMediaQuery] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftForm, setDraftForm] = useState({
    title: "",
    summary: "",
    body: "",
    seoTitle: "",
    seoDescription: "",
  });
  const [createForm, setCreateForm] = useState({
    type: "news" as string,
    title: "",
    slug: "",
    locale: "en",
    summary: "",
  });

  const directory = useCmsDirectory(items);
  const selected = directory.selected;
  const mediaItems = useMemo(
    () => filterCmsMedia(media, mediaQuery),
    [media, mediaQuery],
  );

  const syncDraft = (item: CmsContentRecord) => {
    setDraftForm({
      title: item.title,
      summary: item.summary ?? "",
      body: item.body ?? "",
      seoTitle: item.seo.title ?? "",
      seoDescription: item.seo.description ?? "",
    });
  };

  useEffect(() => {
    if (!selected) return;
    setDraftForm({
      title: selected.title,
      summary: selected.summary ?? "",
      body: selected.body ?? "",
      seoTitle: selected.seo.title ?? "",
      seoDescription: selected.seo.description ?? "",
    });
  }, [selected?.id]);

  if (loading) {
    return <CmsWorkspaceSkeleton className={className} />;
  }

  const run = async (fn?: () => void | Promise<void>, ok?: string) => {
    setError(null);
    try {
      await fn?.();
      if (ok) setToast(ok);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const commands = selected
    ? availableCmsCommands(String(selected.status)).filter((c) =>
        canPublish ? true : c !== "publish" && c !== "schedule",
      )
    : [];

  const tabs: { id: CmsWorkspaceTab; label: string; hidden?: boolean }[] = [
    { id: "editor", label: "Editor" },
    { id: "preview", label: "Preview" },
    { id: "versions", label: "Version history" },
    { id: "schedule", label: "Scheduling" },
    { id: "seo", label: "SEO metadata" },
    { id: "media", label: "Media library" },
    { id: "create", label: "Create", hidden: !canCreate },
  ];

  return (
    <div
      className={cx(
        "hamd-cms",
        mobileOpen && "hamd-cms--detail-open",
        className,
      )}
    >
      <a className="hamd-cms__skip" href="#hamd-cms-detail">
        Skip to CMS detail
      </a>

      <header className="hamd-cms__header">
        <div>
          <h1 className="hamd-cms__title">{title}</h1>
          <p className="hamd-cms__subtitle">
            Draft, preview, publish, archive, versions, rollback, scheduling,
            and media - structured website content without code changes.
          </p>
        </div>
      </header>

      <div className="hamd-cms__layout">
        <aside className="hamd-cms__directory" aria-label="CMS content directory">
          <div className="hamd-cms-filters">
            <label className="hamd-sr-only" htmlFor="hamd-cms-q">
              Search CMS content
            </label>
            <input
              id="hamd-cms-q"
              type="search"
              placeholder="Search title, slug, type…"
              value={directory.filters.query}
              onChange={(e) =>
                directory.setFilters((prev) => ({
                  ...prev,
                  query: e.target.value,
                  page: 1,
                }))
              }
            />
            <label>
              Type
              <select
                value={directory.filters.type}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    type: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="all">All types</option>
                {CMS_CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {cmsContentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={directory.filters.status}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="all">All statuses</option>
                {CMS_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {cmsStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="hamd-cms-btn"
              onClick={() => directory.setFilters(emptyCmsFilters())}
            >
              Clear filters
            </button>
          </div>

          <ul className="hamd-cms-list" role="list" aria-label="CMS content">
            {directory.page.items.map((row) => {
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={cx("hamd-cms-row", active && "is-active")}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      directory.select(row.id);
                      syncDraft(row);
                      setMobileOpen(true);
                      setTab("editor");
                      onSelect?.(row);
                    }}
                  >
                    <span className="hamd-cms-row__code">
                      {cmsContentTypeLabel(String(row.type))}
                    </span>
                    <span className="hamd-cms-row__title">{row.title}</span>
                    <span className="hamd-cms-row__meta">
                      {cmsStatusLabel(String(row.status))} · v{row.versionNumber}{" "}
                      · {row.locale}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hamd-cms-pager" aria-label="Pagination">
            <button
              type="button"
              disabled={directory.page.page <= 1}
              onClick={() =>
                directory.setFilters((prev) => ({
                  ...prev,
                  page: prev.page - 1,
                }))
              }
            >
              Previous
            </button>
            <span>
              {directory.page.page}/{directory.page.pageCount}
            </span>
            <button
              type="button"
              disabled={directory.page.page >= directory.page.pageCount}
              onClick={() =>
                directory.setFilters((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
              }
            >
              Next
            </button>
          </div>
        </aside>

        <section
          id="hamd-cms-detail"
          className="hamd-cms__detail"
          aria-label="CMS content detail"
        >
          {selected || tab === "create" || tab === "media" ? (
            <>
              {selected && tab !== "create" && tab !== "media" ? (
                <header className="hamd-cms-detail__head">
                  <button
                    type="button"
                    className="hamd-cms-back"
                    onClick={() => setMobileOpen(false)}
                  >
                    Directory
                  </button>
                  <div>
                    <p className="hamd-cms-detail__code">
                      {selected.slug} · v{selected.versionNumber}
                    </p>
                    <h2 className="hamd-cms-detail__title">{selected.title}</h2>
                    <p className="hamd-cms-detail__sub">
                      <span
                        className="hamd-cms-pill"
                        data-status={selected.status}
                      >
                        {cmsStatusLabel(String(selected.status))}
                      </span>
                      <span className="hamd-cms-pill">
                        {cmsContentTypeLabel(String(selected.type))}
                      </span>
                      <span className="hamd-cms-pill">{selected.locale}</span>
                    </p>
                  </div>
                </header>
              ) : null}

              {selected &&
              tab !== "create" &&
              tab !== "media" &&
              commands.length ? (
                <div
                  className="hamd-cms-actions"
                  role="group"
                  aria-label="CMS workflow actions"
                >
                  {commands.map((command) => (
                    <button
                      key={command}
                      type="button"
                      className={cx(
                        "hamd-cms-btn",
                        (command === "publish" || command === "approve") &&
                          "hamd-cms-btn--primary",
                        (command === "archive" || command === "reject") &&
                          "hamd-cms-btn--danger",
                      )}
                      onClick={() =>
                        void run(async () => {
                          if (command === "preview") {
                            await onPreview?.(selected.id);
                            setTab("preview");
                            return;
                          }
                          if (command === "save_draft") {
                            await onSaveDraft?.(
                              selected.id,
                              {
                                title: draftForm.title.trim(),
                                summary: draftForm.summary.trim() || undefined,
                                body: draftForm.body.trim() || undefined,
                                seo: {
                                  title: draftForm.seoTitle.trim() || undefined,
                                  description:
                                    draftForm.seoDescription.trim() ||
                                    undefined,
                                },
                              },
                              { rowVersion: selected.rowVersion },
                            );
                            return;
                          }
                          await onTransition?.(selected.id, command, {
                            rowVersion: selected.rowVersion,
                            ...(reason.trim()
                              ? { reason: reason.trim() }
                              : {}),
                            ...(command === "schedule" && scheduleAt.trim()
                              ? { scheduledFor: scheduleAt.trim() }
                              : {}),
                          });
                        }, `${cmsCommandLabel(command)} applied`)
                      }
                    >
                      {cmsCommandLabel(command)}
                    </button>
                  ))}
                  <label className="hamd-cms-reason">
                    Reason
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Optional for reject / archive"
                    />
                  </label>
                </div>
              ) : null}

              <nav className="hamd-cms-tabs" aria-label="CMS sections">
                {tabs
                  .filter((t) => !t.hidden)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={cx(
                        "hamd-cms-tab",
                        tab === t.id && "is-active",
                      )}
                      aria-current={tab === t.id ? "page" : undefined}
                      onClick={() => {
                        setTab(t.id);
                        if (t.id !== "create" && t.id !== "media") {
                          setMobileOpen(true);
                        }
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
              </nav>

              <div className="hamd-cms-panel">
                {tab === "editor" && selected ? (
                  <form
                    className="hamd-cms-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(
                        () =>
                          onSaveDraft?.(
                            selected.id,
                            {
                              title: draftForm.title.trim(),
                              summary: draftForm.summary.trim() || undefined,
                              body: draftForm.body.trim() || undefined,
                              seo: {
                                title: draftForm.seoTitle.trim() || undefined,
                                description:
                                  draftForm.seoDescription.trim() || undefined,
                              },
                            },
                            { rowVersion: selected.rowVersion },
                          ),
                        "Draft saved",
                      );
                    }}
                  >
                    <label>
                      Title
                      <input
                        required
                        value={draftForm.title}
                        onChange={(e) =>
                          setDraftForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Summary
                      <input
                        value={draftForm.summary}
                        onChange={(e) =>
                          setDraftForm((prev) => ({
                            ...prev,
                            summary: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Body
                      <textarea
                        rows={6}
                        value={draftForm.body}
                        onChange={(e) =>
                          setDraftForm((prev) => ({
                            ...prev,
                            body: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      type="submit"
                      className="hamd-cms-btn hamd-cms-btn--primary"
                    >
                      Apply editor changes
                    </button>
                  </form>
                ) : null}

                {tab === "preview" && selected ? (
                  <div className="hamd-cms-preview" aria-label="Content preview">
                    <p className="hamd-cms-preview__badge">
                      Preview - not indexable
                    </p>
                    <h3>{draftForm.title || selected.title}</h3>
                    <p className="hamd-cms-muted">
                      {draftForm.summary || selected.summary || "No summary"}
                    </p>
                    <div className="hamd-cms-preview__body">
                      {draftForm.body || selected.body || "No body content."}
                    </div>
                    <button
                      type="button"
                      className="hamd-cms-btn"
                      onClick={() =>
                        void run(
                          () => onPreview?.(selected.id),
                          "Preview opened",
                        )
                      }
                    >
                      Open host preview
                    </button>
                  </div>
                ) : null}

                {tab === "versions" && selected ? (
                  <ol className="hamd-cms-versions" aria-label="Version history">
                    {selected.versions.map((version) => (
                      <li
                        key={version.id}
                        className={cx(version.current && "is-current")}
                      >
                        <strong>
                          v{version.versionNumber}
                          {version.current ? " · Current" : ""}
                        </strong>
                        <span>
                          {cmsStatusLabel(String(version.status))}
                          {version.authorName
                            ? ` · ${version.authorName}`
                            : ""}
                        </span>
                        {version.summary ? <em>{version.summary}</em> : null}
                        <time dateTime={version.createdAt}>
                          {formatWhen(version.createdAt)}
                        </time>
                        {!version.current ? (
                          <button
                            type="button"
                            className="hamd-cms-btn"
                            onClick={() =>
                              void run(
                                () =>
                                  onTransition?.(selected.id, "rollback", {
                                    rowVersion: selected.rowVersion,
                                    versionId: version.id,
                                  }),
                                `Rolled back to v${version.versionNumber}`,
                              )
                            }
                          >
                            Rollback to this version
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : null}

                {tab === "schedule" && selected ? (
                  <form
                    className="hamd-cms-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(
                        () =>
                          onTransition?.(selected.id, "schedule", {
                            rowVersion: selected.rowVersion,
                            scheduledFor: scheduleAt.trim(),
                          }),
                        "Scheduled",
                      );
                    }}
                  >
                    <p className="hamd-cms-muted">
                      Current schedule:{" "}
                      {selected.scheduledFor
                        ? formatWhen(selected.scheduledFor)
                        : "Not scheduled"}
                    </p>
                    <label>
                      Schedule for (ISO UTC)
                      <input
                        required
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        placeholder="2026-08-10T02:00:00.000Z"
                      />
                    </label>
                    <button
                      type="submit"
                      className="hamd-cms-btn hamd-cms-btn--primary"
                    >
                      Schedule publish
                    </button>
                  </form>
                ) : null}

                {tab === "seo" && selected ? (
                  <form
                    className="hamd-cms-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(
                        () =>
                          onSaveDraft?.(
                            selected.id,
                            {
                              title: draftForm.title.trim() || selected.title,
                              seo: {
                                title: draftForm.seoTitle.trim() || undefined,
                                description:
                                  draftForm.seoDescription.trim() || undefined,
                              },
                            },
                            { rowVersion: selected.rowVersion },
                          ),
                        "SEO saved",
                      );
                    }}
                  >
                    <label>
                      SEO title
                      <input
                        value={draftForm.seoTitle}
                        onChange={(e) =>
                          setDraftForm((prev) => ({
                            ...prev,
                            seoTitle: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      SEO description
                      <textarea
                        rows={3}
                        value={draftForm.seoDescription}
                        onChange={(e) =>
                          setDraftForm((prev) => ({
                            ...prev,
                            seoDescription: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <dl className="hamd-cms-facts">
                      <div>
                        <dt>Canonical</dt>
                        <dd>{selected.seo.canonicalUrl || "-"}</dd>
                      </div>
                      <div>
                        <dt>Robots</dt>
                        <dd>{selected.seo.robots || "-"}</dd>
                      </div>
                      <div>
                        <dt>Schema</dt>
                        <dd>{selected.seo.structuredDataType || "-"}</dd>
                      </div>
                    </dl>
                    <button
                      type="submit"
                      className="hamd-cms-btn hamd-cms-btn--primary"
                    >
                      Save SEO metadata
                    </button>
                  </form>
                ) : null}

                {tab === "media" ? (
                  <div className="hamd-cms-media" role="region" aria-label="Media library">
                    <div className="hamd-cms-media__toolbar">
                      <input
                        type="search"
                        placeholder="Filter media…"
                        value={mediaQuery}
                        onChange={(e) => setMediaQuery(e.target.value)}
                        aria-label="Filter media library"
                      />
                      <label className="hamd-cms-btn" htmlFor={mediaInputId}>
                        Upload media
                        <input
                          id={mediaInputId}
                          type="file"
                          className="hamd-sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void run(
                              () => onUploadMedia?.(file),
                              "Media uploaded",
                            );
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <ul className="hamd-cms-media__list">
                      {mediaItems.length === 0 ? (
                        <li className="hamd-cms-empty">No media assets.</li>
                      ) : (
                        mediaItems.map((asset) => (
                          <li key={asset.id}>
                            <button
                              type="button"
                              className="hamd-cms-media__item"
                              onClick={() => onOpenMedia?.(asset)}
                            >
                              <strong>{asset.name}</strong>
                              <span>
                                {asset.mimeType} · {asset.scanStatus || "-"}
                                {asset.altText ? ` · ${asset.altText}` : ""}
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ) : null}

                {tab === "create" && canCreate ? (
                  <form
                    className="hamd-cms-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(async () => {
                        await onCreate?.({
                          type: createForm.type,
                          title: createForm.title.trim(),
                          slug: createForm.slug.trim(),
                          locale: createForm.locale.trim() || "en",
                          ...(createForm.summary.trim()
                            ? { summary: createForm.summary.trim() }
                            : {}),
                        });
                      }, "Content created");
                    }}
                  >
                    <h2>Create content</h2>
                    <label>
                      Type
                      <select
                        value={createForm.type}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            type: e.target.value,
                          }))
                        }
                      >
                        {CMS_CONTENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {cmsContentTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Title
                      <input
                        required
                        value={createForm.title}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Slug
                      <input
                        required
                        value={createForm.slug}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Locale
                      <input
                        value={createForm.locale}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            locale: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Summary
                      <input
                        value={createForm.summary}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            summary: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      type="submit"
                      className="hamd-cms-btn hamd-cms-btn--primary"
                    >
                      Create draft
                    </button>
                  </form>
                ) : null}
              </div>
            </>
          ) : (
            <p className="hamd-cms-empty" role="status">
              Select content or create a draft.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-cms-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
