import { useEffect, useLayoutEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { useTheme } from "../app/providers/ThemeProvider.js";
import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import { Container } from "../components/index.js";
import { GlobalHeader } from "@hamd/ui/navigation";
import { usePublicHeaderProps } from "../lib/use-public-header-props.js";
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
} from "./ie-paths.js";

function applyBrandCssVars(root: HTMLElement, mode: "light" | "dark") {
  const vars = INTEGRATED_EXPORT_BRAND.cssVars[mode];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

/** Shared public navigation with the existing export identity and footer. */
export function IntegratedExportLayout() {
  const { resolved, theme, setTheme } = useTheme();
  const header = usePublicHeaderProps({ theme, onThemeChange: setTheme, transparentUntilScroll: false });
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

  return (
    <div className="hamd-aie-portal">
      <IeHashRedirect />
      <GlobalHeader {...header} />

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
                    <Link to={item.href}>{item.id === "home" ? "Export overview" : item.label}</Link>
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
