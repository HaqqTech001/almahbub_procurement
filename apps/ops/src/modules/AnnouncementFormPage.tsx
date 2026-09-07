import { useCallback, useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MediaLightbox, type MediaLightboxItem } from "@hamd/ui/primitives";

import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsAlert, OpsLoading, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { opsFetch } from "../lib/ops-fetch.js";
import {
  announcementMediaKind,
  ANNOUNCEMENT_MEDIA_ACCEPT,
  ANNOUNCEMENT_MEDIA_MAX,
  emptyAnnouncementForm,
  isAnnouncementMediaFile,
  slugifyAnnouncement,
  toDatetimeLocal,
  toIsoOrNull,
  type AnnouncementRow,
  type AnnouncementStatus,
} from "./announcement-model.js";

export function AnnouncementFormPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id && id !== "new" ? id : null;
  const [form, setForm] = useState(emptyAnnouncementForm);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: MediaLightboxItem[]; index: number } | null>(
    null,
  );
  const [existing, setExisting] = useState<AnnouncementRow | null>(null);
  const [slugManual, setSlugManual] = useState(Boolean(editingId));
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const tokenOrThrow = async () => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in required.");
    return token;
  };

  const load = useCallback(async () => {
    if (!editingId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await tokenOrThrow();
      const rows = await opsFetch<AnnouncementRow[]>("/announcements/admin", {
        accessToken: token,
      });
      const row = rows.find((item) => item.id === editingId);
      if (!row) {
        setError("Announcement not found.");
        return;
      }
      setExisting(row);
      setForm({
        title: row.title,
        slug: row.slug,
        summary: row.summary ?? "",
        body: row.body,
        status:
          row.status === "draft" || row.status === "published" || row.status === "archived"
            ? row.status
            : "draft",
        pinned: Boolean(row.pinned),
        scheduledFor: toDatetimeLocal(row.scheduledFor),
        expiresAt: toDatetimeLocal(row.expiresAt),
      });
      setSlugManual(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load announcement.");
    } finally {
      setLoading(false);
    }
  }, [auth, editingId]);

  const existingCount = existing?.media?.length ?? 0;
  const remainingSlots = Math.max(0, ANNOUNCEMENT_MEDIA_MAX - existingCount - pendingFiles.length);
  const pendingPreviews = useMemo(
    () =>
      pendingFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        kind: announcementMediaKind(file.type),
      })),
    [pendingFiles],
  );

  useEffect(() => {
    return () => {
      for (const item of pendingPreviews) URL.revokeObjectURL(item.url);
    };
  }, [pendingPreviews]);

  const addFiles = (files: File[]) => {
    setMediaError(null);
    const next: File[] = [];
    for (const file of files) {
      if (!isAnnouncementMediaFile(file)) {
        setMediaError("Announcements accept images and videos only. Documents are not allowed.");
        continue;
      }
      if (existingCount + pendingFiles.length + next.length >= ANNOUNCEMENT_MEDIA_MAX) {
        setMediaError(`Maximum ${ANNOUNCEMENT_MEDIA_MAX} media items.`);
        break;
      }
      next.push(file);
    }
    if (next.length) setPendingFiles((current) => [...current, ...next]);
  };

  useEffect(() => {
    void load();
  }, [load]);

  const attachFiles = async (announcementId: string, files: File[], token: string) => {
    if (files.length === 0) return;
    const data = new FormData();
    for (const file of files) data.append("media", file);
    await opsFetch(`/announcements/${announcementId}/media`, {
      method: "POST",
      accessToken: token,
      form: data,
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Enter a title.";
    if (!form.body.trim()) nextErrors.body = "Enter announcement content.";
    if (existingCount + pendingFiles.length > ANNOUNCEMENT_MEDIA_MAX) {
      setMediaError(`Maximum ${ANNOUNCEMENT_MEDIA_MAX} media items.`);
      return;
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      const token = await tokenOrThrow();
      const payload = {
        title: form.title.trim(),
        slug: (form.slug.trim() || slugifyAnnouncement(form.title)).toLowerCase(),
        summary: form.summary.trim() || undefined,
        body: form.body.trim(),
        status: form.status,
        pinned: form.pinned,
        scheduledFor: toIsoOrNull(form.scheduledFor),
        expiresAt: toIsoOrNull(form.expiresAt),
      };
      if (editingId) {
        await opsFetch(`/announcements/${editingId}`, {
          method: "PATCH",
          accessToken: token,
          body: payload,
        });
        await attachFiles(editingId, pendingFiles, token);
        setSuccess("Announcement updated successfully.");
        navigate(`/cms/${editingId}`);
      } else {
        const created = await opsFetch<AnnouncementRow>("/announcements", {
          method: "POST",
          accessToken: token,
          body: payload,
        });
        await attachFiles(created.id, pendingFiles, token);
        setSuccess(
          form.status === "published"
            ? "Announcement published."
            : "Announcement created successfully.",
        );
        navigate(`/cms/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't complete the request. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteMedia = async (mediaId: string) => {
    if (!editingId) return;
    try {
      const token = await tokenOrThrow();
      await opsFetch(`/announcements/${editingId}/media/${mediaId}`, {
        method: "DELETE",
        accessToken: token,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove media.");
    }
  };

  return (
    <OpsPage className="hamd-entity-page">
      <p>
        <Link to="/cms">Announcements</Link>
      </p>
      {error ? <OpsAlert tone="danger">{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      {loading ? <OpsLoading label="Loading announcement…" /> : null}
      {!loading ? (
        <form className="hamd-entity-form hamd-entity-form--padded" onSubmit={(event) => void onSubmit(event)}>
          <div className="hamd-entity-form__main">
            <header className="hamd-entity-form__header">
              <div>
                <h1>{editingId ? "Edit announcement" : "Create announcement"}</h1>
                <p>Title, summary, content, media, and publication timing.</p>
              </div>
            </header>
            <section className="hamd-entity-section">
              <h2>Content</h2>
              <div className="hamd-entity-grid">
                <label className="hamd-entity-field hamd-entity-field--wide">
                  Title
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                        slug: slugManual ? current.slug : slugifyAnnouncement(event.target.value),
                      }))
                    }
                    required
                  />
                  {fieldErrors.title ? (
                    <span className="hamd-entity-field__error">{fieldErrors.title}</span>
                  ) : null}
                </label>
                <label className="hamd-entity-field hamd-entity-field--wide">
                  Summary
                  <input
                    value={form.summary}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, summary: event.target.value }))
                    }
                  />
                </label>
                <label className="hamd-entity-field hamd-entity-field--wide">
                  Body
                  <textarea
                    rows={8}
                    value={form.body}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, body: event.target.value }))
                    }
                    required
                  />
                  {fieldErrors.body ? (
                    <span className="hamd-entity-field__error">{fieldErrors.body}</span>
                  ) : null}
                </label>
              </div>
            </section>
            <section className="hamd-entity-section">
              <h2>Media</h2>
              <p>
                Images and videos only. {existingCount + pendingFiles.length} of{" "}
                {ANNOUNCEMENT_MEDIA_MAX} media added.
              </p>
              {remainingSlots > 0 ? (
                <label
                  className={
                    dragOver ? "hamd-entity-dropzone is-drag" : "hamd-entity-dropzone"
                  }
                  onDragOver={(event: DragEvent) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event: DragEvent) => {
                    event.preventDefault();
                    setDragOver(false);
                    addFiles(Array.from(event.dataTransfer.files ?? []));
                  }}
                >
                  Drag and drop, or browse.
                  <input
                    className="hamd-sr-only"
                    type="file"
                    multiple
                    accept={ANNOUNCEMENT_MEDIA_ACCEPT}
                    onChange={(event) => {
                      addFiles(Array.from(event.target.files ?? []));
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              ) : (
                <p>{ANNOUNCEMENT_MEDIA_MAX} of {ANNOUNCEMENT_MEDIA_MAX} media added</p>
              )}
              {mediaError ? (
                <span className="hamd-entity-field__error">{mediaError}</span>
              ) : null}
              <ul className="hamd-media-grid hamd-media-grid--announcement">
                {(existing?.media ?? []).map((item, index) => (
                  <li key={item.id} className="hamd-media-tile">
                    <button
                      type="button"
                      className="hamd-media-tile__preview"
                      aria-label="Preview media"
                      onClick={() =>
                        setLightbox({
                          items: (existing?.media ?? []).map((media) => ({
                            src: media.href,
                            kind: announcementMediaKind(media.mimeType),
                            alt: "",
                          })),
                          index,
                        })
                      }
                    >
                      {item.kind === "video" || item.mimeType.startsWith("video/") ? (
                        <video src={item.href} muted playsInline preload="metadata" />
                      ) : (
                        <img src={item.href} alt="" />
                      )}
                    </button>
                    <div className="hamd-media-tile__bar">
                      <button type="button" onClick={() => void onDeleteMedia(item.id)}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
                {pendingPreviews.map((item, index) => (
                  <li key={`${item.file.size}-${index}`} className="hamd-media-tile">
                    <button
                      type="button"
                      className="hamd-media-tile__preview"
                      aria-label="Preview media"
                      onClick={() =>
                        setLightbox({
                          items: pendingPreviews.map((preview) => ({
                            src: preview.url,
                            kind: preview.kind,
                            alt: "",
                          })),
                          index,
                        })
                      }
                    >
                      {item.kind === "video" ? (
                        <video src={item.url} muted playsInline preload="metadata" />
                      ) : (
                        <img src={item.url} alt="" />
                      )}
                    </button>
                    <div className="hamd-media-tile__bar">
                      <button
                        type="button"
                        onClick={() =>
                          setPendingFiles((current) =>
                            current.filter((_, fileIndex) => fileIndex !== index),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="hamd-entity-form__aside">
            <section className="hamd-entity-section">
              <h2>Publishing</h2>
              <label className="hamd-entity-field">
                Audience
                <select disabled>
                  <option>Global public</option>
                </select>
              </label>
              <label className="hamd-entity-field">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as AnnouncementStatus,
                    }))
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="hamd-ops-cms__check">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, pinned: event.target.checked }))
                  }
                />
                Pin to the top of the public slider
              </label>
              <label className="hamd-entity-field">
                Schedule for
                <input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      scheduledFor: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="hamd-entity-field">
                Expires at
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, expiresAt: event.target.value }))
                  }
                />
              </label>
            </section>
            <details className="hamd-entity-advanced">
              <summary>Advanced</summary>
              <label className="hamd-entity-field">
                URL identifier
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugManual(true);
                    setForm((current) => ({ ...current, slug: event.target.value }));
                  }}
                  pattern="[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*"
                />
              </label>
            </details>
            <div className="hamd-entity-form__actions">
              <button type="submit" className="hamd-btn hamd-btn--primary" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Save announcement"}
              </button>
              <Link className="hamd-btn hamd-btn--ghost" to={editingId ? `/cms/${editingId}` : "/cms"}>
                Cancel
              </Link>
            </div>
          </aside>
        </form>
      ) : null}
      <MediaLightbox
        open={Boolean(lightbox)}
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
        onIndexChange={(next) =>
          setLightbox((current) => (current ? { ...current, index: next } : current))
        }
      />
    </OpsPage>
  );
}
