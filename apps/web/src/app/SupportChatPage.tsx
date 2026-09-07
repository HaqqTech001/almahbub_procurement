import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EnterpriseChat,
  decodeChatMessageBody,
  encodeChatMessageBody,
  inferAttachmentKind,
  type ChatAttachment,
  type ChatComposerDraft,
  type ChatMessage,
  type ChatRoom,
} from "@hamd/ui/chat";

import {
  autoRespond,
  getSupportThread,
  sendSupportMessage,
  type SupportMessageRow,
  type SupportThreadPayload,
} from "../api/parity-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { browserApiBase } from "../lib/api-origin.js";
import { getAccessToken } from "../auth/session/token-store.js";
import {
  downloadProcurementDocument,
  uploadProcurementFiles,
} from "../procurement/procurement-api.js";
import { useToast } from "./providers/ToastProvider.js";
import { HostPage } from "../components/HostChrome.js";

function documentsUrl(): string {
  const base = browserApiBase();
  return base ? `${base}/api/v1/documents` : "/api/v1/documents";
}

function canonicalDocumentId(attachment: ChatAttachment): string | null {
  if (attachment.id) return attachment.id;
  const href = attachment.url;
  if (!href || href.startsWith("blob:") || href.startsWith("data:")) return null;
  return href.split("/").filter(Boolean).pop() || null;
}

function toChatMessage(
  row: SupportMessageRow,
  roomId: string,
  currentUserId: string,
): ChatMessage {
  const decoded = decodeChatMessageBody(row.body);
  const attachments = decoded.attachments;
  const kind =
    attachments[0]?.kind === "image"
      ? "image"
      : attachments.length
        ? "file"
        : "text";
  return {
    id: row.id,
    roomId,
    senderId: row.authorId,
    kind,
    body: decoded.text,
    createdAt: row.createdAt,
    delivery:
      row.authorId === currentUserId
        ? row.readAt
          ? "read"
          : "sent"
        : "delivered",
    ...(attachments.length ? { attachments } : {}),
  };
}

