import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useTheme } from "../app/providers/ThemeProvider.js";
import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import { ButtonLink, Container } from "../components/index.js";
import { cx } from "../components/cx.js";
import {
  ALMAHBUB_INTEGRATED_EXPORT,
  ALMAHBUB_INTERNATIONAL,
  GROUP,
  INTEGRATED_EXPORT_BRAND,
} from "../content/group.js";
import { SITE } from "../content/site.js";
import { applyPageSeo } from "../lib/seo.js";
import { IeHashRedirect } from "./IeHashRedirect.js";
import {
  IE_BASE_PATH,
  IE_CTA,
  IE_PATHS,
  IE_PRIMARY_NAV,
  ieQuoteActionHref,
  isIePathActive,
} from "./ie-paths.js";

function applyBrandCssVars(root: HTMLElement, mode: "light" | "dark") {
  const vars = INTEGRATED_EXPORT_BRAND.cssVars[mode];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

function PortalThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();
  const isDark = (theme === "system" ? resolved : theme) === "dark";
  return (
    <button
      type="button"
      className={cx("hamd-aie-portal__theme", isDark && "is-dark")}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M17 14.5A7 7 0 1 1 9.5 7 5.5 5.5 0 0 0 17 14.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Dedicated IE portal shell: navbar, outlet, footer.
 * Does not wrap International GlobalHeader/GlobalFooter.
 */
export function IntegratedExportLayout() {
  const drawerId = useId();
  const backdropId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [navOpen, setNavOpen] = useState(false);
  const { resolved } = useTheme();
  const location = useLocation();
  const auth = useOptionalAuth();
  const quoteHref = ieQuoteActionHref({
    authenticated: auth?.status === "authenticated",
  });
  const business = ALMAHBUB_INTEGRATED_EXPORT;

  useEffect(() => {
    applyPageSeo({
      title: `${business.name} | Almahbub Group`,
      description: business.summary,
      path: location.pathname.startsWith(IE_BASE_PATH)
        ? location.pathname
        : IE_BASE_PATH,
    });
  }, [business, location.pathname]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.business = INTEGRATED_EXPORT_BRAND.slug;
    applyBrandCssVars(root, resolved);
    return () => {
      delete root.dataset.business;
      for (const key of Object.keys(INTEGRATED_EXPORT_BRAND.cssVars.light)) {
        root.style.removeProperty(key);
      }
    };
  }, [resolved]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      menuRef.current?.focus();
    };
  }, [navOpen]);

  return (
    <div className={cx("hamd-aie-portal", navOpen && "is-nav-open")}>
      <IeHashRedirect />
      <a className="hamd-skip-link" href="#main-content">
        Skip to content
      </a>

      {navOpen ? (
        <button
          type="button"
          id={backdropId}
          className="hamd-aie-portal__backdrop"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <header className="hamd-aie-portal__header">
        <Container className="hamd-aie-portal__header-inner">
          <div className="hamd-aie-portal__brand">
            <Link
              to={IE_PATHS.home}
              className="hamd-aie-portal__wordmark"
              aria-label={INTEGRATED_EXPORT_BRAND.wordmark}
            >
              {INTEGRATED_EXPORT_BRAND.logoSrc ? (
                <img
                  src={INTEGRATED_EXPORT_BRAND.logoSrc}
                  alt={INTEGRATED_EXPORT_BRAND.logoAlt}
                  decoding="async"
                />
              ) : null}
              <span aria-hidden="true">
                <span className="hamd-aie-portal__wordmark-main hamd-aie-portal__wordmark-main--full">
                  Almahbub Integrated Export
                </span>
                <span className="hamd-aie-portal__wordmark-main hamd-aie-portal__wordmark-main--short">
                  {INTEGRATED_EXPORT_BRAND.wordmarkShort}
                </span>
                <span className="hamd-aie-portal__wordmark-sub">Ltd.</span>
              </span>
            </Link>
            <p className="hamd-aie-portal__endorsement">
              <Link to={GROUP.href}>{INTEGRATED_EXPORT_BRAND.endorsement}</Link>
            </p>
          </div>

          <nav className="hamd-aie-portal__nav" aria-label="Integrated Export">
            {IE_PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.id}
                to={item.href}
                end={item.id === "home"}
                className={({ isActive }) =>
                  cx(
                    "hamd-aie-portal__nav-link",
                    (isActive || isIePathActive(location.pathname, item)) &&
                      "is-active",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hamd-aie-portal__actions">
            <Link to={GROUP.href} className="hamd-aie-portal__group-link">
              Almahbub Group
            </Link>
            <PortalThemeToggle />
            <ButtonLink
              href={quoteHref}
              variant="primary"
              className="hamd-aie-portal__enquire"
            >
              {IE_CTA.label}
            </ButtonLink>
            <button
              ref={menuRef}
              type="button"
              className="hamd-aie-portal__menu"
              aria-expanded={navOpen}
              aria-controls={drawerId}
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
              title={navOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </Container>

        <div
          id={drawerId}
          className={cx("hamd-aie-portal__drawer", navOpen && "is-open")}
          hidden={!navOpen}
          role="dialog"
          aria-modal={navOpen}
          aria-label="Integrated Export menu"
        >
          <Container className="hamd-aie-portal__drawer-inner">
            <div className="hamd-aie-portal__drawer-top">
              <p className="hamd-aie-portal__drawer-title">Integrated Export</p>
              <button
                ref={closeRef}
                type="button"
                className="hamd-aie-portal__drawer-close"
                aria-label="Close navigation"
                title="Close navigation"
                onClick={() => setNavOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <nav aria-label="Integrated Export mobile">
              <ul className="hamd-aie-portal__drawer-list">
                {IE_PRIMARY_NAV.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      to={item.href}
                      end={item.id === "home"}
                      className={({ isActive }) =>
                        cx(
                          "hamd-aie-portal__drawer-link",
                          (isActive ||
                            isIePathActive(location.pathname, item)) &&
                            "is-active",
                        )
                      }
                      onClick={() => setNavOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                    {item.id === "commodities" ? (
                      <ul className="hamd-aie-portal__drawer-sub">
                        <li>
                          <NavLink
                            to={IE_PATHS.commodities}
                            className="hamd-aie-portal__drawer-sublink"
                            onClick={() => setNavOpen(false)}
                          >
                            All Commodities
                          </NavLink>
                        </li>
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="hamd-aie-portal__drawer-cta">
              <Link
                to={quoteHref}
                className="hamd-btn hamd-btn--primary hamd-aie-portal__cta"
                onClick={() => setNavOpen(false)}
              >
                {IE_CTA.label}
              </Link>
            </div>
            <p className="hamd-aie-portal__drawer-meta">
              <Link to={GROUP.href} onClick={() => setNavOpen(false)}>
                Almahbub Group
              </Link>
              {" · "}
              <Link to={ALMAHBUB_INTERNATIONAL.href} onClick={() => setNavOpen(false)}>
                Almahbub International
              </Link>
            </p>
          </Container>
        </div>
      </header>

      <main id="main-content" className="hamd-aie-portal__main">
        <Outlet />
      </main>

      <footer className="hamd-aie-portal__footer">
        <Container>
          <div className="hamd-aie-portal__footer-grid">
            <div className="hamd-aie-portal__footer-brand-block">
              <p className="hamd-aie-portal__footer-brand">
                Almahbub Integrated Export Ltd.
              </p>
              <p className="hamd-aie-portal__footer-endorsement">
                <Link to={GROUP.href}>Part of Almahbub Group</Link>
              </p>
            </div>
            <nav
              className="hamd-aie-portal__footer-col"
              aria-label="Portal footer navigation"
            >
              <p className="hamd-aie-portal__footer-heading">Navigation</p>
              <ul>
                {IE_PRIMARY_NAV.map((item) => (
                  <li key={item.id}>
                    <Link to={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav
              className="hamd-aie-portal__footer-col"
              aria-label="Portal footer business"
            >
              <p className="hamd-aie-portal__footer-heading">Business</p>
              <ul>
                <li>
                  <Link to={quoteHref}>{IE_CTA.label}</Link>
                </li>
                <li>
                  <Link
                    to={IE_PATHS.home}
                    data-testid="aie-portal-entry-footer"
                  >
                    Almahbub Integrated Export Ltd.
                  </Link>
                </li>
              </ul>
            </nav>
            <nav
              className="hamd-aie-portal__footer-col"
              aria-label="Portal footer group"
            >
              <p className="hamd-aie-portal__footer-heading">Group</p>
              <ul>
                <li>
                  <Link to={ALMAHBUB_INTERNATIONAL.href}>Almahbub International</Link>
                </li>
                <li>
                  <Link to="/businesses/almahbub-international">
                    International profile
                  </Link>
                </li>
                <li>
                  <Link to={GROUP.href}>Almahbub Group</Link>
                </li>
              </ul>
            </nav>
            <div className="hamd-aie-portal__footer-col">
              <p className="hamd-aie-portal__footer-heading">Contact</p>
              <ul>
                <li>
                  <Link to={IE_PATHS.contact}>Contact</Link>
                </li>
                <li>
                  <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
                </li>
              </ul>
              <p className="hamd-aie-portal__footer-note">
                Group contact channel. Export-specific desk details are confirmed
                when you enquire.
              </p>
            </div>
          </div>
          <div className="hamd-aie-portal__footer-legal">
            <nav aria-label="Legal">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/cookies">Cookies</Link>
            </nav>
            <p className="hamd-aie-portal__footer-powered">Powered by HaqqTech</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
