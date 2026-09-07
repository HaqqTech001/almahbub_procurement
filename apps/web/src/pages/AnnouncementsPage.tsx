import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ListModuleFrame } from "@hamd/ui/module-layout";

import {
  listAnnouncements,
  type AnnouncementRow,
} from "../api/parity-api.js";
import { applyPageSeo } from "../lib/seo.js";

const READ_PREFIX = "hamd.announcement.read.";

function isAnnouncementRead(id: string): boolean {
  try {
    return window.localStorage.getItem(`${READ_PREFIX}${id}`) === "1";
  } catch {
    return false;
  }
}

function formatAnnouncementDate(value: string | null | undefined): string {
  if (!value) return "Publishing soon";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function announcementHref(row: AnnouncementRow, basePath: string): string {
  return `${basePath}/${row.slug || row.id}`;
}

function excerptFor(row: AnnouncementRow): string {
  const summary = row.summary?.trim();
  if (summary) return summary.length > 160 ? `${summary.slice(0, 157)}…` : summary;
  const plain = row.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "Open to read the full announcement.";
  return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain;
}

export function AnnouncementsPage({ basePath = "/announcements" }: { basePath?: string }) {
  const workspace = basePath.startsWith("/app");
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [readFilter, setReadFilter] = useState("all");

  useEffect(() => {
    applyPageSeo({
      title: "Announcements | Almahbub",
      description: "Published platform announcements and official notices.",
      path: "/announcements",
    });
    void listAnnouncements()
      .then(setRows)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load announcements."),
      )
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const read = isAnnouncementRead(row.id);
      if (readFilter === "unread" && read) return false;
      if (readFilter === "read" && !read) return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        (row.summary ?? "").toLowerCase().includes(q) ||
        row.body.toLowerCase().includes(q)
      );
    });
  }, [query, readFilter, rows]);

  const list = (
    <ul className="hamd-announcement-board__list">
      {visible.map((row) => {
        const thumb = row.media?.find((item) => item.kind === "image");
        const href = announcementHref(row, basePath);
        const read = isAnnouncementRead(row.id);
        return (
          <li key={row.id}>
            <Link className="hamd-announcement-row" to={href} data-read={read ? "true" : "false"}>
              {thumb ? (
                <img className="hamd-announcement-row__thumb" src={thumb.href} alt="" />
              ) : (
                <span className="hamd-announcement-row__thumb hamd-announcement-row__thumb--empty" aria-hidden>
                  {row.title.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hamd-announcement-row__body">
                <span className="hamd-announcement-row__meta">
                  <span className="hamd-announcement-row__state">{read ? "Read" : "Unread"}</span>
                  <time dateTime={row.publishedAt ?? undefined}>
                    {formatAnnouncementDate(row.publishedAt)}
                  </time>
                </span>
                <strong className="hamd-announcement-row__title">{row.title}</strong>
                <span className="hamd-announcement-row__excerpt">{excerptFor(row)}</span>
              </span>
              <span className="hamd-announcement-row__open" aria-hidden="true">
                Open
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const toolbar = {
    search: {
      value: query,
      onChange: setQuery,
      placeholder: "Search announcements",
    },
    filters: [
      {
        label: "Status",
        value: readFilter,
        onChange: setReadFilter,
        options: [
          { value: "all", label: "All" },
          { value: "unread", label: "Unread" },
          { value: "read", label: "Read" },
        ],
      },
    ],
    onReset: () => {
      setQuery("");
      setReadFilter("all");
    },
  };

  if (!workspace) {
    return (
      <div className="hamd-announcement-board">
        <header className="hamd-catalog-page__header">
          <h1>Announcements</h1>
          <p>Official notices and sourcing updates.</p>
        </header>
        <ListModuleFrame
          header={{ title: "Announcements" }}
          toolbar={toolbar}
          loading={loading}
          error={error}
          errorTitle="Could not load announcements."
          retryLabel="Try Again"
          onRetry={() => {
            setLoading(true);
            setError(null);
            void listAnnouncements()
              .then(setRows)
              .catch((err) =>
                setError(err instanceof Error ? err.message : "Unable to load announcements."),
              )
              .finally(() => setLoading(false));
          }}
          empty={{
            title: "No announcements published yet",
            description:
              rows.length === 0
                ? "Published notices will appear here."
                : "No announcements match this search.",
          }}
          isEmpty={!loading && !error && visible.length === 0}
        >
          {visible.length > 0 ? list : null}
        </ListModuleFrame>
      </div>
    );
  }

  return (
    <ListModuleFrame
      className="hamd-announcement-board hamd-list-queue"
      header={{
        title: "Announcements",
        description: "Official notices for your procurement workspace.",
      }}
      toolbar={toolbar}
      loading={loading}
      error={error}
      errorTitle="Could not load announcements."
      retryLabel="Try Again"
      onRetry={() => {
        setLoading(true);
        setError(null);
        void listAnnouncements()
          .then(setRows)
          .catch((err) =>
            setError(err instanceof Error ? err.message : "Unable to load announcements."),
          )
          .finally(() => setLoading(false));
      }}
      empty={{
        title: "No announcements published yet",
        description:
          rows.length === 0
            ? "Published notices will appear here for your organisation."
            : "No announcements match this search.",
      }}
      isEmpty={!loading && !error && visible.length === 0}
    >
      {visible.length > 0 ? list : null}
    </ListModuleFrame>
  );
}