async function hydrateAttachments(
  accessToken: string,
  attachments: ChatAttachment[],
  cache: Map<string, string>,
): Promise<ChatAttachment[]> {
  return Promise.all(
    attachments.map(async (attachment) => {
      const documentId = canonicalDocumentId(attachment);
      if (!documentId || attachment.kind !== "image") return attachment;
      const cached = cache.get(documentId);
      if (cached) return { ...attachment, previewUrl: cached };
      try {
        const response = await fetch(`${documentsUrl()}/${documentId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        });
        if (!response.ok) return attachment;
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        cache.set(documentId, objectUrl);
        return { ...attachment, previewUrl: objectUrl };
      } catch {
        return attachment;
      }
    }),
  );
}

/**
 * Buyer support chat - live thread with files, emoji, and polling.
 */
export function SupportChatPage() {
  const auth = useAuth();
  const { push: pushToast } = useToast();
  const currentUserId = auth.user?.id ?? "self";
  const blobCache = useRef(new Map<string, string>());
  const [thread, setThread] = useState<SupportThreadPayload | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) return;
    const next = await getSupportThread(token);
    setThread(next);
    const mapped = await Promise.all(
      next.messages.map(async (row) => {
        const message = toChatMessage(row, next.id, currentUserId);
        if (!message.attachments?.length) return message;
        return {
          ...message,
          attachments: await hydrateAttachments(
            token,
            message.attachments,
            blobCache.current,
          ),
        };
      }),
    );
    setMessages(mapped);
  }, [auth, currentUserId]);

  useEffect(() => {
    void refresh()
      .catch((err) => {
        setThread(null);
        setMessages([]);
        pushToast({
          title: "Unable to load chat",
          description: err instanceof Error ? err.message : undefined,
          tone: "danger",
        });
      })
      .finally(() => setLoading(false));
    const timer = window.setInterval(() => {
      void refresh().catch(() => {
        /* keep last good state */
      });
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [refresh, pushToast]);

  const rooms: ChatRoom[] = useMemo(() => {
    if (!thread) return [];
    const last = messages.at(-1);
    return [
      {
        id: thread.id,
        type: "support",
        title: thread.subject && thread.subject !== "Support" ? thread.subject : "Chat",
        subtitle: thread.status,
        status: thread.status,
        unreadCount: 0,
        updatedAt: thread.updatedAt,
        preview: last?.body || last?.attachments?.[0]?.name || "No messages yet",
        participants: [
          {
            id: currentUserId,
            displayName: auth.user?.displayName || auth.user?.email || "You",
          },
          { id: "ops", displayName: "Almahbub ops" },
        ],
      },
    ];
  }, [auth.user, currentUserId, messages, thread]);

  const onSend = async (draft: ChatComposerDraft, roomId: string) => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in again to send messages.");
    const files = draft.attachments
      .map((attachment) => attachment.file)
      .filter((file): file is File => Boolean(file));
    const uploaded = files.length
      ? await uploadProcurementFiles(token, files)
      : [];
    const attachments: ChatAttachment[] = uploaded.map((document) => ({
      id: document.id,
      name: document.name,
      mimeType:
        document.kind === "image"
          ? "image/*"
          : "application/octet-stream",
      sizeBytes: 0,
      url: document.href.startsWith("http")
        ? document.href
        : `/api/v1/documents/${document.id}`,
      kind: inferAttachmentKind(
        document.kind === "image" ? "image/jpeg" : "application/octet-stream",
      ),
    }));
    const leftover = draft.attachments.filter((attachment) => !attachment.file);
    const allAttachments = [...attachments, ...leftover];
    const body = encodeChatMessageBody(draft.body.trim(), allAttachments);
    if (!body.trim()) throw new Error("Write a message or attach a file.");
    const saved = await sendSupportMessage(token, body);
    const mapped = toChatMessage(saved, roomId, currentUserId);
    if (mapped.attachments?.length) {
      mapped.attachments = await hydrateAttachments(
        token,
        mapped.attachments,
        blobCache.current,
      );
    }
    await refresh();
    return mapped;
  };

  const onAutoRespond = async () => {
    const last = messages.at(-1)?.body;
    if (!last) {
      pushToast({
        title: "Ask a question first",
        description: "Send a message, then request an AI suggestion.",
        tone: "warning",
      });
      return;
    }
    try {
      const token = getAccessToken() ?? (await auth.ensureSession());
      if (!token) throw new Error("Sign in again to use AI assist.");
      const result = await autoRespond(token, last);
      pushToast({
        title: result.matched ? "AI suggestion" : "No matching article",
        description: result.reply,
        tone: result.matched ? "info" : "warning",
      });
    } catch (err) {
      pushToast({
        title: "AI assist failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "danger",
      });
    }
  };

  return (
    <HostPage className="hamd-support-chat">
      <EnterpriseChat
        className="hamd-support-chat__frame"
        title={
          thread?.subject && thread.subject !== "Support" ? thread.subject : "Chat"
        }
        layout="solo"
        defaultThreadOpen
        loading={loading}
        rooms={rooms}
        messages={messages}
        currentUserId={currentUserId}
        activeRoomId={thread?.id}
        headerActions={
          <button
            type="button"
            className="hamd-btn hamd-btn--secondary hamd-chat-ai-btn"
            onClick={() => void onAutoRespond()}
          >
            AI suggestion
          </button>
        }
        onSend={onSend}
        onOpenAttachment={async (attachment) => {
          const href = attachment.previewUrl || attachment.url;
          if (href?.startsWith("blob:") || href?.startsWith("data:")) {
            window.open(href, "_blank", "noopener,noreferrer");
            return;
          }
          const token = getAccessToken() ?? (await auth.ensureSession());
          if (!token) {
            pushToast({
              title: "Sign in again",
              description: "Open attachments after signing in.",
              tone: "warning",
            });
            return;
          }
          const documentId = canonicalDocumentId(attachment);
          if (!documentId) return;
          try {
            await downloadProcurementDocument(token, documentId, attachment.name);
          } catch (err) {
            pushToast({
              title: "Unable to open attachment",
              description: err instanceof Error ? err.message : undefined,
              tone: "danger",
            });
          }
        }}
      />
    </HostPage>
  );
}
