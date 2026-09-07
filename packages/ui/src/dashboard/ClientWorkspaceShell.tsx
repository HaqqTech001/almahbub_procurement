import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { cx } from "../utils/cx.js";
import type { DashboardNavItem, DashboardNavSection } from "./types.js";

export type WorkspaceThemeMode = "light" | "dark" | "system";

export type ClientWorkspaceShellProps = {
  children: ReactNode;
  /** Flat nav - wrapped into a single untitled section when `navSections` omitted. */
  navItems?: DashboardNavItem[];
  /** Preferred: sectioned workspace navigation for the sidebar / mobile drawer. */
  navSections?: DashboardNavSection[];
  brandLabel?: string;
  brandHref?: string;
  brandLogoSrc?: string;
  userLabel?: string;
  userEmail?: string;
  profileHref?: string;
  settingsHref?: string;
  notificationsHref?: string;
  notificationCount?: number;
  /** When set, replaces the default notifications link (e.g. dropdown menu). */
  notificationsMenu?: ReactNode;
  className?: string;
  /** Compact utilities in the top bar (e.g. GuideControl). */
  topBarExtra?: ReactNode;
  /** Optional celebration / announcement above the shell chrome. */
  banner?: ReactNode;
  mainId?: string;
  pageTitle?: string;
  theme?: WorkspaceThemeMode;
  onThemeChange?: (theme: WorkspaceThemeMode) => void;
  onSignOut?: () => void | Promise<void>;
  onHelp?: () => void;
  /**
   * When provided, internal app links use client-side navigation
   * (preventDefault + callback) instead of full document loads.
   */
  onNavigate?: (href: string) => void;
  searchPlaceholder?: string;
  onSearchSubmit?: (query: string) => void;
};

function flattenSections(
  sections: readonly DashboardNavSection[] | undefined,
  navItems: DashboardNavItem[] | undefined,
): DashboardNavSection[] {
  if (sections && sections.length > 0) return [...sections];
  return [
    {
      id: "main",
      label: "Workspace",
      items: navItems ?? [],
    },
  ];
}

/**
 * Authenticated client application shell - persistent sidebar (desktop),
 * drawer navigation (mobile), compact account menu. Not a marketing header.
 */
