import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ClientWorkspaceShell } from "@hamd/ui/dashboard";
import { GuideControl, useOptionalGuidance } from "@hamd/ui/guidance";
import {
  resolveProductTourRole,
  type ProductTourRole,
} from "@hamd/ui/guidance";

import "../../styles/workspace.js";
import { HostLoading } from "../../components/HostChrome.js";
import { useTheme } from "../../app/providers/ThemeProvider.js";
import { useAuth } from "../session/AuthProvider.js";
import { CustomerNotificationMenu } from "../../notifications/CustomerNotificationMenu.js";
import {
  fetchUnreadNotificationCount,
  requireNotificationToken,
} from "../../notifications/notification-api.js";
import { ProductTourHost, resolveTourPageKey } from "../../product-tour/ProductTourHost.js";
import { buildBuyerWorkspaceNav } from "./buyer-workspace-nav.js";

function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith("/app/requests/new")) return "New request";
  if (pathname.startsWith("/app/requests")) return "My requests";
  if (pathname.startsWith("/app/quotations/compare")) return "Compare quotations";
  if (pathname.startsWith("/app/quotations/history")) return "Quotation history";
  if (pathname.startsWith("/app/quotations")) return "My quotations";
  if (pathname.startsWith("/app/invoices")) return "My invoices";
  if (pathname.startsWith("/app/payments")) return "My payments";
  if (pathname.startsWith("/app/shipments")) return "My shipments";
  if (pathname.startsWith("/app/notifications")) return "Notifications";
  if (pathname.startsWith("/app/products")) return "Products";
  if (pathname.startsWith("/app/agro-produce")) return "Agro Produce";
  if (pathname.startsWith("/app/announcements")) return "Announcements";
  if (pathname.startsWith("/app/chat")) return "Chat";
  if (pathname.startsWith("/app/profile")) return "Profile";
  if (pathname.startsWith("/app/settings")) return "Account settings";
  return "Overview";
}

function WorkspaceGuideSlot({ onReady }: { onReady: (open: () => void) => void }) {
  const guidance = useOptionalGuidance();
  useEffect(() => {
    onReady(() => {
      guidance?.openHelpCenter();
    });
  }, [guidance, onReady]);
  return <GuideControl label="Help / Guided tour" />;
}

/**
 * Authenticated client workspace - application shell (sidebar + utilities).
 * Public marketing chrome never mounts here.
 */
export function WorkspaceShell() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const openHelpRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await requireNotificationToken(auth.ensureSession);
        const count = await fetchUnreadNotificationCount(token);
        if (!cancelled) setUnreadCount(count);
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.ensureSession, location.pathname]);

  const userLabel = useMemo(() => {
    if (!auth.user) return "Account";
    return (
      auth.user.displayName ||
      `${auth.user.firstName} ${auth.user.lastName}`.trim() ||
      auth.user.email
    );
  }, [auth.user]);

  const role: ProductTourRole = useMemo(
    () =>
      resolveProductTourRole({
        isAuthenticated: true,
        permissions: auth.permissions,
      }),
    [auth.permissions],
  );

  const navSections = useMemo(
    () => buildBuyerWorkspaceNav(location.pathname),
    [location.pathname],
  );

  const pageTitle = resolvePageTitle(location.pathname);

  const onSignOut = useCallback(async () => {
    await auth.logout();
    navigate("/", { replace: true });
  }, [auth, navigate]);

  const onSearchSubmit = useCallback(
    (query: string) => {
      if (!query) {
        navigate("/app/requests");
        return;
      }
      navigate(`/app/requests?q=${encodeURIComponent(query)}`);
    },
    [navigate],
  );

  return (
    <ProductTourHost
      variant="authenticated"
      role={role}
      currentPageKey={resolveTourPageKey(location.pathname)}
      welcomeBrandName="Almahbub International"
    >
      <ClientWorkspaceShell
        brandLabel="Almahbub International"
        brandHref="/app"
        brandLogoSrc="/almahbub.svg"
        userLabel={userLabel}
        userEmail={auth.user?.email}
        profileHref="/app/profile"
        settingsHref="/app/settings"
        navSections={navSections}
        pageTitle={pageTitle}
        notificationsHref="/app/notifications"
        notificationCount={unreadCount}
        notificationsMenu={<CustomerNotificationMenu />}
        theme={theme}
        onThemeChange={setTheme}
        onSignOut={onSignOut}
        onHelp={() => openHelpRef.current?.()}
        onSearchSubmit={onSearchSubmit}
        onNavigate={(href) => navigate(href)}
        topBarExtra={
          <WorkspaceGuideSlot
            onReady={(fn) => {
              openHelpRef.current = fn;
            }}
          />
        }
      >
        <Suspense fallback={<HostLoading label="Loading page…" />}>
          <Outlet />
        </Suspense>
      </ClientWorkspaceShell>
    </ProductTourHost>
  );
}

export { WorkspaceHomePage } from "./WorkspaceHomePage.js";


