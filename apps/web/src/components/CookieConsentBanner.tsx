import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCookieConsent } from "../app/providers/CookieConsentProvider.js";

export function CookieConsentBanner() {
  const {
    ready,
    decided,
    record,
    analyticsAllowed,
    analyticsConfigured,
    acceptAll,
    acceptEssential,
    savePreferences,
    openPreferences,
    preferencesOpen,
    closePreferences,
  } = useCookieConsent();
  const [analytics, setAnalytics] = useState(analyticsAllowed);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;
    const update = () => document.documentElement.style.setProperty("--hamd-cookie-banner-height", `${banner.getBoundingClientRect().height}px`);
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(banner);
    return () => {
      observer?.disconnect();
      document.documentElement.style.removeProperty("--hamd-cookie-banner-height");
    };
  }, [ready, decided, preferencesOpen]);

  useEffect(() => {
    setAnalytics(analyticsAllowed);
  }, [analyticsAllowed, preferencesOpen]);

  if (!ready) return null;
  if (decided && !preferencesOpen) return null;

  return (
    <div ref={bannerRef} className="hamd-cookie" role="dialog" aria-label="Cookie consent">
      <div className="hamd-cookie__panel">
        <p className="hamd-cookie__title">Cookies and privacy</p>
        <p className="hamd-cookie__body">
          Essential cookies keep your session, theme, and these preferences working.
          {analyticsConfigured
            ? " Analytics load only if you allow them."
            : " No analytics or marketing scripts are currently configured on this site."}{" "}
          See the <Link to="/cookies">Cookie Policy</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
        {preferencesOpen ? (
          <fieldset className="hamd-cookie__prefs">
            <legend>Preferences</legend>
            <label>
              <input type="checkbox" checked disabled />
              Essential (always on)
            </label>
            <label>
              <input
                type="checkbox"
                checked={analytics}
                disabled={!analyticsConfigured}
                onChange={(event) => setAnalytics(event.target.checked)}
              />
              Analytics {analyticsConfigured ? "" : "(not configured)"}
            </label>
          </fieldset>
        ) : null}
        <div className="hamd-cookie__actions">
          {preferencesOpen ? (
            <>
              <button
                type="button"
                className="hamd-btn hamd-btn--primary"
                onClick={() => savePreferences({ analytics })}
              >
                Save preferences
              </button>
              <button type="button" className="hamd-btn hamd-btn--ghost" onClick={closePreferences}>
                Close
              </button>
            </>
          ) : (
            <>
              <button type="button" className="hamd-btn hamd-btn--primary" onClick={acceptAll}>
                Accept all
              </button>
              <button
                type="button"
                className="hamd-btn hamd-btn--secondary"
                onClick={acceptEssential}
              >
                Essential only
              </button>
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                onClick={() => {
                  setAnalytics(record?.analytics ?? false);
                  openPreferences();
                }}
              >
                Preferences
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
