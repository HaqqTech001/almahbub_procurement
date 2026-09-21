import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { opsFetch } from "../lib/ops-fetch.js";

type AnnouncementStatus = "draft" | "published" | "archived";

type AnnouncementMediaItem = {
  id: string;
  name: string;
  mimeType: string;
  kind: string;
  href: string;
  sizeBytes: number;
};

type AnnouncementRow = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  body: string;
  status: string;
  publishedAt: string | null;
  pinned?: boolean;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  viewCount: number;
  updatedAt: string;
  media?: AnnouncementMediaItem[];
};

const emptyForm = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  status: "draft" as AnnouncementStatus,
  pinned: false,
  scheduledFor: "",
  expiresAt: "",
};

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoOrNull(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function CmsPage() {
  const auth = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | AnnouncementStatus>(
    "all",
  );
  const [search, setSearch] = useState("");

  const refreshAnnouncements = useCallback(async () => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in required.");
    const rows = await opsFetch<AnnouncementRow[]>("/announcements/admin", {
      accessToken: token,
    });
    setAnnouncements(rows);
  }, [auth]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await refreshAnnouncements();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load announcements.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAnnouncements]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return announcements.filter((row) => {
      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;
      const matchesSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        (row.summary ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [announcements, search, statusFilter]);

  const tokenOrThrow = async () => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in required.");
    return token;
  };

  const attachFiles = async (announcementId: string, files: File[], token: string) => {
    if (files.length === 0) return;
    const form = new FormData();
    for (const file of files) form.append("media", file);
    await opsFetch(`/announcements/${announcementId}/media`, {
      method: "POST",
      accessToken: token,
      form,
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const token = await tokenOrThrow();
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase(),
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
        setSuccess("Announcement updated.");
      } else {
        const created = await opsFetch<AnnouncementRow>("/announcements", {
          method: "POST",
          accessToken: token,
          body: payload,
        });
        await attachFiles(created.id, pendingFiles, token);
        setSuccess(
          form.status === "published"
            ? "Announcement published to the global public slider."
            : "Draft saved. It is not visible on the public site.",
        );
      }
      setForm(emptyForm);
      setEditingId(null);
      setPendingFiles([]);
      await refreshAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  };

  const patchStatus = async (id: string, status: AnnouncementStatus) => {
    setError(null);
    try {
      const token = await tokenOrThrow();
      await opsFetch(`/announcements/${id}`, {
        method: "PATCH",
        accessToken: token,
        body: { status },
      });
      await refreshAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      const token = await tokenOrThrow();
      await opsFetch(`/announcements/${id}`, {
        method: "DELETE",
        accessToken: token,
      });
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
        setPendingFiles([]);
      }
      await refreshAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const onDeleteMedia = async (announcementId: string, mediaId: string) => {
    setError(null);
    try {
      const token = await tokenOrThrow();
      await opsFetch(`/announcements/${announcementId}/media/${mediaId}`, {
        method: "DELETE",
        accessToken: token,
      });
      await refreshAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove media.");
    }
  };

  const editingRow = announcements.find((row) => row.id === editingId);

  return (
    <OpsPage className="hamd-ops-cms">
      <h2>Announcements</h2>
      <p>
        Manage global site announcements. Published items appear above the navbar
        on International, Integrated Export, and other public pages. This is not
        an Integrated Export-only campaign, and it does not replace the #Hamd'26
        wedding slides.
      </p>
      {error ? <OpsAlert tone="danger">{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      <form className="hamd-ops-reports" onSubmit={(event) => void onSubmit(event)}>
        <h3>{editingId ? "Edit announcement" : "Create announcement"}</h3>
        <label>
          Title
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
        </label>
        <label>
          Slug
          <input
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({ ...current, slug: event.target.value }))
            }
            pattern="[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*"
            required
          />
        </label>
        <label>
          Summary
          <input
            value={form.summary}
            onChange={(event) =>
              setForm((current) => ({ ...current, summary: event.target.value }))
            }
          />
        </label>
        <label>
          Body
          <textarea
            rows={5}
            value={form.body}
            onChange={(event) =>
              setForm((current) => ({ ...current, body: event.target.value }))
            }
            required
          />
        </label>
        <label>
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
        <label>
          Schedule for (optional)
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
        <label>
          Expires at (optional)
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                expiresAt: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Media (images, video, or files; max 5, 10MB each)
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,application/pdf,.doc,.docx,.txt"
            onChange={(event) =>
              setPendingFiles(Array.from(event.target.files ?? []))
            }
          />
        </label>
        {editingRow?.media?.length ? (
          <ul className="hamd-ops-cms__media">
            {editingRow.media.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} ({item.kind})
                </span>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => void onDeleteMedia(editingRow.id, item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="hamd-ops-reports__row">
          <button type="submit" className="hamd-btn hamd-btn--primary">
            {editingId ? "Save changes" : "Save announcement"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setPendingFiles([]);
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="hamd-request-hub__toolbar" role="search">
        <label className="hamd-request-hub__field hamd-request-hub__field--search">
          <span className="hamd-request-hub__field-label">Search</span>
          <span className="hamd-request-hub__field-control">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title or slug"
            />
          </span>
        </label>
        <label className="hamd-request-hub__field hamd-request-hub__field--status">
          <span className="hamd-request-hub__field-label">Status</span>
          <span className="hamd-request-hub__field-control">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | AnnouncementStatus)
              }
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </span>
        </label>
      </div>

      {loading ? <p role="status">Loading announcements…</p> : null}
      {!loading && visible.length === 0 ? (
        <p className="hamd-ops-empty" role="status">
          No announcements match these filters.
        </p>
      ) : null}
      <ul className="hamd-ops-cms__list">
        {visible.map((row) => (
          <li key={row.id} className="hamd-ops-cms__row">
            <div>
              <strong>{row.title}</strong>
              <span>
                {row.status} · /{row.slug} · {row.viewCount} views
                {row.pinned ? " · Pinned" : ""}
              </span>
            </div>
            <div className="hamd-ops-cms__actions">
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                onClick={() => {
                  setEditingId(row.id);
                  setPendingFiles([]);
                  setForm({
                    title: row.title,
                    slug: row.slug,
                    summary: row.summary ?? "",
                    body: row.body,
                    status:
                      row.status === "draft" ||
                      row.status === "published" ||
                      row.status === "archived"
                        ? row.status
                        : "draft",
                    pinned: Boolean(row.pinned),
                    scheduledFor: toDatetimeLocal(row.scheduledFor),
                    expiresAt: toDatetimeLocal(row.expiresAt),
                  });
                }}
              >
                Edit
              </button>
              {row.status !== "published" ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--secondary"
                  onClick={() => void patchStatus(row.id, "published")}
                >
                  Publish
                </button>
              ) : (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--secondary"
                  onClick={() => void patchStatus(row.id, "draft")}
                >
                  Unpublish
                </button>
              )}
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                onClick={() =>
                  void (async () => {
                    const token = await tokenOrThrow();
                    await opsFetch(`/announcements/${row.id}`, {
                      method: "PATCH",
                      accessToken: token,
                      body: { pinned: !row.pinned },
                    });
                    await refreshAnnouncements();
                  })()
                }
              >
                {row.pinned ? "Unpin" : "Pin"}
              </button>
              {row.status !== "archived" ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => void patchStatus(row.id, "archived")}
                >
                  Archive
                </button>
              ) : null}
              {pendingDeleteId === row.id ? (
                <div className="hamd-admin-user-confirm" role="alertdialog" aria-live="assertive">
                  <p>Delete this announcement? This permanently removes the item and any attached media.</p>
                  <div className="hamd-ops-reports__row">
                    <button
                      type="button"
                      className="hamd-btn hamd-btn--primary"
                      onClick={() => void onDelete(row.id)}
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      className="hamd-btn hamd-btn--ghost"
                      onClick={() => setPendingDeleteId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => setPendingDeleteId(row.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </OpsPage>
  );
}
