import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientDashboard } from "./ClientDashboard.js";
import { ClientWorkspaceShell } from "./ClientWorkspaceShell.js";
import { DashboardWidget } from "./DashboardWidget.js";
import { VirtualizedList } from "./VirtualizedList.js";
import { useOptimisticItems } from "./useOptimisticItems.js";
import { dashboardFixture } from "./fixtures.js";
import { AttentionQueueWidget } from "./widgets/DashboardWidgets.js";

describe("ClientWorkspaceShell", () => {
  it("exposes skip link, sectioned nav, and main landmark", () => {
    render(
      <ClientWorkspaceShell
        navSections={[
          {
            id: "overview",
            label: "Overview",
            items: [
              {
                id: "dashboard",
                label: "Dashboard",
                href: "/app",
                current: true,
                icon: "dashboard",
              },
            ],
          },
          {
            id: "procurement",
            label: "Procurement",
            items: [
              {
                id: "requests",
                label: "Requests",
                href: "/app/requests",
                badge: 3,
                icon: "requests",
              },
            ],
          },
        ]}
        userLabel="Ada Okoro"
        userEmail="ada@example.com"
        notificationCount={2}
        brandHref="/app"
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getAllByRole("link", { name: "Dashboard" })[0]).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getAllByText("Procurement").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/notifications, 2 unread/i)).toBeInTheDocument();
    expect(document.getElementById("main-content")).toHaveTextContent("Body");
  });

  it("keeps account menu compact without workspace nav dump", async () => {
    const user = userEvent.setup();
    render(
      <ClientWorkspaceShell
        navItems={[{ id: "dashboard", label: "Dashboard", href: "/app", current: true }]}
        userLabel="Ada Okoro"
        userEmail="ada@example.com"
        onSignOut={vi.fn()}
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    await user.click(screen.getByRole("button", { name: /ada okoro/i }));
    const menu = screen.getByRole("menu", { name: /account/i });
    expect(within(menu).getByRole("menuitem", { name: /profile/i })).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitem", { name: /account settings/i }),
    ).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /sign out/i })).toHaveClass(
      "hamd-client-shell__signout",
    );
    expect(within(menu).queryByRole("menuitem", { name: /requests/i })).not.toBeInTheDocument();
  });

  it("toggles the sidebar-collapsed class when the collapse control is pressed", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ClientWorkspaceShell
        navItems={[{ id: "dashboard", label: "Dashboard", href: "/app", current: true }]}
        userLabel="Ada Okoro"
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    const shell = container.querySelector(".hamd-client-shell");
    expect(shell).not.toHaveClass("hamd-client-shell--sidebar-collapsed");

    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    expect(shell).toHaveClass("hamd-client-shell--sidebar-collapsed");
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));
    expect(shell).not.toHaveClass("hamd-client-shell--sidebar-collapsed");
  });

  it("shows a single Profile link in the mobile drawer", async () => {
    const user = userEvent.setup();
    render(
      <ClientWorkspaceShell
        navSections={[
          {
            id: "account",
            label: "Account",
            items: [
              {
                id: "profile",
                label: "Profile",
                href: "/app/profile",
                icon: "profile",
              },
            ],
          },
        ]}
        profileHref="/app/profile"
        userLabel="Ada Okoro"
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const drawerNav = document.querySelector(".hamd-client-shell__drawer-nav");
    expect(drawerNav).toBeTruthy();
    expect(
      within(drawerNav as HTMLElement).getAllByRole("link", { name: /^profile$/i }),
    ).toHaveLength(1);
  });

  it("opens and closes the mobile nav drawer", async () => {
    const user = userEvent.setup();
    render(
      <ClientWorkspaceShell
        navItems={[{ id: "dashboard", label: "Dashboard", href: "/app", current: true }]}
        userLabel="Ada Okoro"
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    const drawer = document.querySelector(".hamd-client-shell__drawer");
    expect(drawer).toHaveClass("is-open");
    expect(screen.getAllByRole("button", { name: /close menu/i }).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: /close menu/i })[0]!);
    expect(drawer).not.toHaveClass("is-open");
    expect(screen.getByRole("button", { name: /open menu/i })).toBeInTheDocument();
  });

  it("places a single menu trigger on the left, before page title and utilities", () => {
    render(
      <ClientWorkspaceShell
        navItems={[{ id: "dashboard", label: "Dashboard", href: "/app", current: true }]}
        theme="light"
        onThemeChange={() => undefined}
        userLabel="Ada Okoro"
        pageTitle="Overview"
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    const topbar = document.querySelector(".hamd-client-shell__topbar");
    expect(topbar).toBeTruthy();
    const menuButtons = topbar?.querySelectorAll(".hamd-client-shell__menu-btn");
    expect(menuButtons).toHaveLength(1);
    const start = topbar?.querySelector(".hamd-client-shell__topbar-start");
    const actions = topbar?.querySelector(".hamd-client-shell__topbar-actions");
    const menu = start?.querySelector(".hamd-client-shell__menu-btn");
    const title = start?.querySelector(".hamd-client-shell__page-title");
    const theme = actions?.querySelector(".hamd-client-shell__theme");
    expect(menu && title && theme).toBeTruthy();
    expect(start?.firstElementChild).toBe(menu);
    expect(
      Boolean(menu?.compareDocumentPosition(title!) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
    expect(
      Boolean(title?.compareDocumentPosition(theme!) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
    expect(actions?.querySelector(".hamd-client-shell__menu-btn")).toBeNull();
    expect(topbar?.querySelector(".hamd-client-shell__brand--mobile")).toBeNull();
  });

  it("puts the Almahbub logo inside the drawer and opens from the left", async () => {
    const user = userEvent.setup();
    render(
      <ClientWorkspaceShell
        brandLabel="Almahbub International"
        brandLogoSrc="/almahbub.svg"
        navItems={[{ id: "dashboard", label: "Dashboard", href: "/app", current: true }]}
        userLabel="Ada Okoro"
        onSignOut={vi.fn()}
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    const drawer = document.querySelector(".hamd-client-shell__drawer");
    expect(drawer).toHaveClass("is-open");
    expect(drawer).toHaveAttribute("data-side", "start");
    const logo = drawer?.querySelector(".hamd-client-shell__brand-logo");
    expect(logo).toHaveAttribute("src", "/almahbub.svg");
    expect(
      within(drawer as HTMLElement).getByRole("link", { name: /almahbub international/i }),
    ).toBeInTheDocument();
    expect(within(drawer as HTMLElement).queryByText(/^menu$/i)).not.toBeInTheDocument();
    expect(drawer?.querySelector(".hamd-client-shell__drawer-foot")).toBeTruthy();
  });

  it("closes the drawer from the backdrop and Escape", async () => {
    const user = userEvent.setup();
    render(
      <ClientWorkspaceShell
        navItems={[{ id: "dashboard", label: "Dashboard", href: "/app", current: true }]}
        userLabel="Ada Okoro"
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const drawer = document.querySelector(".hamd-client-shell__drawer");
    expect(drawer).toHaveClass("is-open");

    await user.click(screen.getByRole("button", { name: /close navigation/i }));
    expect(drawer).not.toHaveClass("is-open");

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(drawer).toHaveClass("is-open");
    await user.keyboard("{Escape}");
    expect(drawer).not.toHaveClass("is-open");
  });

  it("closes the drawer when a workspace destination is selected", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <ClientWorkspaceShell
        navItems={[{ id: "requests", label: "Requests", href: "/app/requests" }]}
        userLabel="Ada Okoro"
        onNavigate={onNavigate}
      >
        <p>Body</p>
      </ClientWorkspaceShell>,
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const drawer = document.querySelector(".hamd-client-shell__drawer");
    expect(drawer).toHaveClass("is-open");
    await user.click(
      within(drawer as HTMLElement).getByRole("link", { name: /^requests$/i }),
    );
    expect(onNavigate).toHaveBeenCalledWith("/app/requests");
    expect(drawer).not.toHaveClass("is-open");
  });
});

describe("DashboardWidget", () => {
  it("is resizable-ready with layout data attributes", () => {
    render(
      <DashboardWidget
        id="widget-demo"
        title="Demo"
        layout={{ colSpan: 8, rowSpan: 2 }}
        resizable
      >
        Content
      </DashboardWidget>,
    );
    const section = document.getElementById("widget-demo");
    expect(section).toHaveAttribute("data-col-span", "8");
    expect(section).toHaveAttribute("data-row-span", "2");
    expect(section).toHaveAttribute("data-resizable", "true");
    expect(screen.getByRole("button", { name: /resize demo widget/i })).toBeInTheDocument();
  });
});

describe("VirtualizedList", () => {
  it("renders only a window of rows and supports empty state", () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: `i-${i}`,
      label: `Item ${i}`,
    }));
    const { rerender } = render(
      <VirtualizedList
        items={items}
        itemHeight={40}
        height={120}
        overscan={1}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
        aria-label="Demo list"
      />,
    );

    expect(screen.getByRole("list", { name: "Demo list" })).toBeInTheDocument();
    expect(screen.queryByText("Item 99")).not.toBeInTheDocument();
    expect(screen.getByText("Item 0")).toBeInTheDocument();

    rerender(
      <VirtualizedList
        items={[]}
        itemHeight={40}
        height={120}
        getKey={(item: { id: string }) => item.id}
        renderItem={() => null}
        empty="Nothing here yet."
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Nothing here yet.");
  });
});

describe("AttentionQueueWidget", () => {
  it("highlights a single primary resolve path", () => {
    render(
      <AttentionQueueWidget
        items={[
          {
            id: "a1",
            title: "Clarify PR-1",
            detail: "Need address",
            urgency: "high",
            href: "/r/1",
            kind: "clarification",
          },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: /needs your attention/i })).toBeInTheDocument();
    expect(screen.getByText("Resolve")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /clarify pr-1/i })).toHaveAttribute(
      "href",
      "/r/1",
    );
  });
});

