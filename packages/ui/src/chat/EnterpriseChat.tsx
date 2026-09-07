import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { InitialsAvatar } from "../primitives/InitialsAvatar.js";
import { MediaLightbox, type MediaLightboxItem } from "../primitives/MediaLightbox.js";
import { AttachmentBoard } from "../primitives/AuthenticatedMedia.js";
import {
  chatRoomContextLine,
  chatRoomTypeLabel,
  deliveryLabel,
  emptyChatFilters,
  filterMessages,
  filterRooms,
  formatBytes,
  formatChatTimestamp,
  formatUnreadCount,
  pinnedMessages,
  type ChatAttachment,
  type ChatFilterState,
  type ChatMessage,
  type ChatRoom,
} from "./types.js";
import { useChatRoom } from "./useChatRoom.js";
import type { ChatRealtimeEvent, ChatRoomHandlers } from "./useChatRoom.js";

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😊",
  "🙂",
  "😉",
  "😍",
  "🤩",
  "😎",
  "🤔",
  "😅",
  "😂",
  "😭",
  "🙏",
  "👍",
  "👎",
  "👏",
  "🙌",
  "✅",
  "❌",
  "⚠️",
  "🎉",
  "🔥",
  "❤️",
  "💯",
  "👀",
  "📎",
  "📄",
  "📷",
  "📦",
  "🚢",
  "💼",
  "💡",
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ComposerEmojiIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path
        d="M8.5 14.5c.8 1.2 2 1.8 3.5 1.8s2.7-.6 3.5-1.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ComposerAttachIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReceiptTick() {
  return (
    <svg
      className="hamd-chat-receipt__tick"
      width="12"
      height="10"
      viewBox="0 0 12 10"
      fill="none"
      aria-hidden
    >
      <path
        d="M1.2 5.2 3.8 7.8 10.5 1.5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function participantName(
  rooms: ChatRoom[],
  roomId: string,
  senderId: string,
): string {
  const room = rooms.find((r) => r.id === roomId);
  return room?.participants.find((p) => p.id === senderId)?.displayName ?? senderId;
}

