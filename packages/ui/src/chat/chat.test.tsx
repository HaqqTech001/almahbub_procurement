import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnterpriseChat } from "./EnterpriseChat.js";
import {
  chatMessagesFixture,
  chatRoomsFixture,
} from "./fixtures.js";
import {
  decodeChatMessageBody,
  encodeChatMessageBody,
  filterMessages,
  filterRooms,
  normalizeLegacyMessage,
  pinnedMessages,
} from "./types.js";
import type { ChatRealtimeEvent } from "./useChatRoom.js";

describe("chat helpers", () => {
  it("filters rooms/messages and resolves pins", () => {
    expect(filterRooms(chatRoomsFixture, "PR-1042")).toHaveLength(1);
    expect(filterMessages(chatMessagesFixture, "Lagos").length).toBeGreaterThan(
      0,
    );
    const pins = pinnedMessages(
      chatMessagesFixture.filter((m) => m.roomId === "room-pr-1042"),
      ["m3"],
    );
    expect(pins[0]?.id).toBe("m3");
  });

  it("normalizes legacy snake_case rows without dropping fields", () => {
    const msg = normalizeLegacyMessage(
      {
        id: 99,
        sender_id: 7,
        message: "Hello support",
        message_type: "text",
        is_read: true,
        created_at: "2026-08-01T10:00:00.000Z",
        file_url: null,
      },
      "room-support",
      "7",
    );
    expect(msg.body).toBe("Hello support");
    expect(msg.delivery).toBe("read");
    expect(msg.senderId).toBe("7");
  });

  it("round-trips attachment payloads without dropping files", () => {
    const encoded = encodeChatMessageBody("See drawing", [
      {
        id: "d1",
        name: "flange.png",
        mimeType: "image/png",
        sizeBytes: 1200,
        url: "/api/v1/documents/d1",
        kind: "image",
      },
    ]);
    const decoded = decodeChatMessageBody(encoded);
    expect(decoded.text).toBe("See drawing");
    expect(decoded.attachments[0]?.name).toBe("flange.png");
    expect(decodeChatMessageBody("plain note").attachments).toEqual([]);
  });
});

