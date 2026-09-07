import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { CookieConsentBanner } from "../../components/CookieConsentBanner.js";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  CookieConsentProvider,
  parseCookieConsentRecord,
} from "./CookieConsentProvider.js";
import { AnalyticsProvider } from "./AnalyticsProvider.js";

function Host() {
  return (
    <MemoryRouter>
      <CookieConsentProvider>
        <AnalyticsProvider>
          <CookieConsentBanner />
        </AnalyticsProvider>
      </CookieConsentProvider>
    </MemoryRouter>
  );
}

describe("cookie consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.analytics;
  });

  it("parses versioned records and legacy strings", () => {
    expect(parseCookieConsentRecord(null)).toBeNull();
    expect(parseCookieConsentRecord("accepted")?.analytics).toBe(true);
    expect(parseCookieConsentRecord("essential")?.analytics).toBe(false);
    expect(
      parseCookieConsentRecord(
        JSON.stringify({
          version: COOKIE_CONSENT_VERSION,
          timestamp: "2026-09-02T00:00:00.000Z",
          essential: true,
          analytics: true,
        }),
      )?.analytics,
    ).toBe(true);
    expect(
      parseCookieConsentRecord(
        JSON.stringify({ version: 1, analytics: true }),
      ),
    ).toBeNull();
  });

  it("shows the banner on first visit and persists accept all", async () => {
    render(<Host />);
    expect(await screen.findByRole("dialog", { name: /cookie consent/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /accept all/i }));
    const stored = parseCookieConsentRecord(
      window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY),
    );
    expect(stored?.analytics).toBe(true);
    expect(stored?.version).toBe(COOKIE_CONSENT_VERSION);
    expect(screen.queryByRole("dialog", { name: /cookie consent/i })).not.toBeInTheDocument();
  });

  it("persists essential only and does not enable analytics dataset", async () => {
    render(<Host />);
    fireEvent.click(await screen.findByRole("button", { name: /essential only/i }));
    expect(parseCookieConsentRecord(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY))?.analytics).toBe(
      false,
    );
    expect(document.documentElement.dataset.analytics).toBeUndefined();
  });

  it("opens preferences and saves the exact selection", async () => {
    render(<Host />);
    fireEvent.click(await screen.findByRole("button", { name: /^preferences$/i }));
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }));
    expect(parseCookieConsentRecord(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY))?.analytics).toBe(
      false,
    );
  });
});
