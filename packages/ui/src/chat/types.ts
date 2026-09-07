/** Enterprise chat contracts - record-centric rooms (docs/17). Hosts map API payloads. */

export const CHAT_ROOM_TYPES = [
  "request",
  "rfq",
  "quote",
  "order",
  "shipment",
  "support",
  "internal",
  "organization",
] as const;

export type ChatRoomType = (typeof CHAT_ROOM_TYPES)[number];

export const CHAT_MESSAGE_KINDS = [
  "text",
  "image",
  "file",
  "audio",
  "video",
  "system",
] as const;

export type ChatMessageKind = (typeof CHAT_MESSAGE_KINDS)[number];

export type ChatDeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type ChatPresence = "online" | "away" | "offline";

export type ChatParticipant = {
  id: string;
  displayName: string;
  role?: string | undefined;
  avatarUrl?: string | null | undefined;
  presence?: ChatPresence | undefined;
};

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url?: string | null | undefined;
  /** Local object URL while uploading. */
  previewUrl?: string | null | undefined;
  kind: "image" | "file" | "audio" | "video";
  /** Original file kept until the host uploads it. */
  file?: File | undefined;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  kind: ChatMessageKind;
  body: string;
  createdAt: string;
  editedAt?: string | null | undefined;
  deletedAt?: string | null | undefined;
  delivery: ChatDeliveryStatus;
  attachments?: ChatAttachment[] | undefined;
  replyToId?: string | null | undefined;
  pinned?: boolean | undefined;
  pinnedAt?: string | null | undefined;
  pinnedById?: string | null | undefined;
  /** Internal note - visually distinct; never expose externally. */
  internal?: boolean | undefined;
  metadata?: Record<string, unknown> | undefined;
};

export type ChatRoom = {
  id: string;
  type: ChatRoomType | string;
  title: string;
  subtitle?: string | undefined;
  recordLabel?: string | undefined;
  recordHref?: string | undefined;
  status?: string | undefined;
  unreadCount: number;
  updatedAt: string;
  preview: string;
  participants: ChatParticipant[];
  pinnedMessageIds?: string[] | undefined;
};

export type ChatComposerDraft = {
  body: string;
  attachments: ChatAttachment[];
  replyToId: string | null;
};

export type ChatFilterState = {
  roomQuery: string;
  messageQuery: string;
};

export const emptyChatFilters = (): ChatFilterState => ({
  roomQuery: "",
  messageQuery: "",
});

export function emptyComposerDraft(): ChatComposerDraft {
  return { body: "", attachments: [], replyToId: null };
}

export function chatRoomTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    request: "Procurement request",
    rfq: "RFQ",
    quote: "Quotation",
    order: "Purchase order",
    shipment: "Shipment",
    support: "Chat",
    internal: "Internal ops",
    organization: "Organization",
  };
  return labels[type] ?? type;
}

