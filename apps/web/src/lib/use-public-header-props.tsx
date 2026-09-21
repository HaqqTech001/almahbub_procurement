import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type {
  GlobalHeaderProps,
  NavLinkItem,
  ThemeMode,
} from "@hamd/ui/navigation";

import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import { homepageHeader } from "../content/homepage.js";
import { INTEGRATED_EXPORT_BRAND } from "../content/group.js";
import { PROCUREMENT_HOME, publicLinks, publicServiceMenus } from "../content/public-navigation.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";

/** Public navigation remains public for signed-in buyers. */
export function buildAuthenticatedPublicHeaderLinks(
  links: readonly NavLinkItem[],
  _authenticated: boolean,
): NavLinkItem[] {
  void _authenticated; // Session state must not change public destinations.
  return links.filter((link, index) => links.findIndex((item) => item.href === link.href) === index)
    .map((link) => link.id === "home" ? { ...link, label: "Home", href: "/" } : { ...link });
}

type Options = {
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  transparentUntilScroll?: boolean;
  notificationCount?: number;
};

/**
 * Auth-aware public header props shared by RootLayout and Homepage.
 * Guest chrome: logo | primary links | search · theme · Sign In · Sign Up.
 * Authenticated public browse: same links + notify/avatar (workspace owns tours).
 */
export function usePublicHeaderProps(options: Options = {}): GlobalHeaderProps {
  const auth = useOptionalAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    theme,
    onThemeChange,
    transparentUntilScroll,
    notificationCount = 0,
  } = options;

  const onNavigate = useCallback(
    (href: string) => {
      navigate(href);
    },
    [navigate],
  );

  const onSearchSubmit = useCallback(
    (query: string) => {
      navigate(
        query ? `/products?q=${encodeURIComponent(query)}` : "/products",
      );
    },
    [navigate],
  );

  return useMemo(() => {
    const authenticated =
      Boolean(auth?.user) && auth?.status === "authenticated";
    const userLabel =
      auth?.user?.displayName?.trim() ||
      [auth?.user?.firstName, auth?.user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      auth?.user?.email?.split("@")[0] ||
      "Account";

    const exporting = location.pathname.startsWith(IE_PATHS.home);
    const procurement = location.pathname.startsWith(PROCUREMENT_HOME) || /^\/(global-procurement|products|product)(\/|$)/.test(location.pathname);
    return {
      ...homepageHeader,
      className: "hamd-header--public",
      megaMenus: publicServiceMenus,
      brandName: exporting ? INTEGRATED_EXPORT_BRAND.wordmark : procurement ? "Almahbub International" : "Almahbub Multi-Commerce",
      brandAffiliation: exporting ? "Nigerian export supply" : procurement ? "Global procurement" : "Import & Export",
      brandAffiliationHref: exporting ? IE_PATHS.home : procurement ? PROCUREMENT_HOME : "/",
      brandLogoSrc: exporting ? INTEGRATED_EXPORT_BRAND.logoSrc : "/almahbub.svg",
      brandLogoAlt: exporting ? INTEGRATED_EXPORT_BRAND.logoAlt : "Almahbub International",
      brandHref: exporting ? IE_PATHS.home : procurement ? PROCUREMENT_HOME : "/",
      links: buildAuthenticatedPublicHeaderLinks(
        publicLinks,
        authenticated,
      ),
      requestCta: null,
      languageOptions: [],
      currentPath: location.pathname,
      onNavigate,
      onSearchSubmit,
      notificationCount,
      ...(theme ? { theme } : {}),
      ...(onThemeChange ? { onThemeChange } : {}),
      ...(transparentUntilScroll !== undefined
        ? { transparentUntilScroll }
        : {}),
      auth: authenticated
        ? {
            authenticated: true as const,
            userLabel,
            avatarUrl: null,
            dashboardHref: "/app",
            profileHref: "/app/settings",
            settingsHref: "/app/settings",
            notificationsHref: "/app/notifications",
            onSignOut: async () => {
              await auth?.logout();
              navigate("/", { replace: true });
            },
          }
        : {
            authenticated: false as const,
            signInHref: "/login",
            signUpHref: "/register",
          },
    };
  }, [
    auth,
    location.pathname,
    navigate,
    onNavigate,
    onSearchSubmit,
    notificationCount,
    onThemeChange,
    theme,
    transparentUntilScroll,
  ]);
}
