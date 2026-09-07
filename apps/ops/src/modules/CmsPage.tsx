import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ListModuleFrame } from "@hamd/ui/module-layout";
import { StatusBadge } from "@hamd/ui/primitives";

import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { opsFetch } from "../lib/ops-fetch.js";
import {
  announcementAudience,
  announcementStatusLabel,
  type AnnouncementRow,
  type AnnouncementStatus,
} from "./announcement-model.js";

function excerptFor(row: AnnouncementRow): string {
  const summary = row.summary?.trim();
  if (summary) return summary.length > 140 ? `${summary.slice(0, 137)}…` : summary;
  const plain = (row.body ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "Open to read the full announcement.";
  return plain.length > 140 ? `${plain.slice(0, 137)}…` : plain;
}

export function CmsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | AnnouncementStatus>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : "Unable to load announcements.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAnnouncements]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return announcements.filter((row) => {
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
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

  const patchStatus = async (id: string, status: AnnouncementStatus) => {
    setError(null);
    setBusyId(id);
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
      await refreshAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    setBusyId(id);
    try {
      const token = await tokenOrThrow();
      await opsFetch(`/announcements/${id}`, {
        method: "DELETE",
        accessToken: token,
      });
      setSuccess("Announcement deleted.");
      setPendingDeleteId(null);
      await refreshAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <OpsPage className="hamd-ops-cms hamd-list-queue">
      {error ? <OpsAlert tone="danger">{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      <ListModuleFrame
        header={{
          title: "Announcements",
          description:
            "Published items appear on the public site. This does not replace the Rowdotul HAMD'26 wedding slides.",
          actions: (
            <Link className="hamd-btn hamd-btn--primary" to="/cms/new">
              Create Announcement
            </Link>
          ),
        }}
        toolbar={{
          search: {
            value: search,
            onChange: setSearch,
            placeholder: "Title or summary",
          },
          filters: [
            {
              label: "Status",
              value: statusFilter,
              onChange: (value) => setStatusFilter(value as "all" | AnnouncementStatus),
              options: [
                { value: "all", label: "All" },
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ],
            },
          ],
          onReset: () => {
            setSearch("");
            setStatusFilter("all");
          },
        }}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          void refreshAnnouncements().finally(() => setLoading(false));
        }}
        empty={{
          title: "No announcements yet.",
          description:
            announcements.length === 0
              ? "Create and publish an announcement to show it to the intended audience."
              : "No announcements match these filters.",
        }}
        isEmpty={!loading && !error && visible.length === 0}
      >
      <ul className="hamd-ops-cms__list hamd-ops-cms__list--scroll">
        {visible.map((row) => {
          const thumb = row.media?.find((item) => item.kind === "image") ?? row.media?.[0];
          return (
            <li key={row.id} className="hamd-ops-cms__row">
              <button
                type="button"
                className="hamd-ops-cms__hit"
                onClick={() => navigate(`/cms/${row.id}`)}
              >
                {thumb ? (
                  <img src={thumb.href} alt="" className="hamd-ops-cms__thumb" />
                ) : (
                  <span className="hamd-ops-cms__thumb hamd-ops-cms__thumb--empty" aria-hidden>
                    {row.title.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="hamd-ops-cms__copy">
                  <strong>{row.title}</strong>
                  <span className="hamd-ops-cms__excerpt">{excerptFor(row)}</span>
                  <span>
                    {announcementAudience(row)} · {announcementStatusLabel(row.status)}
                    {row.publishedAt
                      ? ` · ${new Date(row.publishedAt).toLocaleDateString()}`
                      : ""}
                    {row.pinned ? " · Pinned" : ""}
                  </span>
                </div>
                <span className="hamd-ops-cms__open" aria-hidden="true">
                  <svg viewBox="0 0 20 20" width="16" height="16">
                    <path
                      d="M7.5 4.5L13 10l-5.5 5.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
              <div className="hamd-ops-cms__actions">
                <StatusBadge
                  status={row.status}
                  label={announcementStatusLabel(row.status)}
                />
                <Link className="hamd-btn hamd-btn--ghost" to={`/cms/${row.id}`}>
                  View
                </Link>
                <Link className="hamd-btn hamd-btn--ghost" to={`/cms/${row.id}/edit`}>
                  Edit
                </Link>
                {row.status !== "published" ? (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--secondary"
                    disabled={busyId === row.id}
                    onClick={() => void patchStatus(row.id, "published")}
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--secondary"
                    disabled={busyId === row.id}
                    onClick={() => void patchStatus(row.id, "draft")}
                  >
                    Unpublish
                  </button>
                )}
                {pendingDeleteId === row.id ? (
                  <div className="hamd-admin-user-confirm" role="alertdialog" aria-live="assertive">
                    <p>
                      Delete this announcement? This permanently removes the item and any
                      attached media.
                    </p>
                    <div className="hamd-ops-reports__row">
                      <button
                        type="button"
                        className="hamd-btn hamd-btn--primary"
                        disabled={busyId === row.id}
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
          );
        })}
      </ul>
      </ListModuleFrame>
    </OpsPage>
  );
}