export function ChatEmojiPicker({
  onSelect,
  open,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className="hamd-chat-emoji"
      role="listbox"
      aria-label="Emoji"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="option"
          className="hamd-chat-emoji__btn"
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove?: (() => void) | undefined;
}) {
  return (
    <div className="hamd-chat-chip" data-kind={attachment.kind}>
      {attachment.kind === "image" && (attachment.previewUrl || attachment.url) ? (
        <img
          src={attachment.previewUrl || attachment.url || ""}
          alt=""
          className="hamd-chat-chip__thumb"
        />
      ) : (
        <span className="hamd-chat-chip__kind">{attachment.kind}</span>
      )}
      <span className="hamd-chat-chip__meta">
        <span className="hamd-chat-chip__name">{attachment.name}</span>
        <span className="hamd-chat-chip__size">
          {formatBytes(attachment.sizeBytes)}
        </span>
      </span>
      {onRemove ? (
        <button
          type="button"
          className="hamd-chat-chip__remove"
          aria-label={`Remove ${attachment.name}`}
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function MediaBody({
  message,
}: {
  message: ChatMessage;
  onOpenAttachment?:
    | ((attachment: ChatAttachment) => void | Promise<void>)
    | undefined;
}) {
  const attachments = message.attachments ?? [];
  return (
    <div className="hamd-chat-media">
      {attachments.length > 0 ? (
        <AttachmentBoard
          compact
          mediaTitle=""
          documentsTitle=""
          emptyLabel=""
          files={attachments.map((att) => ({
            id: att.id,
            name: att.name,
            href: att.url,
            previewUrl: att.previewUrl,
            mimeType: att.mimeType,
            kind: att.kind,
            sizeBytes: att.sizeBytes,
          }))}
        />
      ) : null}
      {message.body ? <p className="hamd-chat-bubble__text">{message.body}</p> : null}
    </div>
  );
}

export type EnterpriseChatProps = {
  rooms: ChatRoom[];
  messages: ChatMessage[];
  currentUserId: string;
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  density?: "comfortable" | "compact" | undefined;
  activeRoomId?: string | undefined;
  initialFilters?: ChatFilterState | undefined;
  /** Hide the conversation list (single-thread support). */
  layout?: "inbox" | "solo" | undefined;
  /** Open the thread pane on small screens. */
  defaultThreadOpen?: boolean | undefined;
  /** Extra controls beside message search (e.g. AI suggestion). */
  headerActions?: ReactNode | undefined;
  onRoomChange?: ((roomId: string) => void) | undefined;
} & ChatRoomHandlers;

export function EnterpriseChatSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-chat", "hamd-chat--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-chat-skel hamd-chat-skel--aside" />
      <div className="hamd-chat-skel hamd-chat-skel--main" />
    </div>
  );
}

/**
 * Enterprise Chat - record-centric rooms with typing, receipts, media,
 * emoji, search, pins, and message actions. Presentational; hosts own API.
 */
export function EnterpriseChat({
  rooms: initialRooms,
  messages: initialMessages,
  currentUserId,
  title = "Messages",
  loading,
  className,
  density = "comfortable",
  activeRoomId,
  initialFilters,
  layout = "inbox",
  defaultThreadOpen = false,
  headerActions,
  onRoomChange,
  onSend,
  onMarkRead,
  onTyping,
  onPin,
  onDelete,
  onAttachFiles,
  onOpenAttachment,
  subscribe,
}: EnterpriseChatProps) {
  const searchId = useId();
  const messageSearchId = useId();
  const fileInputId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<ChatFilterState>(
    initialFilters ?? emptyChatFilters(),
  );
  const [actionsFor, setActionsFor] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(
    defaultThreadOpen || layout === "solo",
  );
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{
    items: MediaLightboxItem[];
    index: number;
  } | null>(null);

  const chat = useChatRoom(initialRooms, initialMessages, {
    currentUserId,
    ...(activeRoomId ? { activeRoomId } : {}),
    ...(onSend ? { onSend } : {}),
    ...(onMarkRead ? { onMarkRead } : {}),
    ...(onTyping ? { onTyping } : {}),
    ...(onPin ? { onPin } : {}),
    ...(onDelete ? { onDelete } : {}),
    ...(onAttachFiles ? { onAttachFiles } : {}),
    ...(subscribe ? { subscribe } : {}),
  });

  const visibleRooms = useMemo(
    () => filterRooms(chat.rooms, filters.roomQuery),
    [chat.rooms, filters.roomQuery],
  );
  const visibleMessages = useMemo(
    () => filterMessages(chat.roomMessages, filters.messageQuery),
    [chat.roomMessages, filters.messageQuery],
  );
  const pins = useMemo(
    () =>
      pinnedMessages(
        chat.roomMessages,
        chat.activeRoom?.pinnedMessageIds,
      ),
    [chat.roomMessages, chat.activeRoom?.pinnedMessageIds],
  );

  const openMediaAttachment = (attachment: ChatAttachment) => {
    const href = attachment.previewUrl || attachment.url;
    if (
      href &&
      (attachment.kind === "image" || attachment.kind === "video")
    ) {
      setLightbox({
        items: [{ src: href, kind: attachment.kind, alt: "" }],
        index: 0,
      });
      return;
    }
    void onOpenAttachment?.(attachment);
  };

  useEffect(() => {
    void chat.markVisibleRead();
    // Intentionally depend on room id + message count only (not full chat object).
  }, [chat.activeRoomId, chat.roomMessages.length, chat.markVisibleRead]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visibleMessages.length, chat.typingUserIds.length]);

  if (loading) {
    return <EnterpriseChatSkeleton className={className} />;
  }

  const typingLabel = chat.typingUserIds
    .map((id) => participantName(chat.rooms, chat.activeRoomId, id))
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={cx(
        "hamd-chat",
        `hamd-chat--${density}`,
        layout === "solo" && "hamd-chat--solo",
        mobileShowThread && "hamd-chat--thread-open",
        className,
      )}
    >
      <a className="hamd-chat__skip" href="#hamd-chat-thread">
        Skip to conversation
      </a>

      <aside
        className="hamd-chat__rooms"
        aria-label="Conversations"
        data-guide="chat-rooms"
      >
        <header className="hamd-chat__rooms-head">
          <h1 className="hamd-chat__title">{title}</h1>
          <label className="hamd-sr-only" htmlFor={searchId}>
            Search conversations
          </label>
          <div className="hamd-chat__rooms-search">
            <span className="hamd-chat__rooms-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              id={searchId}
              type="search"
              className="hamd-chat-search"
              placeholder="Search people or threads…"
              value={filters.roomQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, roomQuery: e.target.value }))
              }
            />
          </div>
        </header>
        <ul
          className="hamd-chat-room-list"
          role="list"
          aria-label="Conversation list"
        >
          {visibleRooms.map((room) => {
            const active = room.id === chat.activeRoomId;
            const unreadLabel = formatUnreadCount(room.unreadCount);
            const context = chatRoomContextLine(room);
            const timeLabel = formatChatTimestamp(room.updatedAt);
            return (
              <li key={room.id}>
                <button
                  type="button"
                  className={cx("hamd-chat-room", active && "is-active")}
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    chat.setActiveRoomId(room.id);
                    onRoomChange?.(room.id);
                    setMobileShowThread(true);
                    setFilters((prev) => ({ ...prev, messageQuery: "" }));
                  }}
                >
                  <InitialsAvatar name={room.title} size="sm" />
                  <span className="hamd-chat-room__body">
                    <span className="hamd-chat-room__top">
                      <span className="hamd-chat-room__title">{room.title}</span>
                      {unreadLabel ? (
                        <span className="hamd-chat-room__badge">{unreadLabel}</span>
                      ) : null}
                    </span>
                    {context ? (
                      <span className="hamd-chat-room__meta">{context}</span>
                    ) : null}
                    <span className="hamd-chat-room__preview">{room.preview}</span>
                    {timeLabel ? (
                      <span className="hamd-chat-room__time">{timeLabel}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section
        id="hamd-chat-thread"
        className="hamd-chat__thread"
        aria-label="Active conversation"
      >
        {chat.activeRoom ? (
          <>
            <div className="hamd-chat__chrome">
              <header className="hamd-chat__header">
              <button
                type="button"
                className="hamd-chat-back"
                onClick={() => setMobileShowThread(false)}
              >
                Rooms
              </button>
              <div className="hamd-chat__header-main">
                <h2 className="hamd-chat__room-title">{chat.activeRoom.title}</h2>
                <p className="hamd-chat__room-sub">
                  {chatRoomTypeLabel(String(chat.activeRoom.type))}
                  {chat.activeRoom.status ? ` · ${chat.activeRoom.status}` : ""}
                  {chat.activeRoom.recordHref && chat.activeRoom.recordLabel ? (
                    <>
                      {" · "}
                      <a href={chat.activeRoom.recordHref}>
                        {chat.activeRoom.recordLabel}
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
              <label className="hamd-sr-only" htmlFor={messageSearchId}>
                Search messages
              </label>
              <input
                id={messageSearchId}
                type="search"
                className="hamd-chat-search hamd-chat-search--inline"
                placeholder="Search messages…"
                value={filters.messageQuery}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    messageQuery: e.target.value,
                  }))
                }
              />
              {headerActions ? (
                <div className="hamd-chat__header-actions">{headerActions}</div>
              ) : null}
            </header>

            {pins.length > 0 ? (
              <div className="hamd-chat-pins" aria-label="Pinned messages">
                {pins.map((pin) => (
                  <button
                    key={pin.id}
                    type="button"
                    className="hamd-chat-pins__item"
                    onClick={() => {
                      document
                        .getElementById(`msg-${pin.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    <span className="hamd-chat-pins__label">Pinned</span>
                    <span className="hamd-chat-pins__body">
                      {pin.body || pin.attachments?.[0]?.name || "Attachment"}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            </div>

            <div
              ref={listRef}
              className="hamd-chat__messages"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              {visibleMessages.length === 0 ? (
                <p className="hamd-chat-empty" role="status">
                  No messages match this search.
                </p>
              ) : (
                visibleMessages.map((message) => {
                  const mine = message.senderId === currentUserId;
                  const reply = message.replyToId
                    ? chat.roomMessages.find((m) => m.id === message.replyToId)
                    : null;
                  const deleted = Boolean(message.deletedAt);
                  return (
                    <article
                      key={message.id}
                      id={`msg-${message.id}`}
                      className={cx(
                        "hamd-chat-bubble",
                        mine && "is-mine",
                        message.internal && "is-internal",
                        message.pinned && "is-pinned",
                        deleted && "is-deleted",
                      )}
                      data-kind={message.kind}
                      data-delivery={message.delivery}
                    >
                      <header className="hamd-chat-bubble__head">
                        <span className="hamd-chat-bubble__author">
                          {mine
                            ? "You"
                            : participantName(
                                chat.rooms,
                                message.roomId,
                                message.senderId,
                              )}
                        </span>
                        <time dateTime={message.createdAt}>
                          {formatTime(message.createdAt)}
                        </time>
                      </header>
                      {reply ? (
                        <blockquote className="hamd-chat-bubble__reply">
                          {reply.body || reply.attachments?.[0]?.name || "Reply"}
                        </blockquote>
                      ) : null}
                      {deleted ? (
                        <p className="hamd-chat-bubble__deleted">
                          Message deleted
                        </p>
                      ) : message.kind === "text" &&
                        !(message.attachments?.length) ? (
                        <p className="hamd-chat-bubble__text">{message.body}</p>
                      ) : (
                        <MediaBody
                          message={message}
                          onOpenAttachment={openMediaAttachment}
                        />
                      )}
                      <footer className="hamd-chat-bubble__foot">
                        {mine ? (
                          <span
                            className="hamd-chat-receipt"
                            data-delivery={message.delivery}
                            title={deliveryLabel(message.delivery)}
                            aria-label={deliveryLabel(message.delivery)}
                          >
                            <span className="hamd-chat-receipt__label">
                              {message.delivery === "read"
                                ? "Read"
                                : message.delivery === "delivered"
                                  ? "Delivered"
                                  : message.delivery === "sending"
                                    ? "Sending…"
                                    : message.delivery === "failed"
                                      ? "Failed"
                                      : "Sent"}
                            </span>
                            <span className="hamd-chat-receipt__ticks" aria-hidden="true">
                              {message.delivery === "read" ||
                              message.delivery === "delivered" ? (
                                <>
                                  <ReceiptTick />
                                  <ReceiptTick />
                                </>
                              ) : message.delivery === "failed" ? null : (
                                <ReceiptTick />
                              )}
                            </span>
                          </span>
                        ) : null}
                        {!deleted ? (
                          <div className="hamd-chat-bubble__actions">
                            <button
                              type="button"
                              className="hamd-chat-icon"
                              aria-expanded={actionsFor === message.id}
                              aria-label={`Actions for message ${message.id}`}
                              onClick={() =>
                                setActionsFor((id) =>
                                  id === message.id ? null : message.id,
                                )
                              }
                            >
                              ···
                            </button>
                            {actionsFor === message.id ? (
                              <div
                                className="hamd-chat-menu"
                                role="menu"
                                aria-label="Message actions"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    chat.setReply(message.id);
                                    setActionsFor(null);
                                  }}
                                >
                                  Reply
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    void navigator.clipboard?.writeText(
                                      message.body,
                                    );
                                    setActionsFor(null);
                                  }}
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    void chat.togglePin(message.id);
                                    setActionsFor(null);
                                  }}
                                >
                                  {message.pinned ? "Unpin" : "Pin"}
                                </button>
                                {mine ? (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="is-danger"
                                    onClick={() => {
                                      void chat.deleteMessage(message.id);
                                      setActionsFor(null);
                                    }}
                                  >
                                    Delete
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </footer>
                    </article>
                  );
                })
              )}
              {typingLabel ? (
                <p className="hamd-chat-typing" role="status" aria-live="polite">
                  {typingLabel} is typing…
                </p>
              ) : null}
            </div>

            <footer className="hamd-chat__composer">
              {chat.draft.replyToId ? (
                <div className="hamd-chat-reply-bar">
                  <span>
                    Replying to{" "}
                    {chat.roomMessages.find((m) => m.id === chat.draft.replyToId)
                      ?.body || "message"}
                  </span>
                  <button
                    type="button"
                    onClick={() => chat.setReply(null)}
                    aria-label="Cancel reply"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              {chat.draft.attachments.length > 0 ? (
                <div className="hamd-chat-draft-atts" aria-label="Attachments">
                  {chat.draft.attachments.map((att) => (
                    <AttachmentChip
                      key={att.id}
                      attachment={att}
                      onRemove={() => chat.removeAttachment(att.id)}
                    />
                  ))}
                </div>
              ) : null}
              <div className="hamd-chat-composer-row">
                <input
                  id={fileInputId}
                  type="file"
                  className="hamd-sr-only"
                  multiple
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      void chat.addAttachments(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
                <div className="hamd-chat-composer-tools">
                  <label
                    htmlFor={fileInputId}
                    className="hamd-chat-tool hamd-chat-tool--attach"
                    aria-label="Attach files"
                    title="Attach files"
                  >
                    <ComposerAttachIcon />
                  </label>
                  <button
                    type="button"
                    className="hamd-chat-tool hamd-chat-tool--emoji"
                    aria-label="Insert emoji"
                    aria-expanded={emojiOpen}
                    title="Insert emoji"
                    onClick={() => setEmojiOpen((open) => !open)}
                  >
                    <ComposerEmojiIcon />
                  </button>
                  <ChatEmojiPicker
                    open={emojiOpen}
                    onClose={() => setEmojiOpen(false)}
                    onSelect={(emoji) => {
                      chat.onComposerChange(`${chat.draft.body}${emoji}`);
                      setEmojiOpen(false);
                    }}
                  />
                </div>
                <div className="hamd-chat-composer-field">
                  <label className="hamd-sr-only" htmlFor={`${fileInputId}-body`}>
                    Message
                  </label>
                  <textarea
                    id={`${fileInputId}-body`}
                    rows={density === "compact" ? 1 : 2}
                    value={chat.draft.body}
                    placeholder="Write a message…"
                    onChange={(e) => chat.onComposerChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void chat.send();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="hamd-chat-send"
                  aria-label="Send"
                  onClick={() => void chat.send()}
                  disabled={
                    !chat.draft.body.trim() &&
                    chat.draft.attachments.length === 0
                  }
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M5 12h12M13 6l6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="hamd-sr-only">Send</span>
                </button>
              </div>
              {chat.error ? (
                <p className="hamd-chat-error" role="alert">
                  {chat.error}
                </p>
              ) : null}
            </footer>
          </>
        ) : (
          <p className="hamd-chat-empty" role="status">
            Select a conversation to begin.
          </p>
        )}
      </section>

      <div className="hamd-sr-only" role="status" aria-live="polite">
        {chat.announce}
      </div>
      <MediaLightbox
        open={Boolean(lightbox)}
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
        onIndexChange={(next) =>
          setLightbox((current) =>
            current ? { ...current, index: next } : current,
          )
        }
      />
    </div>
  );
}

export type { ChatRealtimeEvent };
