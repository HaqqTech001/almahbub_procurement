import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationCenter } from "./NotificationCenter.js";
import {
  notificationCenterFixture,
  notificationPreferencesFixture,
} from "./fixtures.js";
import {
  emptyNotificationFilters,
  filterNotifications,
  groupNotifications,
  resolveNotificationChannels,
  resolveNotificationKind,
} from "./types.js";
import type { NotificationRealtimeEvent } from "./useNotificationInbox.js";

function listRegion() {
  return screen.getByRole("list", { name: /notifications/i });
}

describe("notification helpers", () => {
  it("resolves mission kinds, channels, and groups by day/pin/archive", () => {
    expect(resolveNotificationKind(notificationCenterFixture[0]!)).toBe(
      "procurement_update",
    );
    expect(resolveNotificationChannels(notificationCenterFixture[0]!)).toEqual([
      "in_app",
      "email",
    ]);
    expect(resolveNotificationChannels(notificationCenterFixture[4]!)).toEqual([
      "email",
    ]);

    const groups = groupNotifications(notificationCenterFixture);
    expect(groups.some((g) => g.id === "pinned")).toBe(true);
    expect(groups.some((g) => g.id === "archived")).toBe(true);
    expect(groups.some((g) => g.id === "scheduled")).toBe(true);

    const unreadOnly = filterNotifications(notificationCenterFixture, {
      ...emptyNotificationFilters(),
      status: "unread",
    });
    expect(unreadOnly.every((n) => n.status === "unread")).toBe(true);

    const emailOnly = filterNotifications(notificationCenterFixture, {
      ...emptyNotificationFilters(),
      channels: ["email"],
    });
    expect(
      emailOnly.every((n) =>
        resolveNotificationChannels(n).includes("email"),
      ),
    ).toBe(true);
  });
});

describe("NotificationCenter", () => {
  it("renders categories, search, grouping, and detail pane", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter notifications={notificationCenterFixture} />);

    expect(
      screen.getByRole("heading", { name: /enterprise notification engine/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to notifications/i }),
    ).toHaveAttribute("href", "#nc-list");

    const filters = screen.getByRole("complementary", {
      name: /notification filters/i,
    });
    expect(
      within(filters).getByText(/procurement updates/i),
    ).toBeInTheDocument();
    expect(within(filters).getByText(/^Email$/i)).toBeInTheDocument();
    expect(within(filters).getByText(/^SMS$/i)).toBeInTheDocument();
    expect(within(filters).getByText(/^Push$/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pinned" })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/search notifications/i), "QT-889");
    expect(
      within(listRegion()).getByText(/quotation qt-889 received/i),
    ).toBeInTheDocument();
    expect(
      within(listRegion()).queryByText(/shipment sh-901/i),
    ).not.toBeInTheDocument();
  });

  it("covers settings view with email, SMS placeholder, and type preferences", async () => {
    const user = userEvent.setup();
    const onUpdatePreferences = vi.fn().mockResolvedValue(undefined);

    render(
      <NotificationCenter
        notifications={notificationCenterFixture}
        preferences={notificationPreferencesFixture}
        onUpdatePreferences={onUpdatePreferences}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^settings$/i }));
    const settings = screen.getByLabelText(/notification settings/i);
    expect(within(settings).getAllByText(/^Email$/i).length).toBeGreaterThan(0);
    expect(within(settings).getAllByText(/^In-app$/i).length).toBeGreaterThan(0);
    expect(within(settings).getByRole("columnheader", { name: /type/i })).toBeInTheDocument();
    expect(within(settings).getByRole("rowheader", { name: /^security$/i })).toBeInTheDocument();
    const notes = within(settings).getAllByRole("note");
    expect(
      notes.some((n) => /SMS placeholder/i.test(n.textContent ?? "")),
    ).toBe(true);
    expect(
      notes.some((n) => /Push placeholder/i.test(n.textContent ?? "")),
    ).toBe(true);

    await user.click(within(settings).getByLabelText(/shipments in_app/i));
    expect(onUpdatePreferences).toHaveBeenCalled();
  });

  it("marks all read, pins, and archives with handlers", async () => {
    const user = userEvent.setup();
    const onMarkRead = vi.fn().mockResolvedValue(undefined);
    const onMarkAllRead = vi.fn().mockResolvedValue(undefined);
    const onArchive = vi.fn().mockResolvedValue(undefined);
    const onPinChange = vi.fn().mockResolvedValue(undefined);

    render(
      <NotificationCenter
        notifications={notificationCenterFixture}
        onMarkRead={onMarkRead}
        onMarkAllRead={onMarkAllRead}
        onArchive={onArchive}
        onPinChange={onPinChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /mark all as read/i }));
    expect(onMarkAllRead).toHaveBeenCalled();
    expect(onMarkRead).not.toHaveBeenCalled();

    const firstUnreadTitle = /clarification requested on pr-1042/i;
    const articleFor = () =>
      within(listRegion())
        .getByRole("heading", { name: firstUnreadTitle })
        .closest("article");

    const item = articleFor();
    expect(item).toBeTruthy();
    await user.click(within(item!).getByRole("button", { name: /pin /i }));
    expect(onPinChange).toHaveBeenCalled();

    const pinnedItem = articleFor();
    expect(pinnedItem).toBeTruthy();
    await user.click(
      within(pinnedItem!).getByRole("button", { name: /archive /i }),
    );
    expect(onArchive).toHaveBeenCalled();
  });

  it("applies filters for mission categories and status chips", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter notifications={notificationCenterFixture} />);

    await user.click(screen.getByRole("button", { name: "Unread" }));
    expect(screen.getByRole("button", { name: "Unread" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const mentionFilter = screen.getByLabelText("Mentions");
    await user.click(mentionFilter);
    expect(
      within(listRegion()).getByText(/you were mentioned/i),
    ).toBeInTheDocument();
  });

  it("supports injectable realtime upserts", async () => {
    let push: ((event: NotificationRealtimeEvent) => void) | undefined;
    const subscribe = (handler: (event: NotificationRealtimeEvent) => void) => {
      push = handler;
      return () => {
        push = undefined;
      };
    };

    render(
      <NotificationCenter
        notifications={notificationCenterFixture}
        subscribe={subscribe}
      />,
    );

    expect(screen.getByText(/realtime connected/i)).toBeInTheDocument();

    act(() => {
      push?.({
        type: "upsert",
        notification: {
          id: "live-1",
          type: "payment",
          priority: "high",
          status: "unread",
          title: "Live payment received",
          body: "Realtime fan-out test",
          createdAt: new Date().toISOString(),
          kind: "payment_received",
          channels: ["in_app"],
        },
      });
    });

    expect(
      await within(listRegion()).findByText(/live payment received/i),
    ).toBeInTheDocument();
  });

  it("renders loading skeleton and responsive landmarks", () => {
    const { rerender } = render(
      <NotificationCenter notifications={[]} loading />,
    );
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();

    rerender(
      <div data-theme="dark">
        <NotificationCenter
          notifications={notificationCenterFixture}
          density="compact"
        />
      </div>,
    );
    expect(document.querySelector(".hamd-nc--compact")).toBeTruthy();
    expect(document.getElementById("nc-list")).toBeTruthy();
  });
});
