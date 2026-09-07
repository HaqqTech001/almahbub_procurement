import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../auth/session/AuthProvider.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { AdminNotificationMenu } from "./AdminNotificationMenu.js";
import {
  AdminCloseIcon,
  AdminCollapseIcon,
  AdminMenuIcon,
  AdminNavIcon,
} from "./AdminNavIcon.js";
import {
  adminPageTitle,
  filterAdminNav,
  ADMIN_NAV_SECTIONS,
  isAdminNavCurrent,
} from "./admin-nav.js";

const OPS_SIDEBAR_KEY = "hamd.ops.sidebar.collapsed";
const PUBLIC_SITE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_SITE_URL
    ? String(import.meta.env.VITE_PUBLIC_SITE_URL)
    : "http://localhost:5173"
  ).replace(/\/$/, "");

function initials(name: string, email?: string | null): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return (email ?? "A").slice(0, 2).toUpperCase();
}

export function AdminShell() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const drawerId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(OPS_SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [profileOpen, setProfileOpen] = useState(false);

  const sections = filterAdminNav(ADMIN_NAV_SECTIONS, auth.permissions);
  const title = adminPageTitle(pathname);
  const userLabel =
    auth.user?.displayName ||
    [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(" ") ||
    auth.user?.email ||
    "Administrator";
  const roleLabel = auth.permissions.includes("ops:access")
    ? "Operations administrator"
    : "Staff";

  const closeDrawer = () => {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const onChange = () => {
      if (query.matches) setCollapsed(false);
    };
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem(OPS_SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const nav = (
    <nav className="hamd-admin-nav" aria-label="Operations">
      {sections.map((section) => (
        <div key={section.id} className="hamd-admin-nav__section">
          <p className="hamd-admin-nav__label">{section.label}</p>
          <ul>
            {section.items.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.href}
                  className={() =>
                    isAdminNavCurrent(pathname, item.href)
                      ? "hamd-admin-nav__link is-current"
                      : "hamd-admin-nav__link"
                  }
                  end={item.href === "/"}
                  title={item.label}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="hamd-admin-nav__icon" aria-hidden="true">
                    <AdminNavIcon name={item.icon} />
                  </span>
                  <span className="hamd-admin-nav__text">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div
      className="hamd-admin-shell"
      data-collapsed={collapsed ? "true" : "false"}
      data-drawer={drawerOpen ? "open" : "closed"}
    >
      <aside
        ref={drawerRef}
        id={drawerId}
        className="hamd-admin-sidebar"
        data-open={drawerOpen ? "true" : "false"}
        aria-label="Operations"
      >
        <div className="hamd-admin-brand">
          {collapsed ? (
            <button
              type="button"
              className="hamd-admin-brand__toggle"
              aria-label="Open navigation"
              title="Open navigation"
              aria-pressed="true"
              onClick={() => setCollapsed(false)}
            >
              <img src="/almahbub.svg" alt="" width={28} height={28} />
              <span className="hamd-admin-brand__toggle-icon" aria-hidden="true">
                <AdminCollapseIcon collapsed />
              </span>
            </button>
          ) : (
            <>
              <div className="hamd-admin-brand__identity">
                <img src="/almahbub.svg" alt="" width={28} height={28} />
                <div className="hamd-admin-brand__copy">
                  <p className="hamd-admin-brand__name">Almahbub</p>
                  <p className="hamd-admin-brand__sub">Operations</p>
                </div>
              </div>
              <div className="hamd-admin-brand__actions">
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="hamd-admin-sidebar__close"
                  aria-label="Close navigation"
                  onClick={closeDrawer}
                >
                  <AdminCloseIcon />
                </button>
                <button
                  type="button"
                  className="hamd-admin-sidebar__collapse"
                  aria-pressed={collapsed}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  onClick={() => setCollapsed(true)}
                >
                  <AdminCollapseIcon collapsed={false} />
                </button>
              </div>
            </>
          )}
        </div>
        {nav}
        <div className="hamd-admin-sidebar__foot">
          <a className="hamd-admin-nav__link" href={PUBLIC_SITE} title="View website">
            <span className="hamd-admin-nav__icon" aria-hidden="true">
              <AdminNavIcon name="website" />
            </span>
            <span className="hamd-admin-nav__text">View website</span>
          </a>
          <Link
            className="hamd-admin-nav__link"
            to="/account"
            title="My account"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="hamd-admin-nav__icon" aria-hidden="true">
              <AdminNavIcon name="account" />
            </span>
            <span className="hamd-admin-nav__text">My account</span>
          </Link>
          <button
            type="button"
            className="hamd-admin-nav__link hamd-admin-nav__link--button"
            title="Sign out"
            onClick={() => void auth.logout()}
          >
            <span className="hamd-admin-nav__icon" aria-hidden="true">
              <AdminNavIcon name="signout" />
            </span>
            <span className="hamd-admin-nav__text">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="hamd-admin-frame">
        <header className="hamd-admin-header">
          <button
            ref={menuButtonRef}
            type="button"
            className="hamd-admin-menu"
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            <span className="hamd-sr-only">
              {drawerOpen ? "Close menu" : "Open menu"}
            </span>
            {drawerOpen ? <AdminCloseIcon /> : <AdminMenuIcon />}
          </button>
          <div className="hamd-admin-header__brand">
            <p className="hamd-admin-header__kicker">Almahbub</p>
            <p className="hamd-admin-header__title">Operations</p>
          </div>
          <p className="hamd-admin-header__page">{title}</p>
          <div className="hamd-admin-header__tools">
            <ThemeToggle />
            <AdminNotificationMenu />
            <div className="hamd-admin-profile" ref={profileRef}>
              <button
                type="button"
                className="hamd-admin-profile__trigger"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="hamd-admin-avatar" aria-hidden="true">
                  {initials(userLabel, auth.user?.email)}
                </span>
                <span className="hamd-admin-profile__meta">
                  <strong>{userLabel}</strong>
                  <span>{roleLabel}</span>
                </span>
              </button>
              {profileOpen ? (
                <div className="hamd-admin-profile__menu" role="menu">
                  <Link role="menuitem" to="/account" onClick={() => setProfileOpen(false)}>
                    My account
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      void auth.logout();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main id="admin-main" className="hamd-admin-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <div className="hamd-admin-layer">
        <a className="hamd-admin-skip" href="#admin-main">
          Skip to main content
        </a>
        {drawerOpen ? (
          <button
            type="button"
            className="hamd-admin-backdrop"
            aria-label="Close navigation"
            onClick={closeDrawer}
          />
        ) : null}
      </div>
    </div>
  );
}

export { AdminShell as OpsShell };
