import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useCookieConsent } from "./CookieConsentProvider.js";

type AnalyticsContextValue = {
  enabled: boolean;
  track: (event: string, payload?: Record<string, unknown>) => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue>({
  enabled: false,
  track: () => undefined,
});

/**
 * Future-ready analytics - no third-party scripts until consent is accepted
 * and a provider is configured via VITE_ANALYTICS_KEY.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { analyticsAllowed } = useCookieConsent();
  const key =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_ANALYTICS_KEY : undefined;
  const enabled = analyticsAllowed && Boolean(key);

  useEffect(() => {
    if (!enabled) {
      delete document.documentElement.dataset.analytics;
      return;
    }
    document.documentElement.dataset.analytics = "ready";
    return () => {
      delete document.documentElement.dataset.analytics;
    };
  }, [enabled]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      enabled,
      track: (event, payload) => {
        if (!enabled) return;
        if (import.meta.env.DEV) {
          console.info("[analytics]", event, payload ?? {});
        }
        // Provider SDK swap-in point (Segment/GA/PostHog) - no mock network calls.
      },
    }),
    [enabled],
  );

  return (
    <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}