export function formatUnreadCount(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

export function formatChatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function chatRoomContextLine(room: ChatRoom): string | null {
  const label = room.recordLabel?.trim();
  if (!label) return null;
  const typeLabel = chatRoomTypeLabel(String(room.type));
  if (label.toLowerCase() === typeLabel.toLowerCase()) return null;
  if (label.toLowerCase() === room.title.trim().toLowerCase()) return null;
  if (String(room.type) === "support" && /^support$/i.test(label)) return null;
  return label;
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function inferAttachmentKind(mimeType: string): ChatAttachment["kind"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}

export function filterRooms(rooms: ChatRoom[], query: string): ChatRoom[] {
  const q = query.trim().toLowerCase();
  if (!q) return rooms;
  return rooms.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.preview.toLowerCase().includes(q) ||
      (r.recordLabel?.toLowerCase().includes(q) ?? false) ||
      chatRoomTypeLabel(String(r.type)).toLowerCase().includes(q),
  );
}

export function filterMessages(
  messages: ChatMessage[],
  query: string,
): ChatMessage[] {
  const q = query.trim().toLowerCase();
  if (!q) return messages.filter((m) => !m.deletedAt);
  return messages.filter((m) => {
    if (m.deletedAt) return false;
    if (m.body.toLowerCase().includes(q)) return true;
    return Boolean(
      m.attachments?.some((a) => a.name.toLowerCase().includes(q)),
    );
  });
}

export function pinnedMessages(
  messages: ChatMessage[],
  pinnedIds?: string[] | undefined,
): ChatMessage[] {
  const idSet = new Set(
    pinnedIds?.length
      ? pinnedIds
      : messages.filter((m) => m.pinned).map((m) => m.id),
  );
  return messages.filter((m) => idSet.has(m.id) && !m.deletedAt);
}

export function deliveryLabel(status: ChatDeliveryStatus): string {
  switch (status) {
    case "sending":
      return "Sending";
    case "sent":
      return "Sent";
    case "delivered":
      return "Delivered";
    case "read":
      return "Read";
    case "failed":
      return "Failed";
  }
}

export type ChatWirePayload = {
  v: 1;
  text: string;
  attachments?: ChatAttachment[] | undefined;
};

export function encodeChatMessageBody(
  text: string,
  attachments: ChatAttachment[] = [],
): string {
  if (attachments.length === 0) return text;
  const safe = attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    url: attachment.url ?? null,
    kind: attachment.kind,
  }));
  return JSON.stringify({ v: 1, text, attachments: safe } satisfies ChatWirePayload);
}

export function decodeChatMessageBody(body: string): {
  text: string;
  attachments: ChatAttachment[];
} {
  const trimmed = body.trim();
  if (!trimmed.startsWith("{")) return { text: body, attachments: [] };
  try {
    const parsed = JSON.parse(trimmed) as ChatWirePayload;
    if (parsed?.v === 1 && typeof parsed.text === "string") {
      return {
        text: parsed.text,
        attachments: (parsed.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          url: attachment.url,
          kind: attachment.kind,
        })),
      };
    }
  } catch {
    /* plain text */
  }
  return { text: body, attachments: [] };
}

/** Normalize legacy snake_case chat row into ChatMessage (preserve working fields). */
export function normalizeLegacyMessage(
  row: Record<string, unknown>,
  roomId: string,
  currentUserId: string,
): ChatMessage {
  const id = String(row.id ?? "");
  const senderId = String(row.sender_id ?? row.senderId ?? "");
  const rawType = String(row.message_type ?? row.type ?? "text");
  const kind: ChatMessageKind =
    rawType === "image" ||
    rawType === "file" ||
    rawType === "audio" ||
    rawType === "video" ||
    rawType === "system"
      ? rawType
      : "text";
  const fileUrl =
    (row.file_url as string | null | undefined) ??
    (row.attachmentUrl as string | null | undefined) ??
    null;
  const isRead = Boolean(row.is_read ?? row.isRead ?? row.read_at ?? row.readAt);
  const mine = senderId === currentUserId;
  const attachments: ChatAttachment[] | undefined = fileUrl
    ? [
        {
          id: `${id}-att`,
          name: String(row.attachmentName ?? "Attachment"),
          mimeType:
            kind === "image"
              ? "image/*"
              : kind === "video"
                ? "video/*"
                : kind === "audio"
                  ? "audio/*"
                  : "application/octet-stream",
          sizeBytes: 0,
          url: fileUrl,
          kind:
            kind === "image" || kind === "video" || kind === "audio"
              ? kind
              : "file",
        },
      ]
    : undefined;

  return {
    id,
    roomId,
    senderId,
    kind,
    body: String(row.message ?? row.content ?? ""),
    createdAt: String(
      row.created_at ?? row.createdAt ?? new Date().toISOString(),
    ),
    delivery: mine ? (isRead ? "read" : "delivered") : "delivered",
    ...(attachments ? { attachments } : {}),
    ...(row.form_data ? { metadata: { form: row.form_data } } : {}),
  };
}
