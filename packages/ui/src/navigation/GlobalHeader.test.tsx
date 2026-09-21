import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalHeader } from "./GlobalHeader.js";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  Object.defineProperty(window, "pageYOffset", { value: 0, configurable: true });
});

describe("GlobalHeader", () => {
  it("renders brand, primary links, guest auth - without CTA or language", () => {
    const onThemeChange = vi.fn();
    render(
      <GlobalHeader
        notificationCount={3}
        onThemeChange={onThemeChange}
        transparentUntilScroll={false}
        megaMenus={[]}
        links={[
          { id: "home", label: "Home", href: "/" },
          { id: "services", label: "Services", href: "/services" },
          { id: "catalog", label: "Catalog", href: "/products" },
          { id: "industries", label: "Industries", href: "/industries" },
          { id: "about", label: "About", href: "/about" },
          { id: "contact", label: "Contact", href: "/contact" },
        ]}
        auth={{ authenticated: false, signInHref: "/login", signUpHref: "/register" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Almahbub International" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Services" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catalog" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Request Procurement" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/language/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Sign Up" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("switch", { name: /theme/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    const shell = document.querySelector(".hamd-header-shell");
    expect(shell).not.toBeNull();
    expect(shell?.querySelector("header.hamd-header")).not.toBeNull();
    expect(document.querySelector(".hamd-header-spacer")).not.toBeNull();
  });

  it("renders authenticated account chrome with danger sign out", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(
      <GlobalHeader
        transparentUntilScroll={false}
        notificationCount={2}
        auth={{
          authenticated: true,
          userLabel: "Ada Okon",
          dashboardHref: "/app",
          profileHref: "/app/settings",
          notificationsHref: "/app/notifications",
          onHelp: vi.fn(),
          onSignOut,
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Notifications, 2 unread/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("menu", { name: "Account" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ada Okon/i }));
    expect(screen.queryByRole("menuitem", { name: "Workspace" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Account settings" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Help / Product Tour" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Requests" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sign Out" })).toHaveClass(
      "hamd-header__signout",
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "Account" })).not.toBeInTheDocument();
  });

  it("closes account menu on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <GlobalHeader
          transparentUntilScroll={false}
          auth={{
            authenticated: true,
            userLabel: "Ada Okon",
            dashboardHref: "/app",
            onSignOut: vi.fn(),
          }}
        />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /Ada Okon/i }));
    expect(screen.getByRole("menu", { name: "Account" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu", { name: "Account" })).not.toBeInTheDocument();
  });

  it("opens mega menu on click and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<GlobalHeader transparentUntilScroll={false} />);

    const services = screen.getByRole("button", { name: "Services" });
    expect(services).toHaveAttribute("aria-expanded", "false");
    await user.click(services);
    expect(services).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Global Procurement/i })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(services).toHaveAttribute("aria-expanded", "false");
  });

  it("opens search panel and submits query", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();
    const { container } = render(
      <GlobalHeader transparentUntilScroll={false} onSearchSubmit={onSearchSubmit} />,
    );

    await user.click(within(container).getByRole("button", { name: "Search" }));
    const form = container.querySelector("form.hamd-header__search-form");
    expect(form).not.toBeNull();
    await user.type(within(form as HTMLElement).getByLabelText("Search"), "steel flange");
    await user.click(within(form as HTMLElement).getByRole("button", { name: "Search" }));
    expect(onSearchSubmit).toHaveBeenCalledWith("steel flange");
  });

  it("uses onNavigate for search when onSearchSubmit is omitted", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const { container } = render(
      <GlobalHeader
        transparentUntilScroll={false}
        searchAction="/products"
        onNavigate={onNavigate}
      />,
    );

    await user.click(within(container).getByRole("button", { name: "Search" }));
    const form = container.querySelector("form.hamd-header__search-form");
    expect(form).not.toBeNull();
    await user.type(within(form as HTMLElement).getByLabelText("Search"), "valves");
    await user.click(within(form as HTMLElement).getByRole("button", { name: "Search" }));
    expect(onNavigate).toHaveBeenCalledWith("/products?q=valves");
  });

  it("opens accessible mobile drawer with collapsible categories", async () => {
    const user = userEvent.setup();
    render(<GlobalHeader transparentUntilScroll={false} />);

    const menuToggle = screen.getByRole("button", { name: "Open menu" });
    await user.click(menuToggle);
    const drawer = await screen.findByRole("navigation", { name: "Mobile navigation" });
    expect(drawer).toHaveClass("is-open");
    expect(drawer).toHaveAttribute("aria-hidden", "false");
    expect(document.body.style.overflow).toBe("hidden");
    expect(drawer.querySelector("form.hamd-header__drawer-search")).toBeNull();
    expect(within(drawer).queryByRole("search")).not.toBeInTheDocument();
    expect(menuToggle).toHaveAttribute("aria-label", "Close menu");
    expect(menuToggle).toHaveClass("is-open");

    await user.click(within(drawer).getByRole("button", { name: "Catalog" }));
    expect(within(drawer).getByRole("link", { name: "Industrial components" })).toBeInTheDocument();

    await user.click(menuToggle);
    expect(drawer).not.toHaveClass("is-open");
    expect(menuToggle).toHaveAttribute("aria-label", "Open menu");
  });
});


describe("attached public service menus", () => {
  const menu = { id: "procurement", label: "Global Procurement", href: "/businesses/almahbub-international", compact: true, columns: [{ id: "one", title: "Procurement", items: [{ id: "overview", label: "Overview", href: "/businesses/almahbub-international" }, { id: "categories", label: "Categories", href: "/businesses/almahbub-international#categories" }] }] };
  it("keeps the label navigable and supports keyboard disclosure, arrows, Escape and outside click", async () => {
    const user = userEvent.setup();
    render(<><GlobalHeader theme="light" megaMenus={[menu]} links={[{ id: "home", label: "Home", href: "/" }]} /><button>Outside</button></>);
    expect(screen.getByRole("link", { name: "Global Procurement", exact: true })).toHaveAttribute("href", menu.href);
    const toggle = screen.getByRole("button", { name: "Global Procurement menu" });
    toggle.focus();
    await user.keyboard("{Enter}{Tab}");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "Categories" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
  it("keeps mobile Home first and cycles focus inside the open drawer", async () => {
    const user = userEvent.setup();
    render(<GlobalHeader theme="light" megaMenus={[menu]} links={[{ id: "home", label: "Home", href: "/" }]} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("navigation", { name: "Mobile navigation" });
    const close = within(drawer).getByRole("button", { name: "Close menu" });
    expect(close).toHaveFocus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(within(drawer).getByRole("link", { name: "Sign Up" })).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(close).toHaveFocus();
    expect(drawer.querySelector("a")).toHaveAttribute("href", "/");
    await user.click(within(drawer).getByRole("button", { name: "Global Procurement menu" }));
    expect(within(drawer).getByRole("link", { name: "Categories" })).toBeVisible();
  });
});
