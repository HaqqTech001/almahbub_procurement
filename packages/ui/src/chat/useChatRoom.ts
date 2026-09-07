import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatAttachment,
  ChatComposerDraft,
  ChatMessage,
  ChatRoom,
} from "./types.js";
import { emptyComposerDraft } from "./types.js";

export type ChatRealtimeEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "message_updated"; message: ChatMessage }
  | { type: "message_removed"; id: string }
  | { type: "typing"; roomId: string; userId: string; active: boolean }
  | { type: "read"; roomId: string; userId: string; readAt: string }
  | { type: "rooms"; rooms: ChatRoom[] };

export type ChatRoomHandlers = {
  onSend?: (
    draft: ChatComposerDraft,
    roomId: string,
  ) => void | Promise<ChatMessage | void>;
  onMarkRead?: (roomId: string, messageIds: string[]) => void | Promise<void>;
  onTyping?: (roomId: string, active: boolean) => void;
  onPin?: (messageId: string, pinned: boolean) => void | Promise<void>;
  onDelete?: (messageId: string) => void | Promise<void>;
  onAttachFiles?: (files: FileList | File[]) => Promise<ChatAttachment[]>;
  /**
   * Open a message attachment with host auth (Bearer fetch → blob).
   * Required for private `/api/v1/documents/:id` URLs: a raw `<a href>` will 401.
   */
  onOpenAttachment?: (attachment: ChatAttachment) => void | Promise<void>;
  subscribe?: (handler: (event: ChatRealtimeEvent) => void) => () => void;
};

export function useChatRealtime(
  subscribe?:
    | ((handler: (event: ChatRealtimeEvent) => void) => () => void)
    | undefined,
  onEvent?: ((event: ChatRealtimeEvent) => void) | undefined,
) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  useEffect(() => {
    if (!subscribe) return;
    return subscribe((event) => handlerRef.current?.(event));
  }, [subscribe]);
}

/**
 * Presentational room state - optimistic send / pin / delete / typing.
 * Hosts inject persistence + realtime.
 */
