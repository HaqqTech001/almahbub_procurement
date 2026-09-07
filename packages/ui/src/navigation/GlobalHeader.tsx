import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { ButtonLink } from "../primitives/ButtonLink.js";
import { cx } from "../utils/cx.js";

export type NavLinkItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
};

export type MegaMenuColumn = {
  id: string;
  title: string;
  items: readonly NavLinkItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
};

export type MegaMenuConfig = {
  id: string;
  label: string;
  columns: readonly MegaMenuColumn[];
  requestHref?: string;
};

export type ThemeMode = "light" | "dark" | "system";

export type HeaderAuthGuest = {
  authenticated: false;
  signInHref?: string;
  signUpHref?: string;
};

export type HeaderAuthUser = {
  authenticated: true;
  userLabel: string;
  avatarUrl?: string | null;
  /** Workspace entry - not a full application nav substitute. */
  dashboardHref?: string;
  profileHref?: string;
  settingsHref?: string;
  notificationsHref?: string;
  /** Portal-only product tour / learning center. Omit on public marketing chrome. */
  onHelp?: (() => void) | undefined;
  onSignOut?: () => void | Promise<void>;
};

export type HeaderAuthSession = HeaderAuthGuest | HeaderAuthUser;

export type GlobalHeaderProps = {
  brandName?: string;
  brandHref?: string;
  brandLogoSrc?: string;
  brandLogoAlt?: string;
  /**
   * Restrained corporate endorsement under the operating brand.
   * Hidden on compact breakpoints so the navbar stays uncrowded.
   */
  brandAffiliation?: string;
  brandAffiliationHref?: string;
  /**
   * Optional conversion CTA. Public marketing chrome omits this by default -
   * keep Request Procurement in hero/section surfaces, not the global navbar.
   * Pass an object only when a surface genuinely needs it; pass `null` to force omit.
   */
  requestCta?: { href: string; label: string } | null;
  megaMenus?: readonly MegaMenuConfig[];
  /** Simple top-level links (e.g. About) without mega panels */
  links?: readonly NavLinkItem[];
  searchAction?: string;
  searchPlaceholder?: string;
  onSearchSubmit?: (query: string) => void;
  /**
   * SPA adapter for header search when `onSearchSubmit` is omitted.
   * In-app `<a href>` clicks are intercepted by the host document adapter.
   */
  onNavigate?: (href: string) => void;
  notificationCount?: number;
  notificationsHref?: string;
  onNotificationsClick?: () => void;
  /** @deprecated Prefer `auth` session chrome */
  profileLabel?: string;
  /** @deprecated Prefer `auth` session chrome */
  profileHref?: string;
  onProfileClick?: () => void;
  auth?: HeaderAuthSession;
  currentPath?: string;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  languageLabel?: string;
  /**
   * Language options for optional secondary surfaces. Empty by default so the
   * primary navbar never reserves footprint for localization.
   */
  languageOptions?: readonly { id: string; label: string; disabled?: boolean }[];
  onLanguageChange?: (id: string) => void;
  /** Compact utility slot (e.g. Help / Product Tour) - desktop utilities cluster. */
  utilityExtra?: ReactNode;
  /** Optional drawer-only slot; falls back to `utilityExtra` when omitted. */
  drawerExtra?: ReactNode;
  /** Transparent over hero until scroll threshold */
  transparentUntilScroll?: boolean;
  scrollSolidOffset?: number;
  className?: string;
};

type OpenPanel = string | "search" | "mobile" | "account" | null;