export function ClientWorkspaceShell({
  children,
  navItems,
  navSections,
  brandLabel = "Almahbub International",
  brandHref = "/app",
  brandLogoSrc = "/almahbub.svg",
  userLabel,
  userEmail,
  profileHref = "/app/settings",
  settingsHref = "/app/settings",
  notificationsHref = "/app/notifications",
  notificationCount = 0,
  notificationsMenu,
  className,
  topBarExtra,
  banner,
  mainId = "main-content",
  pageTitle = "Dashboard",
  theme = "system",
  onThemeChange,
  onSignOut,
  onHelp,
  onNavigate,
  searchPlaceholder = "Search requests and workspace…",
  onSearchSubmit,
}: ClientWorkspaceShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const drawerId = useId();
  const accountId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const sections = flattenSections(navSections, navItems);
  const brandName = brandLabel.split(" ")[0] ?? brandLabel;
  const brandSub = brandLabel.includes(" ")
    ? brandLabel.slice(brandLabel.indexOf(" ") + 1)
    : "Workspace";

  const closeNav = () => setNavOpen(false);
  const closeNavRestore = () => {
    setNavOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => {
    try {
      setSidebarCollapsed(
        window.localStorage.getItem("hamd.workspace.sidebar.collapsed") === "1",
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "hamd.workspace.sidebar.collapsed",
        sidebarCollapsed ? "1" : "0",
      );
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const onChange = () => {
      if (query.matches) setSidebarCollapsed(false);
    };
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    queueMicrotask(() => drawerCloseRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNavRestore();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    onSearchSubmit?.(trimmed);
  };

  const handleAppLink =
    (href: string, after?: () => void) =>
    (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (
        onNavigate &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        event.button === 0
      ) {
        event.preventDefault();
        onNavigate(href);
      }
      after?.();
      closeNav();
    };

  const navBody = (
    <>
      {sections.map((section) => (
        <div key={section.id} className="hamd-client-shell__nav-section">
          <p className="hamd-client-shell__nav-label">{section.label}</p>
          <ul>
            {section.items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={cx(
                    "hamd-client-shell__nav-link",
                    item.current && "is-current",
                  )}
                  aria-current={item.current ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                  onClick={handleAppLink(item.href)}
                  data-tour={`${item.id}-nav`}
                  data-guide={`${item.id}-nav`}
                >
                  <span className="hamd-client-shell__nav-icon" aria-hidden="true">
                    <NavIcon name={item.icon ?? inferIcon(item.id)} />
                  </span>
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span
                      className="hamd-client-shell__badge"
                      aria-label={`${item.badge} unread`}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );

  return (
    <div
      className={cx(
        "hamd-client-shell",
        sidebarCollapsed && "hamd-client-shell--sidebar-collapsed",
        className,
      )}
      data-drawer={navOpen ? "open" : "closed"}
    >
      <a className="hamd-client-shell__skip" href={`#${mainId}`}>
        Skip to main content
      </a>

      {banner ? <div className="hamd-client-shell__banner">{banner}</div> : null}

      <aside className="hamd-client-shell__sidebar" aria-label="Workspace">
        <div className="hamd-client-shell__sidebar-top">
          {sidebarCollapsed ? (
            <button
              type="button"
              className="hamd-client-shell__brand-toggle"
              aria-label="Expand sidebar"
              title="Open navigation"
              aria-pressed="true"
              onClick={() => setSidebarCollapsed(false)}
            >
              <img
                className="hamd-client-shell__brand-logo"
                src={brandLogoSrc}
                alt=""
                width={32}
                height={32}
                decoding="async"
              />
              <span className="hamd-client-shell__brand-toggle-icon" aria-hidden="true">
                <CollapseIcon collapsed />
              </span>
            </button>
          ) : (
            <>
              <a
                href={brandHref}
                className="hamd-client-shell__brand"
                aria-label={brandLabel}
                onClick={handleAppLink(brandHref)}
              >
                <img
                  className="hamd-client-shell__brand-logo"
                  src={brandLogoSrc}
                  alt=""
                  width={32}
                  height={32}
                  decoding="async"
                />
                <span className="hamd-client-shell__brand-text">
                  <strong className="hamd-client-shell__brand-name">{brandName}</strong>
                  <span className="hamd-client-shell__brand-sub">{brandSub}</span>
                </span>
              </a>
              <button
                type="button"
                className="hamd-client-shell__collapse-btn"
                aria-label="Collapse sidebar"
                aria-pressed="false"
                title="Collapse sidebar"
                onClick={() => setSidebarCollapsed(true)}
              >
                <CollapseIcon collapsed={false} />
              </button>
            </>
          )}
        </div>
        <nav className="hamd-client-shell__nav" aria-label="Primary">
          {navBody}
        </nav>
        {onSignOut ? (
          <div className="hamd-client-shell__sidebar-footer">
            <button
              type="button"
              className="hamd-client-shell__signout"
              title="Sign Out"
              onClick={() => void onSignOut()}
            >
              Sign Out
            </button>
          </div>
        ) : null}
      </aside>

      {navOpen ? (
        <button
          type="button"
          className="hamd-client-shell__drawer-backdrop is-open"
          aria-label="Close navigation"
          onClick={closeNavRestore}
        />
      ) : (
        <div className="hamd-client-shell__drawer-backdrop" aria-hidden="true" />
      )}
      <div
        id={drawerId}
        className={cx("hamd-client-shell__drawer", navOpen && "is-open")}
        data-side="start"
        role="dialog"
        aria-modal={navOpen || undefined}
        aria-label="Workspace navigation"
        aria-hidden={navOpen ? undefined : true}
      >
        <div className="hamd-client-shell__drawer-head">
          <a
            href={brandHref}
            className="hamd-client-shell__brand hamd-client-shell__brand--drawer"
            aria-label={brandLabel}
            onClick={handleAppLink(brandHref)}
          >
            <img
              className="hamd-client-shell__brand-logo"
              src={brandLogoSrc}
              alt=""
              width={28}
              height={28}
              decoding="async"
            />
            <span className="hamd-client-shell__brand-text">
              <strong className="hamd-client-shell__brand-name">{brandName}</strong>
              <span className="hamd-client-shell__brand-sub">{brandSub}</span>
            </span>
          </a>
          <button
            ref={drawerCloseRef}
            type="button"
            className="hamd-client-shell__drawer-close"
            aria-label="Close menu"
            onClick={closeNavRestore}
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="hamd-client-shell__drawer-nav" aria-label="Mobile workspace">
          {navBody}
        </nav>
        {onSignOut ? (
          <div className="hamd-client-shell__drawer-foot">
            <button
              type="button"
              className="hamd-client-shell__signout hamd-client-shell__signout--block"
              onClick={() => {
                closeNav();
                void onSignOut();
              }}
            >
              Sign Out
            </button>
          </div>
        ) : null}
      </div>

      <div className="hamd-client-shell__maincol">
        <header className="hamd-client-shell__topbar">
          <div className="hamd-client-shell__topbar-start">
            <button
              ref={menuButtonRef}
              type="button"
              className="hamd-client-shell__menu-btn"
              aria-label={navOpen ? "Close menu" : "Open menu"}
              aria-expanded={navOpen}
              aria-controls={drawerId}
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <h1 className="hamd-client-shell__page-title">{pageTitle}</h1>
          </div>

          {onSearchSubmit ? (
            <form
              className="hamd-client-shell__search"
              role="search"
              onSubmit={submitSearch}
            >
              <label className="hamd-sr-only" htmlFor="workspace-search">
                Search workspace
              </label>
              <input
                id="workspace-search"
                type="search"
                className="hamd-client-shell__search-input"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
            </form>
          ) : null}

          <div className="hamd-client-shell__topbar-actions">
            {onThemeChange ? (
              <ThemeToggle theme={theme} onChange={onThemeChange} />
            ) : null}
            {topBarExtra}
            {notificationsMenu ?? (
              <a
                href={notificationsHref}
                className="hamd-client-shell__icon-btn"
                aria-label={
                  notificationCount
                    ? `Notifications, ${notificationCount} unread`
                    : "Notifications"
                }
                data-tour="notifications-nav"
                data-guide="notification-trigger"
                onClick={handleAppLink(notificationsHref)}
              >
                <BellIcon />
                {notificationCount > 0 ? (
                  <span className="hamd-client-shell__unread-dot" aria-hidden="true" />
                ) : null}
              </a>
            )}

            <div className="hamd-client-shell__account" ref={accountRef}>
              <button
                type="button"
                className="hamd-client-shell__account-btn"
                aria-expanded={accountOpen}
                aria-controls={accountId}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((v) => !v)}
              >
                <span className="hamd-client-shell__avatar" aria-hidden="true">
                  {(userLabel?.trim()[0] ?? "A").toUpperCase()}
                </span>
                <span className="hamd-client-shell__account-label">
                  {userLabel ?? "Account"}
                </span>
              </button>
              {accountOpen ? (
                <div
                  id={accountId}
                  className="hamd-client-shell__account-menu"
                  role="menu"
                  aria-label="Account"
                >
                  <div className="hamd-client-shell__account-meta">
                    <p className="hamd-client-shell__account-name">{userLabel}</p>
                    {userEmail ? (
                      <p className="hamd-client-shell__account-email">{userEmail}</p>
                    ) : null}
                  </div>
                  <a
                    role="menuitem"
                    href={profileHref}
                    onClick={handleAppLink(profileHref, () => setAccountOpen(false))}
                  >
                    Profile
                  </a>
                  <a
                    role="menuitem"
                    href={settingsHref}
                    onClick={handleAppLink(settingsHref, () => setAccountOpen(false))}
                  >
                    Account settings
                  </a>
                  {onHelp ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountOpen(false);
                        onHelp();
                      }}
                    >
                      Help / Product tour
                    </button>
                  ) : null}
                  <hr className="hamd-client-shell__account-rule" />
                  {onSignOut ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="hamd-client-shell__signout"
                      onClick={() => {
                        setAccountOpen(false);
                        void onSignOut();
                      }}
                    >
                      Sign Out
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main id={mainId} className="hamd-client-shell__content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function inferIcon(id: string): NonNullable<DashboardNavItem["icon"]> {
  if (id.includes("request")) return "requests";
  if (id.includes("quotation")) return "quotations";
  if (id.includes("invoice")) return "invoices";
  if (id.includes("payment")) return "payments";
  if (id.includes("shipment")) return "shipments";
  if (id.includes("notif")) return "notifications";
  if (id.includes("chat") || id.includes("support")) return "chat";
  if (id.includes("setting")) return "settings";
  if (id.includes("profile")) return "profile";
  return "dashboard";
}

function ThemeToggle({
  theme,
  onChange,
}: {
  theme: WorkspaceThemeMode;
  onChange: (theme: WorkspaceThemeMode) => void;
}) {
  const resolved =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const next: WorkspaceThemeMode = resolved === "dark" ? "light" : "dark";
  const isDark = resolved === "dark";
  return (
    <button
      type="button"
      className={cx("hamd-client-shell__theme", isDark && "is-dark")}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => onChange(next)}
    >
      <span className="hamd-client-shell__theme-track" aria-hidden="true">
        <SunIcon />
        <MoonIcon />
        <span className="hamd-client-shell__theme-thumb" />
      </span>
    </button>
  );
}

function NavIcon({ name }: { name: NonNullable<DashboardNavItem["icon"]> }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    fill: "none",
    "aria-hidden": true as const,
  };
  switch (name) {
    case "requests":
      return (
        <svg {...common}>
          <path
            d="M7 4h10a2 2 0 0 1 2 2v14l-4-2-3 2-3-2-4 2V6a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "quotations":
      return (
        <svg {...common}>
          <path
            d="M5 7h14M5 12h10M5 17h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "invoices":
      return (
        <svg {...common}>
          <path
            d="M7 3h8l2 2v16H7V3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 9h6M9 13h6M9 17h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "payments":
      return (
        <svg {...common}>
          <rect
            x="3"
            y="6"
            width="18"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "shipments":
      return (
        <svg {...common}>
          <path
            d="M3 7h11v10H3zM14 10h4l3 3v4h-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="18" r="1.5" fill="currentColor" />
          <circle cx="17.5" cy="18" r="1.5" fill="currentColor" />
        </svg>
      );
    case "notifications":
      return <BellIcon />;
    case "chat":
      return (
        <svg {...common}>
          <path
            d="M5 6h14v9H9l-4 3V6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="M5 19a7 7 0 0 1 14 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path
            d="M4 11 12 4l8 7v9H4V11Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5 1.5 5H4.5S6 12.5 6 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d={collapsed ? "M10 6l6 6-6 6" : "M14 6l-6 6 6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
