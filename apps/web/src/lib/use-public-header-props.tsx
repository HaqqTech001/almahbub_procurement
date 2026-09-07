import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { GlobalHeaderProps, NavLinkItem, ThemeMode } from "@hamd/ui/navigation";

import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import { homepageHeader } from "../content/homepage.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";

export const AUTHENTICATED_IE_HEADER_LINK = {
  id: "integrated-export",
  label: "Almahbub Integrated Export",
  href: IE_PATHS.home,
} as const;

/**
 * Guest links stay International-only. After login, insert Integrated Export
 * once - after Products - without duplicating an existing href.
 */
/**
 * Guest links stay International-only. After login, insert Integrated Export
 * once - after Products - without duplicating an existing href.
 */
export function buildAuthenticatedPublicHeaderLinks(
  links: readonly NavLinkItem[],
  authenticated: boolean,
): NavLinkItem[] {
  const mapped: NavLinkItem[] = links.map((link) =>
    authenticated && link.href === "/"
      ? { ...link, href: "/app", label: link.id === "home" ? "Dashboard" : link.label }
      : { ...link },
  );
  if (!authenticated) return mapped;
  if (mapped.some((link) => link.href === AUTHENTICATED_IE_HEADER_LINK.href)) {
    return mapped;
  }
  const productsIndex = mapped.findIndex((link) => link.id === "products");
  const insertAt = productsIndex >= 0 ? productsIndex + 1 : mapped.length;
  return [
    ...mapped.slice(0, insertAt),
    { ...AUTHENTICATED_IE_HEADER_LINK },
    ...mapped.slice(insertAt),
  ];
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
      navigate(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
    },
    [navigate],
  );

  return useMemo(() => {
    const authenticated = Boolean(auth?.user) && auth?.status === "authenticated";
    const userLabel =
      auth?.user?.displayName?.trim() ||
      [auth?.user?.firstName, auth?.user?.lastName].filter(Boolean).join(" ").trim() ||
      auth?.user?.email?.split("@")[0] ||
      "Account";

    return {
      ...homepageHeader,
      brandLogoSrc: "/almahbub.svg",
      brandLogoAlt: "Almahbub International",
      brandHref: authenticated ? "/app" : homepageHeader.brandHref ?? "/",
      links: buildAuthenticatedPublicHeaderLinks(
        homepageHeader.links ?? [],
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