function pathMatches(currentPath: string | undefined, href: string): boolean {
  if (!currentPath) return false;
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function ThemeToggle({
  theme,
  onChange,
}: {
  theme: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}) {
  const resolved =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const next: ThemeMode = resolved === "dark" ? "light" : "dark";
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      className={cx("hamd-header__theme", isDark && "is-dark")}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      onClick={() => onChange(next)}
    >
      <span className="hamd-header__theme-track" aria-hidden="true">
        <span className="hamd-header__theme-icon hamd-header__theme-icon--sun">
          <SunIcon />
        </span>
        <span className="hamd-header__theme-icon hamd-header__theme-icon--moon">
          <MoonIcon />
        </span>
        <span className="hamd-header__theme-thumb" />
      </span>
    </button>
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

function UserAvatar({ label, src }: { label: string; src?: string | null }) {
  const initial = (label.trim()[0] ?? "A").toUpperCase();
  if (src) {
    return <img className="hamd-header__avatar-img" src={src} alt="" />;
  }
  return (
    <span className="hamd-header__avatar-fallback" aria-hidden="true">
      {initial}
    </span>
  );
}

/**
 * Unified Global Header - sticky shell, transparent→solid, mega menus (click), mobile drawer.
 * Aligns with docs/53 Enterprise Navigation System + RC-POLISH-01.
 */
export function GlobalHeader({
  brandName = "Almahbub International",
  brandHref = "/",
  brandLogoSrc = "/almahbub.svg",
  brandLogoAlt = "Almahbub International",
  brandAffiliation,
  brandAffiliationHref = "/group",
  requestCta = null,
  megaMenus = defaultMegaMenus,
  links = [{ id: "about", label: "About", href: "/about" }],
  searchAction = "/search",
  searchPlaceholder = "Search products, services, and help",
  onSearchSubmit,
  onNavigate,
  notificationCount = 0,
  notificationsHref = "/notifications",
  onNotificationsClick,
  profileLabel = "Account",
  profileHref = "/account",
  onProfileClick,
  auth,
  currentPath,
  theme = "system",
  onThemeChange,
  languageLabel = "Language",
  languageOptions = [],
  onLanguageChange,
  utilityExtra,
  transparentUntilScroll = true,
  scrollSolidOffset = 24,
  className,
}: GlobalHeaderProps) {
  const resolvedRequestCta = requestCta ?? null;
  const showLanguage = Boolean(languageOptions?.length);
  const [open, setOpen] = useState<OpenPanel>(null);
  const [solid, setSolid] = useState(!transparentUntilScroll);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState(languageOptions?.[0]?.id ?? "en");
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const drawerId = useId();
  const accountId = useId();

  const closeAll = useCallback(() => setOpen(null), []);
  const isAuthenticated = auth?.authenticated === true;
  const guestAuth = auth && !auth.authenticated ? auth : null;
  const userAuth = auth && auth.authenticated ? auth : null;

  useEffect(() => {
    const bar = barRef.current;
    const root = rootRef.current;
    if (!bar || !root) return;

    const syncOffset = () => {
      // Measure the bar only. Never write into --hamd-header-height (min-height)
      // or the ResizeObserver will grow the navbar forever.
      const measured = Math.ceil(bar.getBoundingClientRect().height);
      const occupied = Math.min(Math.max(measured, 48), 96);
      root.style.setProperty("--hamd-header-occupied", `${occupied}px`);
    };

    syncOffset();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncOffset);
      return () => window.removeEventListener("resize", syncOffset);
    }

    const observer = new ResizeObserver(syncOffset);
    observer.observe(bar);
    window.addEventListener("resize", syncOffset);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncOffset);
    };
  }, [solid, open, brandAffiliation, utilityExtra]);

  useEffect(() => {
    if (!transparentUntilScroll) {
      setSolid(true);
      return;
    }
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setSolid(y > scrollSolidOffset);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollSolidOffset, transparentUntilScroll]);

  useEffect(() => {
    setOpen(null);
  }, [currentPath]);

  useEffect(() => {
    if (open === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const previous = open;
        setOpen(null);
        if (
          typeof previous === "string" &&
          previous !== "search" &&
          previous !== "mobile" &&
          previous !== "account"
        ) {
          menuButtonRefs.current[previous]?.focus();
        }
      }
    };

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpen(null);
        return;
      }
      if (open === "account") {
        const accountRoot = rootRef.current.querySelector(".hamd-header__account");
        if (accountRoot && !accountRoot.contains(target)) {
          setOpen(null);
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    const previousOverflow = document.body.style.overflow;
    if (open === "mobile") {
      document.body.style.overflow = "hidden";
      queueMicrotask(() => drawerCloseRef.current?.focus());
    }
    if (open === "search") {
      queueMicrotask(() => searchInputRef.current?.focus());
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const toggleMega = (id: string) => {
    setOpen((current) => (current === id ? null : id));
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      const url = new URL(searchAction, window.location.origin);
      if (trimmed) url.searchParams.set("q", trimmed);
      const next = `${url.pathname}${url.search}`;
      if (onNavigate) {
        onNavigate(next);
      } else {
        window.location.assign(next);
      }
    }
    closeAll();
  };

  const onLanguageSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setLanguage(value);
    onLanguageChange?.(value);
  };

  const notifyHref =
    userAuth?.notificationsHref ?? notificationsHref ?? "/app/notifications";

  return (
    <div
      ref={rootRef}
      className={cx(
        "hamd-header-root",
        open === "mobile" && "hamd-header-root--drawer-open",
      )}
    >
      <div className="hamd-header-shell">
        <header
          ref={headerRef}
          className={cx(
            "hamd-header",
            solid ? "hamd-header--solid" : "hamd-header--transparent",
            open === "mobile" && "hamd-header--drawer-open",
            className,
          )}
        >
      <a href="#main-content" className="hamd-header__skip">
        Skip to content
      </a>

      <div ref={barRef} className="hamd-header__bar hamd-container hamd-container--wide">
        <div className="hamd-header__brand-cluster">
          <a
            href={brandHref}
            className="hamd-header__brand"
            data-guide="public-brand"
            aria-label={brandName}
          >
            {brandLogoSrc ? (
              <img
                className="hamd-header__logo"
                src={brandLogoSrc}
                alt=""
                width={36}
                height={36}
                decoding="async"
              />
            ) : null}
            <span className="hamd-header__brand-text">
              <span className="hamd-header__brand-name">{brandName.split(" ")[0] ?? brandName}</span>
              <span className="hamd-header__brand-sub">
                {brandName.includes(" ")
                  ? brandName.slice(brandName.indexOf(" ") + 1)
                  : brandLogoAlt}
              </span>
            </span>
          </a>
          {brandAffiliation ? (
            <a
              href={brandAffiliationHref}
              className="hamd-header__brand-affiliation"
            >
              {brandAffiliation}
            </a>
          ) : null}
        </div>

        <nav className="hamd-header__nav" aria-label="Primary" data-guide="public-nav">
          {megaMenus.map((menu) => {
            const expanded = open === menu.id;
            const panelId = `mega-${menu.id}`;
            return (
              <div key={menu.id} className="hamd-header__mega">
                <button
                  type="button"
                  className={cx(
                    "hamd-header__nav-trigger",
                    expanded && "is-active",
                    menu.columns.some((column) =>
                      column.items.some((item) => pathMatches(currentPath, item.href)),
                    ) && "is-current",
                  )}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  ref={(node) => {
                    menuButtonRefs.current[menu.id] = node;
                  }}
                  onClick={() => toggleMega(menu.id)}
                >
                  {menu.label}
                </button>
                <div
                  id={panelId}
                  hidden={!expanded}
                  className="hamd-header__mega-panel"
                  role="region"
                  aria-label={menu.label}
                >
                  <div className="hamd-header__mega-grid">
                    {menu.columns.map((column) => (
                      <div key={column.id} className="hamd-header__mega-col">
                        <p className="hamd-header__mega-title">{column.title}</p>
                        <ul className="hamd-header__mega-list">
                          {column.items.map((item) => (
                            <li key={item.id}>
                              <a
                                href={item.href}
                                className={cx(
                                  "hamd-header__mega-link",
                                  pathMatches(currentPath, item.href) && "is-current",
                                )}
                                aria-current={
                                  pathMatches(currentPath, item.href) ? "page" : undefined
                                }
                                onClick={closeAll}
                              >
                                <span className="hamd-header__mega-link-label">{item.label}</span>
                                {item.description ? (
                                  <span className="hamd-header__mega-link-desc">
                                    {item.description}
                                  </span>
                                ) : null}
                              </a>
                            </li>
                          ))}
                        </ul>
                        {column.viewAllHref ? (
                          <a
                            href={column.viewAllHref}
                            className="hamd-header__mega-viewall"
                            onClick={closeAll}
                          >
                            {column.viewAllLabel ?? "View all"}
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {menu.requestHref && resolvedRequestCta ? (
                    <div className="hamd-header__mega-footer">
                      <ButtonLink href={menu.requestHref}>
                        {resolvedRequestCta.label}
                      </ButtonLink>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={cx(
                "hamd-header__nav-link",
                pathMatches(currentPath, link.href) && "is-current",
              )}
              aria-current={pathMatches(currentPath, link.href) ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hamd-header__actions" data-guide="public-actions">
          <button
            type="button"
            className="hamd-header__icon-btn hamd-header__icon-btn--search"
            aria-label="Search"
            aria-expanded={open === "search"}
            aria-controls={searchId}
            onClick={() => setOpen((current) => (current === "search" ? null : "search"))}
          >
            <SearchIcon />
          </button>

          {onThemeChange ? (
            <ThemeToggle theme={theme} onChange={onThemeChange} />
          ) : null}

          {utilityExtra ? (
            <div className="hamd-header__utility-extra">{utilityExtra}</div>
          ) : null}

          {isAuthenticated && userAuth ? (
            <>
              {onNotificationsClick ? (
                <button
                  type="button"
                  className="hamd-header__icon-btn hamd-header__notify"
                  aria-label={
                    notificationCount > 0
                      ? `Notifications, ${notificationCount} unread`
                      : "Notifications"
                  }
                  onClick={onNotificationsClick}
                >
                  <BellIcon />
                  {notificationCount > 0 ? (
                    <span className="hamd-header__badge" aria-hidden="true">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  ) : null}
                </button>
              ) : (
                <a
                  href={notifyHref}
                  className="hamd-header__icon-btn hamd-header__notify"
                  aria-label={
                    notificationCount > 0
                      ? `Notifications, ${notificationCount} unread`
                      : "Notifications"
                  }
                >
                  <BellIcon />
                  {notificationCount > 0 ? (
                    <span className="hamd-header__badge" aria-hidden="true">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  ) : null}
                </a>
              )}

              <div className="hamd-header__account">
                <button
                  type="button"
                  className="hamd-header__account-btn"
                  aria-label={userAuth.userLabel}
                  aria-expanded={open === "account" || open === "mobile"}
                  aria-controls={open === "mobile" ? drawerId : accountId}
                  aria-haspopup="menu"
                  onClick={() => {
                    const narrow =
                      typeof window !== "undefined" &&
                      window.matchMedia("(max-width: 959px)").matches;
                    if (narrow) {
                      setOpen((current) => (current === "mobile" ? null : "mobile"));
                      return;
                    }
                    setOpen((current) => (current === "account" ? null : "account"));
                  }}
                >
                  <UserAvatar
                    label={userAuth.userLabel}
                    src={userAuth.avatarUrl ?? null}
                  />
                  <span className="hamd-header__account-label">{userAuth.userLabel}</span>
                </button>
                {open === "account" ? (
                  <div
                    id={accountId}
                    className="hamd-header__account-menu"
                    role="menu"
                    aria-label="Account"
                  >
                    <a
                      role="menuitem"
                      href={userAuth.profileHref ?? "/app/settings"}
                      onClick={closeAll}
                    >
                      Profile
                    </a>
                    <a
                      role="menuitem"
                      href={userAuth.settingsHref ?? userAuth.profileHref ?? "/app/settings"}
                      onClick={closeAll}
                    >
                      Account settings
                    </a>
                    {userAuth.onHelp ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="hamd-header__account-help"
                        onClick={() => {
                          closeAll();
                          userAuth.onHelp?.();
                        }}
                      >
                        Help / Product Tour
                      </button>
                    ) : null}
                    {userAuth.onSignOut ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="hamd-header__signout"
                        onClick={() => {
                          void userAuth.onSignOut?.();
                          closeAll();
                        }}
                      >
                        Sign Out
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          ) : guestAuth || !auth ? (
            <div className="hamd-header__auth">
              <a
                href={guestAuth?.signInHref ?? "/login"}
                className="hamd-header__auth-link"
              >
                Sign In
              </a>
              <a
                href={guestAuth?.signUpHref ?? "/register"}
                className="hamd-header__auth-cta"
              >
                Sign Up
              </a>
            </div>
          ) : onProfileClick ? (
            <button type="button" className="hamd-header__icon-btn" onClick={onProfileClick}>
              {profileLabel}
            </button>
          ) : (
            <a href={profileHref} className="hamd-header__icon-btn">
              {profileLabel}
            </a>
          )}

          {showLanguage ? (
            <label className="hamd-header__lang">
              <span className="hamd-header__lang-label">{languageLabel}</span>
              <select
                className="hamd-header__lang-select"
                value={language}
                aria-label={languageLabel}
                onChange={onLanguageSelect}
              >
                {languageOptions!.map((option) => (
                  <option key={option.id} value={option.id} disabled={option.disabled}>
                    {option.label}
                    {option.disabled ? " (soon)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {resolvedRequestCta ? (
            <ButtonLink
              href={resolvedRequestCta.href}
              className="hamd-header__request"
              data-guide="public-cta"
            >
              {resolvedRequestCta.label}
            </ButtonLink>
          ) : null}

          <button
            type="button"
            className={cx(
              "hamd-header__menu-btn",
              open === "mobile" && "is-open",
            )}
            aria-label={open === "mobile" ? "Close menu" : "Open menu"}
            aria-expanded={open === "mobile"}
            aria-controls={drawerId}
            data-guide="public-menu"
            onClick={() =>
              setOpen((current) => (current === "mobile" ? null : "mobile"))
            }
          >
            {open === "mobile" ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div id={searchId} className="hamd-header__search-panel" hidden={open !== "search"}>
        <form
          className="hamd-container hamd-container--wide hamd-header__search-form"
          onSubmit={submitSearch}
        >
          <label className="hamd-header__search-label" htmlFor={`${searchId}-input`}>
            Search
          </label>
          <div className="hamd-header__search-row">
            <input
              ref={searchInputRef}
              id={`${searchId}-input`}
              type="search"
              className="hamd-header__search-input"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="hamd-btn hamd-btn--primary">
              Search
            </button>
          </div>
        </form>
      </div>
    </header>
      </div>
      <div className="hamd-header-spacer" aria-hidden="true" />

      <div
        className={cx("hamd-header__drawer-backdrop", open === "mobile" && "is-open")}
        aria-hidden={open !== "mobile"}
        onClick={closeAll}
      />

      <nav
        id={drawerId}
        className={cx("hamd-header__drawer", open === "mobile" && "is-open")}
        aria-label="Mobile navigation"
        aria-hidden={open !== "mobile"}
      >
        <div className="hamd-header__drawer-head">
          <p className="hamd-header__drawer-title">Menu</p>
          <button
            ref={drawerCloseRef}
            type="button"
            className="hamd-header__icon-btn"
            aria-label="Close menu"
            onClick={closeAll}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="hamd-header__drawer-body">
          {megaMenus.map((menu) => (
            <MobileAccordion key={menu.id} menu={menu} onNavigate={closeAll} />
          ))}
          <ul className="hamd-header__drawer-links">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  aria-current={pathMatches(currentPath, link.href) ? "page" : undefined}
                  onClick={closeAll}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {showLanguage ? (
            <div className="hamd-header__drawer-utils">
              <label className="hamd-header__lang hamd-header__lang--drawer">
                <span className="hamd-header__lang-label">{languageLabel}</span>
                <select
                  className="hamd-header__lang-select"
                  value={language}
                  aria-label={languageLabel}
                  onChange={onLanguageSelect}
                >
                  {languageOptions!.map((option) => (
                    <option key={option.id} value={option.id} disabled={option.disabled}>
                      {option.label}
                      {option.disabled ? " (soon)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <div className="hamd-header__drawer-auth">
            {isAuthenticated && userAuth ? (
              <>
                <a href={userAuth.dashboardHref ?? "/app"} onClick={closeAll}>
                  Open workspace
                </a>
                <a href={userAuth.profileHref ?? "/app/settings"} onClick={closeAll}>
                  Profile
                </a>
                <a
                  href={userAuth.settingsHref ?? userAuth.profileHref ?? "/app/settings"}
                  onClick={closeAll}
                >
                  Account settings
                </a>
                {userAuth.onSignOut ? (
                  <button
                    type="button"
                    className="hamd-header__signout"
                    onClick={() => {
                      void userAuth.onSignOut?.();
                      closeAll();
                    }}
                  >
                    Sign Out
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <a href={guestAuth?.signInHref ?? "/login"} onClick={closeAll}>
                  Sign In
                </a>
                <a
                  className="hamd-header__auth-cta"
                  href={guestAuth?.signUpHref ?? "/register"}
                  onClick={closeAll}
                >
                  Sign Up
                </a>
              </>
            )}
          </div>

          {resolvedRequestCta ? (
            <ButtonLink
              href={resolvedRequestCta.href}
              className="hamd-header__drawer-request"
            >
              {resolvedRequestCta.label}
            </ButtonLink>
          ) : null}
        </div>
      </nav>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MobileAccordion({
  menu,
  onNavigate,
}: {
  menu: MegaMenuConfig;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className="hamd-header__accordion">
      <button
        type="button"
        className="hamd-header__accordion-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
        {menu.label}
      </button>
      <div id={panelId} hidden={!expanded} className="hamd-header__accordion-panel">
        {menu.columns.map((column) => (
          <div key={column.id}>
            <p className="hamd-header__mega-title">{column.title}</p>
            <ul>
              {column.items.map((item) => (
                <li key={item.id}>
                  <a href={item.href} onClick={onNavigate}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export const defaultMegaMenus: readonly MegaMenuConfig[] = [
  {
    id: "services",
    label: "Services",
    requestHref: "/request",
    columns: [
      {
        id: "core-services",
        title: "Capabilities",
        viewAllHref: "/services",
        viewAllLabel: "All services",
        items: [
          {
            id: "global-procurement",
            label: "Global Procurement",
            href: "/services",
            description: "Structured cross-border sourcing",
          },
          {
            id: "import-export",
            label: "Import & Export",
            href: "/services",
            description: "Trade execution with clear ownership",
          },
          {
            id: "logistics",
            label: "Logistics",
            href: "/services",
            description: "Planning, ETA honesty, exceptions",
          },
          {
            id: "warehousing",
            label: "Warehousing",
            href: "/services",
            description: "Storage aligned to delivery plans",
          },
        ],
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    requestHref: "/request",
    columns: [
      {
        id: "product-categories",
        title: "Product categories",
        viewAllHref: "/products",
        viewAllLabel: "Browse catalog",
        items: [
          {
            id: "industrial",
            label: "Industrial components",
            href: "/products",
            description: "Spec-driven parts with MOQ context",
          },
          {
            id: "electrical",
            label: "Electrical equipment",
            href: "/products",
            description: "Certified equipment for projects",
          },
        ],
      },
    ],
  },
  {
    id: "industries",
    label: "Industries",
    columns: [
      {
        id: "sectors",
        title: "Sectors",
        viewAllHref: "/industries",
        viewAllLabel: "All industries",
        items: [
          {
            id: "energy",
            label: "Energy",
            href: "/industries",
            description: "Long-lead equipment and compliance",
          },
          {
            id: "manufacturing",
            label: "Manufacturing",
            href: "/industries",
            description: "Repeat MOQ and multi-SKU buying",
          },
        ],
      },
    ],
  },
];
