import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusBadge, AttributeList, MediaLightbox, type MediaLightboxItem } from "@hamd/ui/primitives";

import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsAlert, OpsLoading, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { OpsConfirmModal } from "../components/OpsConfirmModal.js";
import { opsFetch } from "../lib/ops-fetch.js";
import {
  announcementAudience,
  announcementMediaKind,
  announcementStatusLabel,
  type AnnouncementRow,
  type AnnouncementStatus,
} from "./announcement-model.js";

export function AnnouncementDetailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [row, setRow] = useState<AnnouncementRow | null>(null);
  const [replies, setReplies] = useState<
    Array<{ id: string; body: string; createdAt: string; authorLabel: string; hidden?: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: MediaLightboxItem[]; index: number } | null>(
    null,
  );

  const tokenOrThrow = async () => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in required.");
    return token;
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await tokenOrThrow();
      const rows = await opsFetch<AnnouncementRow[]>("/announcements/admin", {
        accessToken: token,
      });
      const current = rows.find((item) => item.id === id) ?? null;
      if (!current) {
        setError("Announcement not found.");
        setRow(null);
        return;
      }
      setRow(current);
      try {
        const page = await opsFetch<{
          items: Array<{
            id: string;
            body: string;
            createdAt: string;
            authorLabel: string;
            hidden?: boolean;
          }>;
        }>(`/announcements/${id}/replies`, { accessToken: token });
        setReplies(page.items ?? []);
      } catch {
        setReplies([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load announcement.");
    } finally {
      setLoading(false);
    }
  }, [auth, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchStatus = async (status: AnnouncementStatus) => {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenOrThrow();
      await opsFetch(`/announcements/${id}`, {
        method: "PATCH",
        accessToken: token,
        body: { status },
      });
      setSuccess(
        status === "published"
          ? "Announcement published."
          : status === "archived"
            ? "Announcement archived."
            : "Announcement unpublished.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      const token = await tokenOrThrow();
      await opsFetch(`/announcements/${id}`, {
        method: "DELETE",
        accessToken: token,
      });
      navigate("/cms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setBusy(false);
    }
  };

  const hideReply = async (replyId: string, hidden: boolean) => {
    try {
      const token = await tokenOrThrow();
      await opsFetch(`/announcements/replies/${replyId}`, {
        method: "PATCH",
        accessToken: token,
        body: { hidden },
      });
      setReplies((current) =>
        current.map((item) => (item.id === replyId ? { ...item, hidden } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update reply.");
    }
  };

  return (
    <OpsPage>
      <p>
        <Link to="/cms">Announcements</Link>
      </p>
      {error ? <OpsAlert tone="danger">{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      {loading ? <OpsLoading label="Loading announcement…" /> : null}
      {!loading && row ? (
        <article className="hamd-entity-page">
          <header className="hamd-entity-form__header">
            <div>
              <p className="hamd-ops-empty">{announcementAudience(row)}</p>
              <h1>{row.title}</h1>
              <StatusBadge status={row.status} label={announcementStatusLabel(row.status)} />
            </div>
            <div className="hamd-entity-form__actions">
              <Link className="hamd-btn hamd-btn--primary" to={`/cms/${row.id}/edit`}>
                Edit
              </Link>
              {row.status !== "published" ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--secondary"
                  disabled={busy}
                  onClick={() => void patchStatus("published")}
                >
                  Publish
                </button>
              ) : (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--secondary"
                  disabled={busy}
                  onClick={() => void patchStatus("draft")}
                >
                  Unpublish
                </button>
              )}
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            </div>
          </header>
          <section className="hamd-entity-section">
            <h2>Media</h2>
            {row.media?.length ? (
              <ul className="hamd-media-grid hamd-media-grid--announcement">
                {row.media.map((item, index) => (
                  <li key={item.id} className="hamd-media-tile">
                    <button
                      type="button"
                      className="hamd-media-tile__preview"
                      aria-label="Preview media"
                      onClick={() =>
                        setLightbox({
                          items: (row.media ?? []).map((media) => ({
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
                  </li>
                ))}
              </ul>
            ) : (
              <p>No media attached.</p>
            )}
          </section>
          <section className="hamd-entity-section">
            <h2>Content</h2>
            {row.summary ? <p>{row.summary}</p> : null}
            <p className="hamd-ops-announcement-body">{row.body}</p>
          </section>
          <section className="hamd-entity-section">
            <h2>Publication</h2>
            <AttributeList
              items={[
                {
                  label: "Published",
                  value: row.publishedAt
                    ? new Date(row.publishedAt).toLocaleString()
                    : "Not published",
                },
                { label: "Updated", value: new Date(row.updatedAt).toLocaleString() },
                { label: "Audience", value: announcementAudience(row) },
                { label: "Views", value: String(row.viewCount) },
              ]}
            />
          </section>
          <section className="hamd-entity-section">
            <h2>Replies</h2>
            {replies.length === 0 ? (
              <p>No replies yet.</p>
            ) : (
              <ul>
                {replies.map((item) => (
                  <li key={item.id}>
                    <strong>{item.authorLabel}</strong>
                    <span> {new Date(item.createdAt).toLocaleString()}</span>
                    <p>{item.body}</p>
                    <button
                      type="button"
                      className="hamd-btn hamd-btn--ghost"
                      onClick={() => void hideReply(item.id, !item.hidden)}
                    >
                      {item.hidden ? "Show reply" : "Hide reply"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
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
      <OpsConfirmModal
        open={confirmDelete}
        title="Delete announcement"
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void onDelete()}
      >
        This permanently removes the announcement and attached media.
      </OpsConfirmModal>
    </OpsPage>
  );
}
