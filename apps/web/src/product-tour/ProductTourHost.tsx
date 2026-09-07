/**
 * Platform Product Tour host - role resolution, catalog loading, persistence.
 * Architecture: engine in `@hamd/ui/guidance`; this module is the V2 web adapter.
 */

import { Component, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  GuideControl,
  GuidanceRoot,
  createStaticTourCatalog,
  createRemoteTourCatalog,
  guidanceTipsFixture,
  guidanceToursFixture,
  loadCatalogTips,
  loadCatalogTours,
  resolveProductTourRole,
  type GuidanceTour,
  type GuidanceTip,
  type GuidanceUserPreference,
  type GuidanceUserProgress,
  type ProductTourCatalog,
  type ProductTourRole,
  type UpdateGuidancePreferenceInput,
  type UpsertGuidanceProgressInput,
} from "@hamd/ui/guidance";

import "../styles/product-tour.css";
import "@hamd/ui/guidance.css";
import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import {
  dismissTipId,
  loadDismissedTipIds,
  loadGuidancePreference,
  loadGuidanceProgress,
  resetGuidanceProgress,
  restartAllGuidance,
  saveGuidanceProgress,
  updateGuidancePreference,
} from "../auth/onboarding/guidance-store.js";

class GuidanceErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[GuidanceErrorBoundary]", error.message, error.stack, info.componentStack);
  }
  override render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export { createRemoteTourCatalog, createStaticTourCatalog };

const AUTH_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/otp",
  "/invite",
  "/unauthorized",
  "/session-expired",
  "/account-locked",
  "/__e2e__",
];

/** Default static catalog - swap for remote CMS without rewriting hosts. */
export const defaultProductTourCatalog: ProductTourCatalog =
  createStaticTourCatalog({
    id: "hamd-web-static",
    catalogVersion: 2,
    tours: guidanceToursFixture,
    tips: guidanceTipsFixture,
  });

/**
 * Map routes → tour page keys for auto-offer.
 */
export function resolveTourPageKey(pathname: string): string {
  if (pathname === "/" || pathname === "/home") return "public_home";
  if (pathname.startsWith("/app/requests/new")) return "request_wizard";
  if (pathname.startsWith("/app/requests")) return "procurement_requests";
  if (pathname.startsWith("/app/quotations")) return "quotations";
  if (pathname.startsWith("/app/shipments")) return "shipments";
  if (pathname.startsWith("/app/notifications")) return "notifications";
  if (pathname.startsWith("/app/chat")) return "chat";
  if (pathname.startsWith("/app/profile")) return "settings";
  if (pathname.startsWith("/app/settings")) return "settings";
  if (pathname === "/app" || pathname === "/app/") return "dashboard";
  if (pathname.startsWith("/app")) return "dashboard";
  if (pathname.startsWith("/products") || pathname.startsWith("/product/")) {
    return "catalog";
  }
  if (pathname.startsWith("/about")) return "public_home";
  return "public_home";
}