describe("EnterpriseChat", () => {
  it("renders rooms, record context, pins, media placeholders", () => {
    render(
      <EnterpriseChat
        rooms={chatRoomsFixture}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
      />,
    );

    expect(screen.getByRole("heading", { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip to conversation/i })).toHaveAttribute(
      "href",
      "#hamd-chat-thread",
    );
    expect(
      screen.getByRole("heading", { name: /PR-1042 · Industrial valves/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/pinned messages/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/audio placeholder/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/video placeholder/i)).toBeInTheDocument();
    expect(screen.getByText(/packing-list\.pdf/i)).toBeInTheDocument();
  });

  it("caps unread counts at 99+ and avoids Support Support labels", () => {
    render(
      <EnterpriseChat
        rooms={[
          chatRoomsFixture[0]!,
          {
            ...chatRoomsFixture[1]!,
            title: "Ada Buyer",
            type: "support",
            recordLabel: "Support",
            unreadCount: 120,
          },
        ]}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
      />,
    );
    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.queryByText(/Support · Support/i)).not.toBeInTheDocument();
    expect(screen.getByText("Ada Buyer")).toBeInTheDocument();
  });

  it("keeps header and composer outside the scrollable message list in solo layout", () => {
    const { container } = render(
      <EnterpriseChat
        layout="solo"
        defaultThreadOpen
        rooms={chatRoomsFixture}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
      />,
    );

    const thread = container.querySelector(".hamd-chat__thread");
    const chrome = thread?.querySelector(":scope > .hamd-chat__chrome");
    const header = chrome?.querySelector(".hamd-chat__header");
    const messages = thread?.querySelector(":scope > .hamd-chat__messages");
    const composer = thread?.querySelector(":scope > .hamd-chat__composer");

    expect(chrome).toBeTruthy();
    expect(header).toBeTruthy();
    expect(messages).toBeTruthy();
    expect(composer).toBeTruthy();
    expect(messages?.contains(header as Node)).toBe(false);
    expect(messages?.contains(composer as Node)).toBe(false);
    expect(
      screen.queryByRole("heading", { level: 1, name: /^support$/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps attach, emoji, message, and send controls unobstructed", () => {
    render(
      <EnterpriseChat
        layout="solo"
        defaultThreadOpen
        rooms={chatRoomsFixture}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
      />,
    );

    expect(screen.getByLabelText(/attach files/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /insert emoji/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^send$/i })).toBeInTheDocument();
  });

  it("opens image attachments in the in-app media viewer", async () => {
    const user = userEvent.setup();
    render(
      <EnterpriseChat
        rooms={chatRoomsFixture}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
      />,
    );

    await user.click(screen.getByRole("button", { name: /image preview/i }));
    expect(screen.getByRole("dialog", { name: /media preview/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close preview/i })).toBeInTheDocument();
  });

  it("searches rooms and messages", async () => {
    const user = userEvent.setup();
    render(
      <EnterpriseChat
        rooms={chatRoomsFixture}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
      />,
    );

    const roomSearch = screen.getByLabelText(/search conversations/i);
    await user.type(roomSearch, "Support");
    const rooms = screen.getByRole("list", { name: /conversation list/i });
    expect(within(rooms).getAllByText(/^Support$/).length).toBeGreaterThan(0);
    expect(
      within(rooms).queryByText(/Industrial valves/i),
    ).not.toBeInTheDocument();

    await user.clear(roomSearch);
    await user.click(within(rooms).getByText(/Industrial valves/i));
    await user.type(screen.getByLabelText(/search messages/i), "warehouse");
    const log = screen.getByRole("log");
    expect(within(log).getByText(/Lagos warehouse address/i)).toBeInTheDocument();
    expect(
      within(log).queryByText(/Valve datasheet preview/i),
    ).not.toBeInTheDocument();
  });

  it("sends text, inserts emoji, pins and replies via message actions", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    const onPin = vi.fn().mockResolvedValue(undefined);
    const onTyping = vi.fn();

    render(
      <EnterpriseChat
        rooms={chatRoomsFixture}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
        onSend={onSend}
        onPin={onPin}
        onTyping={onTyping}
      />,
    );

    const composer = screen.getByLabelText(/^message$/i);
    await user.type(composer, "Confirming gate code");
    expect(onTyping).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^send$/i }));
    expect(onSend).toHaveBeenCalled();

    const log = screen.getByRole("log");
    const bubble = within(log)
      .getByText(/destination confirmed/i)
      .closest("article");
    expect(bubble).toBeTruthy();
    await user.click(
      within(bubble!).getByRole("button", { name: /actions for message/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /^unpin$/i }));
    expect(onPin).toHaveBeenCalledWith("m3", false);

    await user.click(
      within(bubble!).getByRole("button", { name: /actions for message/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /^reply$/i }));
    expect(screen.getByText(/replying to/i)).toBeInTheDocument();
  });

  it("supports injectable realtime typing and messages", async () => {
    let push: ((event: ChatRealtimeEvent) => void) | undefined;
    const subscribe = (handler: (event: ChatRealtimeEvent) => void) => {
      push = handler;
      return () => {
        push = undefined;
      };
    };

    render(
      <EnterpriseChat
        rooms={chatRoomsFixture}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
        subscribe={subscribe}
      />,
    );

    act(() => {
      push?.({
        type: "typing",
        roomId: "room-pr-1042",
        userId: "ops-james",
        active: true,
      });
    });
    expect(await screen.findByText(/james nwosu is typing/i)).toBeInTheDocument();

    act(() => {
      push?.({
        type: "message",
        message: {
          id: "live-9",
          roomId: "room-pr-1042",
          senderId: "ops-james",
          kind: "text",
          body: "Live ETA ping",
          createdAt: new Date().toISOString(),
          delivery: "delivered",
        },
      });
    });
    expect(
      await within(screen.getByRole("log")).findByText(/live eta ping/i),
    ).toBeInTheDocument();
  });

  it("renders loading skeleton and dark compact density", () => {
    const { rerender } = render(
      <EnterpriseChat
        rooms={[]}
        messages={[]}
        currentUserId="user-ada"
        loading
      />,
    );
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();

    rerender(
      <div data-theme="dark">
        <EnterpriseChat
          rooms={chatRoomsFixture}
          messages={chatMessagesFixture}
          currentUserId="user-ada"
          density="compact"
        />
      </div>,
    );
    expect(document.querySelector(".hamd-chat--compact")).toBeTruthy();
  });
});
