import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const COOKIE_CONSENT_STORAGE_KEY = "hamd.web.cookie-consent";
export const COOKIE_CONSENT_VERSION = 2;

export type CookieConsentRecord = {
  version: number;
  timestamp: string;
  essential: true;
  analytics: boolean;
};

type CookieConsentContextValue = {
  ready: boolean;
  decided: boolean;
  record: CookieConsentRecord | null;
  analyticsAllowed: boolean;
  analyticsConfigured: boolean;
  acceptAll: () => void;
  acceptEssential: () => void;
  savePreferences: (input: { analytics: boolean }) => void;
  openPreferences: () => void;
  preferencesOpen: boolean;
  closePreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

function analyticsKeyPresent(): boolean {
  if (typeof import.meta === "undefined") return false;
  return Boolean(import.meta.env?.VITE_ANALYTICS_KEY);
}

export function parseCookieConsentRecord(raw: string | null): CookieConsentRecord | null {
  if (!raw) return null;
  if (raw === "accepted") {
    return {
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: true,
    };
  }
  if (raw === "essential") {
    return {
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: false,
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== "boolean") return null;
    return {
      version: COOKIE_CONSENT_VERSION,
      timestamp:
        typeof parsed.timestamp === "string"
          ? parsed.timestamp
          : new Date().toISOString(),
      essential: true,
      analytics: parsed.analytics,
    };
  } catch {
    return null;
  }
}

function readRecord(): CookieConsentRecord | null {
  try {
    return parseCookieConsentRecord(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeRecord(record: CookieConsentRecord): void {
  try {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify(record),
    );
  } catch {
    /* ignore quota */
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<CookieConsentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    setRecord(readRecord());
    setReady(true);
    const onOpen = () => setPreferencesOpen(true);
    window.addEventListener("hamd:open-cookie-preferences", onOpen);
    return () => window.removeEventListener("hamd:open-cookie-preferences", onOpen);
  }, []);

  const persist = useCallback((analytics: boolean) => {
    const next: CookieConsentRecord = {
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      essential: true,
      analytics,
    };
    writeRecord(next);
    setRecord(next);
    setPreferencesOpen(false);
  }, []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      ready,
      decided: record !== null,
      record,
      analyticsAllowed: Boolean(record?.analytics),
      analyticsConfigured: analyticsKeyPresent(),
      acceptAll: () => persist(true),
      acceptEssential: () => persist(false),
      savePreferences: (input) => persist(input.analytics),
      openPreferences: () => setPreferencesOpen(true),
      preferencesOpen,
      closePreferences: () => setPreferencesOpen(false),
    }),
    [ready, record, persist, preferencesOpen],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