export function isAuthChromePath(pathname: string): boolean {
  return AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function useTourPersistence() {
  const [preference, setPreference] = useState<GuidanceUserPreference>(() =>
    loadGuidancePreference(),
  );
  const [progress, setProgress] = useState<GuidanceUserProgress[]>(() =>
    loadGuidanceProgress(),
  );
  const [dismissedTipIds, setDismissedTipIds] = useState<string[]>(() =>
    loadDismissedTipIds(),
  );

  const handlers = useMemo(
    () => ({
      onUpdatePreference: async (input: UpdateGuidancePreferenceInput) => {
        const patch: Partial<GuidanceUserPreference> = {
          ...(input.mode ? { mode: input.mode } : {}),
          ...(input.neverAutoStart !== undefined
            ? { neverAutoStart: input.neverAutoStart }
            : {}),
          ...(input.locale ? { locale: input.locale } : {}),
          ...(input.suppressedTourKeys
            ? { suppressedTourKeys: input.suppressedTourKeys }
            : {}),
          ...(input.welcomeCompleted
            ? { welcomeCompletedAt: new Date().toISOString() }
            : {}),
          ...(input.welcomeCompleted === false
            ? { welcomeCompletedAt: null }
            : {}),
        };
        setPreference(updateGuidancePreference(patch));
      },
      onUpsertProgress: async (input: UpsertGuidanceProgressInput) => {
        setProgress((current) => {
          const existing = current.find((item) => item.tourId === input.tourId);
          const without = current.filter((item) => item.tourId !== input.tourId);
          const next: GuidanceUserProgress[] = [
            ...without,
            {
              tourId: input.tourId,
              tourKey: existing?.tourKey ?? input.tourId,
              status: input.status,
              completedSteps: input.completedSteps ?? 0,
              totalSteps: input.totalSteps ?? 0,
              lastActiveAt: new Date().toISOString(),
              ...(input.currentStepKey !== undefined
                ? { currentStepKey: input.currentStepKey }
                : {}),
              ...(input.tourVersion !== undefined
                ? { tourVersion: input.tourVersion }
                : {}),
              ...(input.pausedAt !== undefined
                ? { pausedAt: input.pausedAt }
                : {}),
            },
          ];
          saveGuidanceProgress(next);
          return next;
        });
      },
      onDismissTip: async (tipId: string) => {
        setDismissedTipIds(dismissTipId(tipId));
      },
      onResetProgress: async (scope: "current" | "all", tourId?: string) => {
        resetGuidanceProgress(scope, tourId);
        setProgress(loadGuidanceProgress());
        if (scope === "all") {
          setPreference(restartAllGuidance());
          setDismissedTipIds([]);
        }
      },
    }),
    [],
  );

  return { preference, progress, dismissedTipIds, handlers, setPreference };
}

export type ProductTourHostProps = {
  children: ReactNode;
  catalog?: ProductTourCatalog | undefined;
  /** Force role (tests). Otherwise resolved from auth. */
  role?: ProductTourRole | undefined;
  /** Public visitor surface - no welcome modal / tips. */
  variant?: "public" | "authenticated" | undefined;
  currentPageKey?: string | undefined;
  welcomeBrandName?: string | undefined;
  topBarControl?: boolean | undefined;
};

/**
 * Interactive Product Tour host for the authenticated buyer portal (`/app`).
 */
export function ProductTourHost({
  children,
  catalog = defaultProductTourCatalog,
  role: roleProp,
  variant = "authenticated",
  currentPageKey: pageKeyProp,
  welcomeBrandName = "Almahbub International",
  topBarControl = false,
}: ProductTourHostProps) {
  const location = useLocation();
  const auth = useOptionalAuth();
  const { preference, progress, dismissedTipIds, handlers } =
    useTourPersistence();
  const [tours, setTours] = useState<GuidanceTour[]>(() => [
    ...guidanceToursFixture,
  ]);
  const [tips, setTips] = useState<GuidanceTip[]>(() => [
    ...guidanceTipsFixture,
  ]);

  const role = useMemo<ProductTourRole>(() => {
    if (roleProp) return roleProp;
    return resolveProductTourRole({
      isAuthenticated: Boolean(auth?.user),
      permissions: auth?.permissions,
    });
  }, [auth?.permissions, auth?.user, roleProp]);

  const currentPageKey = pageKeyProp ?? resolveTourPageKey(location.pathname);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [nextTours, nextTips] = await Promise.all([
          loadCatalogTours(catalog),
          loadCatalogTips(catalog),
        ]);
        if (cancelled) return;
        setTours(Array.isArray(nextTours) ? nextTours : [...guidanceToursFixture]);
        setTips(Array.isArray(nextTips) ? nextTips : [...guidanceTipsFixture]);
      } catch (error) {
        console.error("[ProductTourHost] catalog load failed", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  const publicPreference: GuidanceUserPreference =
    variant === "public"
      ? {
          ...preference,
          /* Public auto-starts without enterprise welcome modal. */
          welcomeCompletedAt:
            preference.welcomeCompletedAt ?? "1970-01-01T00:00:00.000Z",
        }
      : preference;

  return (
    <GuidanceErrorBoundary fallback={children}>
      <GuidanceRoot
        preference={publicPreference}
        tours={tours}
        tips={tips}
        progress={progress}
        dismissedTipIds={dismissedTipIds}
        currentPageKey={currentPageKey}
        handlers={handlers}
        role={role}
        autoStart
        enabled
        welcomeBrandName={welcomeBrandName}
        showWelcome={variant === "authenticated"}
        showLearningCenter={variant === "authenticated"}
        showFeatureDiscovery={variant === "authenticated"}
        showSmartHelp={variant === "authenticated"}
      >
        {topBarControl ? (
          <div className="hamd-product-tour-control hamd-product-tour-control--inline">
            <GuideControl label="Help" />
          </div>
        ) : null}
        {variant === "authenticated" && currentPageKey === "request_wizard" ? (
          <div className="hamd-product-tour-control hamd-product-tour-control--fab">
            <GuideControl label="Guide" />
          </div>
        ) : null}
        {children}
      </GuidanceRoot>
    </GuidanceErrorBoundary>
  );
}
