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

import { openProcurementAttachment } from "../api/procurement-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsPage } from "../components/OpsChrome.js";
import { opsApiUrl, opsFetch } from "../lib/ops-fetch.js";

type ThreadSummary = {
  id: string;
  subject: string;
  status: string;
  requesterId?: string;
  requesterEmail: string;
  requesterName: string;
  messageCount: number;
  unreadCount?: number;
  lastMessage: { body: string; createdAt: string } | null;
  updatedAt: string;
};

type ThreadDetail = {
  id: string;
  subject: string;
  status: string;
  requesterId?: string;
  requesterEmail: string;
  requesterName: string;
  messages: Array<{
    id: string;
    authorId?: string;
    body: string;
    fromOps: boolean;
    createdAt: string;
  }>;
};

function previewText(body: string | undefined): string {
  if (!body) return "No messages yet";
  const decoded = decodeChatMessageBody(body);
  return decoded.text || decoded.attachments[0]?.name || "Attachment";
}

function toChatMessage(
  row: ThreadDetail["messages"][number],
  roomId: string,
  currentUserId: string,
  requesterId?: string,
): ChatMessage {
  const decoded = decodeChatMessageBody(row.body);
  const senderId =
    row.authorId ??
    (row.fromOps ? currentUserId : requesterId ?? "buyer");
  return {
    id: row.id,
    roomId,
    senderId,
    kind: decoded.attachments[0]?.kind === "image"
      ? "image"
      : decoded.attachments.length
        ? "file"
        : "text",
    body: decoded.text,
    createdAt: row.createdAt,
    delivery: "sent",
    ...(decoded.attachments.length ? { attachments: decoded.attachments } : {}),
  };
}

async function uploadOpsFiles(
  accessToken: string,
  files: File[],
): Promise<ChatAttachment[]> {
  if (!files.length) return [];
  const form = new FormData();
  for (const file of files.slice(0, 5)) form.append("files", file, file.name);
  const response = await fetch(opsApiUrl("/documents"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
    credentials: "include",
  });
  const payload = (await response.json()) as {
    data?: Array<{ id: string; name: string; href: string; kind: string }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Unable to upload files.");
  }
  return (payload.data ?? []).map((document) => ({
    id: document.id,
    name: document.name,
    mimeType: document.kind === "image" ? "image/jpeg" : "application/octet-stream",
    sizeBytes: 0,
    url: document.href,
    kind: inferAttachmentKind(
      document.kind === "image" ? "image/jpeg" : "application/octet-stream",
    ),
  }));
}

function documentFetchUrl(href: string | null | undefined, documentId: string): string {
  if (href?.startsWith("http")) return href;
  return opsApiUrl(`/documents/${documentId}`);
}

function canonicalAttachmentUrl(
  attachment: ChatAttachment,
  fallbackDocumentId?: string,
): string | null {
  const href = attachment.url;
  if (href && !href.startsWith("blob:") && !href.startsWith("data:")) {
    return href;
  }
  const documentId =
    fallbackDocumentId ?? attachment.id ?? href?.split("/").filter(Boolean).pop();
  if (!documentId) return null;
  return `/api/v1/documents/${documentId}`;
}

async function hydrateChatAttachments(
  accessToken: string,
  attachments: ChatAttachment[],
  cache: Map<string, string>,
): Promise<ChatAttachment[]> {
  return Promise.all(
    attachments.map(async (attachment) => {
      const href = attachment.url;
      if (!href || href.startsWith("blob:") || href.startsWith("data:")) {
        return attachment;
      }
      const documentId =
        attachment.id || href.split("/").filter(Boolean).pop() || "";
      if (!documentId) return attachment;
      const cached = cache.get(documentId);
      if (cached) {
        return {
          ...attachment,
          previewUrl: attachment.kind === "image" ? cached : attachment.previewUrl,
        };
      }
      try {
        const response = await fetch(documentFetchUrl(href, documentId), {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        });
        if (!response.ok) return attachment;
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        cache.set(documentId, objectUrl);
        return {
          ...attachment,
          previewUrl:
            attachment.kind === "image" ? objectUrl : attachment.previewUrl,
        };
      } catch {
        return attachment;
      }
    }),
  );
}