function OptimisticProbe({
  onCommit,
}: {
  onCommit: (id: string) => Promise<void>;
}) {
  const { items, run, error } = useOptimisticItems(
    [{ id: "n1", status: "unread" as const, title: "Hi" }],
    async (_next, action) => {
      if (action.id) await onCommit(action.id);
    },
  );
  return (
    <div>
      <span data-testid="status">{items[0]?.status}</span>
      <button
        type="button"
        onClick={() => void run({ type: "update", id: "n1", patch: { status: "read" } })}
      >
        Mark
      </button>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
}

describe("useOptimisticItems", () => {
  it("updates immediately and rolls back on failure", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn().mockRejectedValue(new Error("network"));
    render(<OptimisticProbe onCommit={onCommit} />);

    await user.click(screen.getByRole("button", { name: "Mark" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("unread"));
    expect(screen.getByRole("alert")).toHaveTextContent("network");
  });

  it("keeps optimistic state when commit succeeds", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn().mockResolvedValue(undefined);
    render(<OptimisticProbe onCommit={onCommit} />);
    await user.click(screen.getByRole("button", { name: "Mark" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("read"));
  });
});

describe("ClientDashboard", () => {
  it("renders overview path: attention, statistics, and required modules", async () => {
    render(
      <ClientDashboard
        data={dashboardFixture}
        shell={{ userLabel: "Ada", brandLabel: "Almahbub International" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/good afternoon, ada/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /needs your attention/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Statistics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent requests" })).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: "Active RFQs" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Quotations" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Shipments" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Invoices" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Payments" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Messages" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Bookmarks" })).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "Recently viewed products" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Recommendations" })).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  });

  it("marks notifications read optimistically", async () => {
    const user = userEvent.setup();
    const onMark = vi.fn().mockResolvedValue(undefined);
    render(
      <ClientDashboard data={dashboardFixture} onMarkNotificationRead={onMark} />,
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument(),
    );
    const mark = await screen.findByRole("button", { name: /mark read/i });
    await user.click(mark);
    await waitFor(() => expect(onMark).toHaveBeenCalledWith("n1"));
  });

  it("supports dark theme token attribute without losing landmarks", () => {
    render(
      <div data-theme="dark">
        <ClientDashboard data={dashboardFixture} withShell={false} />
      </div>,
    );
    expect(document.querySelector(".hamd-dash-overview__eyebrow")).toHaveTextContent(
      "Overview",
    );
    expect(screen.getByText(/good afternoon, ada/i)).toBeInTheDocument();
  });
});
