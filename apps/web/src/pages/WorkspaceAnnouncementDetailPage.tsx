import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  InitialsAvatar,
  MediaLightbox,
  SafeRichText,
  type MediaLightboxItem,
} from "@hamd/ui/primitives";

import {
  createAnnouncementReply,
  getAnnouncement,
  listAnnouncementReactions,
  listAnnouncementReplies,
  toggleAnnouncementReaction,
  type AnnouncementMediaItem,
  type AnnouncementReactionCount,
  type AnnouncementReplyRow,
  type AnnouncementRow,
} from "../api/parity-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { HostAlert, HostPage } from "../components/HostChrome.js";
import { EmojiInsertButton } from "./AnnouncementReplies.js";

const READ_PREFIX = "hamd.announcement.read.";

function formatAnnouncementDate(value: string | null | undefined): string {
  if (!value) return "Publishing soon";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function mediaLabel(item: AnnouncementMediaItem): string {
  if (item.kind === "image") return "Image";
  if (item.kind === "video") return "Video";
  return "Document";
}

export function WorkspaceAnnouncementDetailPage() {
  const { id = "" } = useParams();
  const auth = useAuth();
  const [row, setRow] = useState<AnnouncementRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<AnnouncementReplyRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<AnnouncementReactionCount[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
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
        try {
          window.localStorage.setItem(`${READ_PREFIX}${data.id}`, "1");
        } catch {
          /* ignore */
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Announcement not found."),
      );
  }, [id]);

  const loadReplies = useCallback(
    async (cursor?: string) => {
      if (!id) return;
      const page = await listAnnouncementReplies(id, cursor ? { cursor } : {});
      setReplies((current) => (cursor ? [...current, ...page.items] : page.items));
      setNextCursor(page.nextCursor);
    },
    [id],
  );

  const loadReactions = useCallback(async () => {
    if (!id) return;
    const token = await auth.ensureSession();
    setReactions(await listAnnouncementReactions(id, token ?? undefined));
  }, [auth.ensureSession, id]);

  useEffect(() => {
    void loadReplies().catch(() => setReplies([]));
  }, [loadReplies]);

  useEffect(() => {
    void loadReactions().catch(() => setReactions([]));
  }, [loadReactions]);

  const media = useMemo(() => row?.media ?? [], [row]);
  const lightboxItems: MediaLightboxItem[] = useMemo(
    () =>
      media
        .filter((item) => item.kind === "image" || item.kind === "video")
        .map((item) => ({
          src: item.href,
          kind: item.kind === "video" ? "video" : "image",
          alt: item.name,
        })),
    [media],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.replace(/<[^>]*>/g, "").trim();
    if (!body) {
      setReplyError("Enter a reply before sending.");
      return;
    }
    if (body.length > 2000) {
      setReplyError("Keep replies to 2000 characters.");
      return;
    }
    setSending(true);
    setReplyError(null);
    try {
      const token = await auth.ensureSession();
      if (!token) throw new Error("Sign in to reply.");
      const created = await createAnnouncementReply(token, id, body);
      setReplies((current) => [created, ...current]);
      setDraft("");
      await loadReplies();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Unable to send reply.");
    } finally {
      setSending(false);
    }
  };

  const onReact = async (emoji: string) => {
    setReactionError(null);
    try {
      const token = await auth.ensureSession();
      if (!token) throw new Error("Sign in to react.");
      setReactions(await toggleAnnouncementReaction(token, id, emoji));
    } catch (err) {
      setReactionError(err instanceof Error ? err.message : "Unable to save reaction.");
    }
  };

  return (
    <HostPage>
      {error ? <HostAlert>{error}</HostAlert> : null}
      {row ? (
        <article className="hamd-announcement-article">
          <p className="hamd-catalog-page__crumb">
            <Link to="/app/announcements">Announcements</Link>
            <span aria-hidden="true"> / </span>
            <span>{row.title}</span>
          </p>
          <header className="hamd-announcement-article__header">
            <h1>{row.title}</h1>
            <p>
              <time dateTime={row.publishedAt ?? undefined}>
                {formatAnnouncementDate(row.publishedAt)}
              </time>
            </p>
            {row.summary ? <p className="hamd-announcement-article__lede">{row.summary}</p> : null}
          </header>
          {media.length > 0 ? (
            <ul className="hamd-announcement-article__media">
              {media.map((item) => {
                const index = lightboxItems.findIndex((entry) => entry.src === item.href);
                return (
                  <li key={item.id}>
                    {item.kind === "image" ? (
                      <button
                        type="button"
                        className="hamd-announcement-article__media-btn"
                        onClick={() =>
                          setLightbox({ items: lightboxItems, index: Math.max(0, index) })
                        }
                      >
                        <img src={item.href} alt="" />
                        <span className="hamd-sr-only">{mediaLabel(item)}</span>
                      </button>
                    ) : item.kind === "video" ? (
                      <button
                        type="button"
                        className="hamd-announcement-article__media-btn"
                        onClick={() =>
                          setLightbox({ items: lightboxItems, index: Math.max(0, index) })
                        }
                      >
                        <video src={item.href} muted playsInline preload="metadata" />
                        <span className="hamd-sr-only">{mediaLabel(item)}</span>
                      </button>
                    ) : (
                      <a href={item.href}>{item.name}</a>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
          <SafeRichText className="hamd-announcement-article__body" value={row.body} />
          <section className="hamd-announcement-reactions" aria-labelledby="announcement-reactions">
            <h2 id="announcement-reactions">Reactions</h2>
            <div className="hamd-announcement-reactions__row">
              {reactions.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  className={
                    item.reacted
                      ? "hamd-announcement-reactions__chip is-active"
                      : "hamd-announcement-reactions__chip"
                  }
                  aria-pressed={item.reacted}
                  onClick={() => void onReact(item.emoji)}
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  <span>{item.count}</span>
                </button>
              ))}
              <EmojiInsertButton disabled={sending} onInsert={(value) => void onReact(value)} />
            </div>
            {reactionError ? <p role="alert">{reactionError}</p> : null}
          </section>
          <section className="hamd-announcement-replies" aria-labelledby="announcement-replies">
            <h2 id="announcement-replies">Replies</h2>
            <form className="hamd-announcement-replies__form" onSubmit={(event) => void onSubmit(event)}>
              <label htmlFor="announcement-reply">Your reply</label>
              <div className="hamd-announcement-replies__composer">
                <textarea
                  id="announcement-reply"
                  value={draft}
                  maxLength={2000}
                  rows={4}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <EmojiInsertButton
                  disabled={sending}
                  onInsert={(value) => setDraft((current) => `${current}${value}`)}
                />
              </div>
              {replyError ? <p role="alert">{replyError}</p> : null}
              <button type="submit" className="hamd-btn hamd-btn--primary" disabled={sending}>
                {sending ? "Sending…" : "Post reply"}
              </button>
            </form>
            <ul className="hamd-announcement-replies__list">
              {replies.map((item) => (
                <li key={item.id} className="hamd-announcement-replies__item">
                  <InitialsAvatar name={item.authorLabel} size="sm" />
                  <div>
                    <p className="hamd-announcement-replies__author">{item.authorLabel}</p>
                    <time dateTime={item.createdAt}>{formatAnnouncementDate(item.createdAt)}</time>
                    <p className="hamd-announcement-replies__body">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            {nextCursor ? (
              <button
                type="button"
                className="hamd-btn hamd-btn--secondary"
                onClick={() => void loadReplies(nextCursor)}
              >
                Load more replies
              </button>
            ) : null}
          </section>
        </article>
      ) : null}
      <MediaLightbox
        open={Boolean(lightbox)}
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
        onIndexChange={(index) =>
          setLightbox((current) => (current ? { ...current, index } : current))
        }
      />
    </HostPage>
  );
}
