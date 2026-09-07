import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getAnnouncement,
  type AnnouncementMediaItem,
  type AnnouncementRow,
} from "../api/parity-api.js";
import { MediaLightbox, type MediaLightboxItem } from "@hamd/ui/primitives";
import { PageHero } from "../components/PageHero.js";
import { applyPageSeo } from "../lib/seo.js";

function formatAnnouncementDate(value: string | null | undefined): string {
  if (!value) return "Publishing soon";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function mediaLabel(item: AnnouncementMediaItem): string {
  if (item.kind === "image") return "Image";
  if (item.kind === "video") return "Video";
  return "Document";
}

export function AnnouncementDetailPage() {
  const { id = "" } = useParams();
  const [row, setRow] = useState<AnnouncementRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ items: MediaLightboxItem[]; index: number } | null>(
    null,
  );

  useEffect(() => {
    if (!id) return;
    setError(null);
    setRow(null);
    void getAnnouncement(id)
      .then((data) => {
        setRow(data);
        applyPageSeo({
          title: `${data.title} | Almahbub`,
          description: data.summary ?? data.title,
          path: `/announcements/${data.slug || data.id}`,
        });
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Announcement not found."),
      );
  }, [id]);

  const heroDescription =
    row?.summary?.trim() ||
    "Review the full business announcement, media, and publication details.";

  const media = useMemo(() => row?.media ?? [], [row]);

  return (
    <>
      <PageHero
        eyebrow="Announcement"
        title={row?.title ?? "Announcement"}
        description={heroDescription}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Announcements", href: "/announcements" },
          { label: row?.title ?? "Detail" },
        ]}
      />

      <section className="hamd-announcement-detail" aria-labelledby="announcement-detail-heading">
        <div className="hamd-announcement-detail__shell">
          {error ? (
            <div className="hamd-announcement-detail__panel hamd-announcement-detail__panel--error" role="alert">
              <h2>Unable to load this announcement</h2>
              <p>{error}</p>
              <Link className="hamd-btn hamd-btn--secondary" to="/announcements">
                Back to announcements
              </Link>
            </div>
          ) : null}

          {!error && !row ? (
            <div className="hamd-announcement-detail__panel" role="status" aria-live="polite">
              <div className="hamd-announcements-skeleton hamd-announcements-skeleton--wide" />
              <div className="hamd-announcements-skeleton" />
              <div className="hamd-announcements-skeleton" />
            </div>
          ) : null}

          {row ? (
            <div className="hamd-announcement-detail__layout">
              <article className="hamd-announcement-detail__body">
                <header className="hamd-announcement-detail__header">
                  <div className="hamd-announcements-meta">
                    <span className="hamd-announcements-chip">Published notice</span>
                    <span>{formatAnnouncementDate(row.publishedAt)}</span>
                    <span>{row.viewCount} views</span>
                  </div>
                  <h2 id="announcement-detail-heading">{row.title}</h2>
                  <p>{heroDescription}</p>
                </header>

                <div className="hamd-announcement-detail__content" style={{ whiteSpace: "pre-wrap" }}>
                  {row.body}
                </div>
              </article>

              <aside className="hamd-announcement-detail__sidebar" aria-label="Announcement resources">
                <section className="hamd-announcement-detail__panel">
                  <h3>Publication details</h3>
                  <dl className="hamd-announcement-detail__facts">
                    <div>
                      <dt>Status</dt>
                      <dd>{row.status}</dd>
                    </div>
                    <div>
                      <dt>Published</dt>
                      <dd>{formatAnnouncementDate(row.publishedAt)}</dd>
                    </div>
                    <div>
                      <dt>Views</dt>
                      <dd>{row.viewCount}</dd>
                    </div>
                  </dl>
                </section>

                {media.length > 0 ? (
                  <section className="hamd-announcement-detail__panel">
                    <h3>Media and files</h3>
                    <ul className="hamd-announcement-detail__media-list">
                      {media.map((item) => (
                        <li key={item.id} className="hamd-announcement-detail__media-item">
                          {item.kind === "image" || item.kind === "video" ? (
                            <button
                              type="button"
                              className="hamd-announcement-detail__media-open"
                              aria-label={`Preview ${mediaLabel(item)}`}
                              onClick={() =>
                                setLightbox({
                                  items: media
                                    .filter((entry) => entry.kind === "image" || entry.kind === "video")
                                    .map((entry) => ({
                                      src: entry.href,
                                      kind: entry.kind === "video" ? "video" : "image",
                                      alt: "",
                                    })),
                                  index: media
                                    .filter((entry) => entry.kind === "image" || entry.kind === "video")
                                    .findIndex((entry) => entry.id === item.id),
                                })
                              }
                            >
                              {item.kind === "image" ? (
                                <img src={item.href} alt="" loading="lazy" />
                              ) : (
                                <video src={item.href} muted playsInline preload="metadata" />
                              )}
                            </button>
                          ) : (
                            <>
                              <div className="hamd-announcement-detail__media-meta">
                                <span className="hamd-announcements-chip">{mediaLabel(item)}</span>
                                <strong>{item.name}</strong>
                              </div>
                              <a href={item.href} className="hamd-btn hamd-btn--secondary">
                                Open file
                              </a>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="hamd-announcement-detail__panel">
                  <h3>Continue browsing</h3>
                  <p>Return to the announcement archive to review other published procurement and service updates.</p>
                  <Link className="hamd-btn hamd-btn--primary" to="/announcements">
                    Back to announcements
                  </Link>
                </section>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
      <MediaLightbox
        open={Boolean(lightbox)}
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
        onIndexChange={(next) =>
          setLightbox((current) => (current ? { ...current, index: next } : current))
        }
      />
    </>
  );
}