# Enterprise Chat

**Package:** `@hamd/ui/chat` (+ `@hamd/ui/chat.css`)  
**Rule:** Presentational, record-centric rooms. Hosts wire messaging API + realtime.

## Audit

| Asset | Decision | Notes |
| --- | --- | --- |
| Record-centric collaboration (`docs/17`) | **KEEP** | Rooms tied to PR / RFQ / quote / order / shipment / support |
| Working send / history / attachment / emoji / typing / read UX | **KEEP** (behavior) | Preserve via typed contracts + `normalizeLegacyMessage` |
| Genesis notifications domain | **KEEP** | Separate; chat may emit notifications |
| Dashboard `MessagesWidget` shell | **KEEP** | Wire to rooms when host lands |
| Legacy `backend/routes/chat.js` + `socket/chat.js` | **REPLACE** (migrate) | Flat DMs, dual `is_read`/`read_at`, upload bugs |
| Client/admin `ChatPage` + stores + SocketContext | **REPLACE** UI | Monolithic / duplicated - rebuild here |
| `EmojiPicker` / `RichInput` / `FileUpload` | **REFACTOR** | Affordances absorbed into `@hamd/ui/chat` |
| `ChatPage1.tsx` | **REPLACE** / delete | Unrouted dead code |
| Genesis `apps/api` chat module | **REPLACE (build new)** | Not shipped yet - UI ready ahead of API |

## Features shipped in UI

| Feature | Implementation |
| --- | --- |
| Typing | Composer debounce + `onTyping` + realtime `typing` events |
| Read receipts | `delivery`: sending → sent → delivered → read |
| Attachments | Multi-file composer chips + `onAttachFiles` |
| Images | Inline preview |
| Files | Download link + size |
| Audio / video | Accessible placeholders until signed media is wired |
| Emoji | Compact picker in composer |
| Search | Room list + in-thread message search |
| Pinned messages | Pin bar + pin/unpin action |
| Message actions | Reply, copy, pin, delete |
| A11y | Skip link, `role="log"`, live regions, labelled controls |
| Responsive | Room list ↔ thread swap under 860px |
| Dark mode | `prefers-color-scheme` + `[data-theme="dark"]` |
| Performance | Message list `content-visibility`, presentational (no socket SDK) |

## Import

```ts
import {
  EnterpriseChat,
  chatRoomsFixture,
  chatMessagesFixture,
  normalizeLegacyMessage,
  chatLazy,
} from "@hamd/ui/chat";
import "@hamd/ui/chat.css";
```

## Host wiring

```tsx
<EnterpriseChat
  rooms={rooms}
  messages={messages}
  currentUserId={user.id}
  onSend={async (draft, roomId) => api.send(roomId, draft)}
  onMarkRead={(roomId, ids) => api.markRead(roomId, ids)}
  onTyping={(roomId, active) => socket.emit(active ? "typing_start" : "typing_stop", roomId)}
  onPin={(id, pinned) => api.pin(id, pinned)}
  onDelete={(id) => api.delete(id)}
  subscribe={(push) => socket.bind(push)}
/>
```

Realtime is injectable (poll / Socket.IO / SSE). Do not hardcode sockets in UI.

## Review

See [75-enterprise-chat-review.md](./75-enterprise-chat-review.md).