export function useChatRoom(
  initialRooms: ChatRoom[],
  initialMessages: ChatMessage[],
  options?: ChatRoomHandlers & {
    activeRoomId?: string | undefined;
    currentUserId: string;
  },
) {
  const currentUserId = options?.currentUserId ?? "self";
  const [rooms, setRooms] = useState(initialRooms);
  const [messages, setMessages] = useState(initialMessages);
  const [activeRoomId, setActiveRoomId] = useState(
    options?.activeRoomId ?? initialRooms[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<ChatComposerDraft>(emptyComposerDraft());
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActive = useRef(false);

  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (options?.activeRoomId) setActiveRoomId(options.activeRoomId);
  }, [options?.activeRoomId]);

  useChatRealtime(options?.subscribe, (event) => {
    if (event.type === "rooms") {
      setRooms(event.rooms);
      return;
    }
    if (event.type === "message") {
      setMessages((prev) => {
        if (prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
      setAnnounce(`New message from room ${event.message.roomId}`);
      return;
    }
    if (event.type === "message_updated") {
      setMessages((prev) =>
        prev.map((m) => (m.id === event.message.id ? event.message : m)),
      );
      return;
    }
    if (event.type === "message_removed") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === event.id
            ? { ...m, deletedAt: new Date().toISOString(), body: "" }
            : m,
        ),
      );
      return;
    }
    if (event.type === "typing") {
      if (event.roomId !== activeRoomId) return;
      setTypingUserIds((prev) => {
        if (event.active) {
          return prev.includes(event.userId) ? prev : [...prev, event.userId];
        }
        return prev.filter((id) => id !== event.userId);
      });
      return;
    }
    if (event.type === "read" && event.roomId === activeRoomId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === currentUserId &&
          m.delivery !== "read" &&
          m.delivery !== "failed"
            ? { ...m, delivery: "read" as const }
            : m,
        ),
      );
    }
  });

  const roomMessages = useMemo(
    () => messages.filter((m) => m.roomId === activeRoomId),
    [messages, activeRoomId],
  );

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  const emitTyping = useCallback(
    (active: boolean) => {
      if (!activeRoomId) return;
      if (typingActive.current === active) return;
      typingActive.current = active;
      options?.onTyping?.(activeRoomId, active);
    },
    [activeRoomId, options],
  );

  const onComposerChange = useCallback(
    (body: string) => {
      setDraft((prev) => ({ ...prev, body }));
      if (!body.trim()) {
        emitTyping(false);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        return;
      }
      emitTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => emitTyping(false), 1_800);
    },
    [emitTyping],
  );

  const addAttachments = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      try {
        let next: ChatAttachment[];
        if (options?.onAttachFiles) {
          next = await options.onAttachFiles(files);
        } else {
          const list = Array.from(files);
          next = list.map((file, i) => {
            const kind = file.type.startsWith("image/")
              ? ("image" as const)
              : file.type.startsWith("audio/")
                ? ("audio" as const)
                : file.type.startsWith("video/")
                  ? ("video" as const)
                  : ("file" as const);
            return {
              id: `local-${Date.now()}-${i}`,
              name: file.name,
              mimeType: file.type || "application/octet-stream",
              sizeBytes: file.size,
              previewUrl: kind === "image" ? URL.createObjectURL(file) : null,
              kind,
              file,
            };
          });
        }
        setDraft((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...next],
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Attachment failed.");
      }
    },
    [options],
  );

  const removeAttachment = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));
  }, []);

  const setReply = useCallback((messageId: string | null) => {
    setDraft((prev) => ({ ...prev, replyToId: messageId }));
  }, []);

  const send = useCallback(async () => {
    if (!activeRoomId) return;
    if (!draft.body.trim() && draft.attachments.length === 0) return;
    const snapshot = draft;
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      roomId: activeRoomId,
      senderId: currentUserId,
      kind: snapshot.attachments[0]?.kind === "image"
        ? "image"
        : snapshot.attachments[0]?.kind === "audio"
          ? "audio"
          : snapshot.attachments[0]?.kind === "video"
            ? "video"
            : snapshot.attachments.length
              ? "file"
              : "text",
      body: snapshot.body.trim(),
      createdAt: new Date().toISOString(),
      delivery: "sending",
      ...(snapshot.attachments.length
        ? { attachments: snapshot.attachments }
        : {}),
      ...(snapshot.replyToId ? { replyToId: snapshot.replyToId } : {}),
    };
    setDraft(emptyComposerDraft());
    emitTyping(false);
    setMessages((prev) => [...prev, optimistic]);
    setAnnounce("Message sent");
    try {
      const result = await options?.onSend?.(snapshot, activeRoomId);
      if (result) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? result : m)),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, delivery: "sent" as const } : m,
          ),
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, delivery: "failed" as const } : m,
        ),
      );
      setError(err instanceof Error ? err.message : "Send failed.");
    }
  }, [activeRoomId, currentUserId, draft, emitTyping, options]);

  const markVisibleRead = useCallback(async () => {
    if (!activeRoomId) return;
    const unread = roomMessages
      .filter((m) => m.senderId !== currentUserId && m.delivery !== "read")
      .map((m) => m.id);
    if (!unread.length) return;
    setMessages((prev) =>
      prev.map((m) =>
        unread.includes(m.id) ? { ...m, delivery: "read" as const } : m,
      ),
    );
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoomId ? { ...r, unreadCount: 0 } : r,
      ),
    );
    try {
      await options?.onMarkRead?.(activeRoomId, unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mark read failed.");
    }
  }, [activeRoomId, currentUserId, options, roomMessages]);

  const togglePin = useCallback(
    async (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      const nextPinned = !target.pinned;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                pinned: nextPinned,
                pinnedAt: nextPinned ? new Date().toISOString() : null,
                pinnedById: nextPinned ? currentUserId : null,
              }
            : m,
        ),
      );
      setAnnounce(nextPinned ? "Message pinned" : "Message unpinned");
      try {
        await options?.onPin?.(messageId, nextPinned);
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? target : m)),
        );
        setError(err instanceof Error ? err.message : "Pin failed.");
      }
    },
    [currentUserId, messages, options],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, deletedAt: new Date().toISOString(), body: "" }
            : m,
        ),
      );
      setAnnounce("Message deleted");
      try {
        await options?.onDelete?.(messageId);
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? target : m)),
        );
        setError(err instanceof Error ? err.message : "Delete failed.");
      }
    },
    [messages, options],
  );

  return {
    rooms,
    setRooms,
    messages,
    roomMessages,
    activeRoomId,
    setActiveRoomId,
    activeRoom,
    draft,
    setDraft,
    typingUserIds,
    error,
    announce,
    onComposerChange,
    addAttachments,
    removeAttachment,
    setReply,
    send,
    markVisibleRead,
    togglePin,
    deleteMessage,
    currentUserId,
  };
}