/**
 * Ops chat inbox for live support threads.
 */
export function SupportPage() {
  const auth = useAuth();
  const currentUserId = auth.user?.id ?? "ops";
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const blobCache = useRef(new Map<string, string>());

  const refreshThreads = useCallback(async () => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in required.");
    const rows = await opsFetch<ThreadSummary[]>("/support/threads", {
      accessToken: token,
    });
    setThreads(rows);
    return rows;
  }, [auth]);

  const openThread = useCallback(
    async (threadId: string) => {
      const token = getAccessToken() ?? (await auth.ensureSession());
      if (!token) throw new Error("Sign in required.");
      const next = await opsFetch<ThreadDetail>(`/support/threads/${threadId}`, {
        accessToken: token,
      });
      setSelectedId(threadId);
      const mapped = await Promise.all(
        next.messages.map(async (row) => {
          const message = toChatMessage(
            row,
            next.id,
            currentUserId,
            next.requesterId,
          );
          if (!message.attachments?.length) return message;
          return {
            ...message,
            attachments: await hydrateChatAttachments(
              token,
              message.attachments,
              blobCache.current,
            ),
          };
        }),
      );
      setMessages(mapped);
    },
    [auth, currentUserId],
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await refreshThreads();
        if (rows[0]) await openThread(rows[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load threads.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshThreads, openThread]);

  const rooms: ChatRoom[] = useMemo(
    () =>
      threads.map((thread) => ({
        id: thread.id,
        type: "support",
        title: thread.requesterName || thread.requesterEmail || "Buyer",
        status: thread.status,
        unreadCount: thread.unreadCount ?? 0,
        updatedAt: thread.updatedAt,
        preview: previewText(thread.lastMessage?.body),
        participants: [
          { id: currentUserId, displayName: "Ops" },
          {
            id: thread.requesterId ?? thread.requesterEmail,
            displayName: thread.requesterName || thread.requesterEmail,
          },
        ],
      })),
    [currentUserId, threads],
  );

  const onSend = async (draft: ChatComposerDraft, roomId: string) => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in required.");
    const files = draft.attachments
      .map((attachment) => attachment.file)
      .filter((file): file is File => Boolean(file));
    const uploaded = await uploadOpsFiles(token, files);
    const leftover = draft.attachments.filter((attachment) => !attachment.file);
    const body = encodeChatMessageBody(draft.body.trim(), [
      ...uploaded,
      ...leftover,
    ]);
    if (!body.trim()) throw new Error("Write a message or attach a file.");
    await opsFetch("/support/reply", {
      method: "POST",
      accessToken: token,
      body: { threadId: roomId, body },
    });
    await openThread(roomId);
    await refreshThreads();
  };

  const onOpenAttachment = async (attachment: ChatAttachment) => {
    const href = attachment.previewUrl || attachment.url;
    if (href?.startsWith("blob:") || href?.startsWith("data:")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) {
      setError("Sign in required to open attachments.");
      return;
    }
    const documentHref = canonicalAttachmentUrl(attachment);
    if (!documentHref) {
      setError("This attachment is no longer available.");
      return;
    }
    try {
      await openProcurementAttachment(token, documentHref);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to open attachment.",
      );
    }
  };

  return (
    <OpsPage className="hamd-ops-support">
      <EnterpriseChat
        className="hamd-ops-support__chat"
        title="Chat"
        layout="inbox"
        defaultThreadOpen
        density="comfortable"
        loading={loading}
        rooms={rooms}
        messages={messages}
        currentUserId={currentUserId}
        activeRoomId={selectedId ?? undefined}
        onRoomChange={(roomId) => void openThread(roomId)}
        onSend={onSend}
        onOpenAttachment={(attachment) => void onOpenAttachment(attachment)}
      />
      {error ? (
        <p className="hamd-ops-alert hamd-ops-alert--danger" role="alert">
          {error}
        </p>
      ) : null}
    </OpsPage>
  );
}
