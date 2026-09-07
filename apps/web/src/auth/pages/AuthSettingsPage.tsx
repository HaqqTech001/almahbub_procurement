import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DetailSection, Field } from "@hamd/ui/primitives";
import { useTheme } from "../../app/providers/ThemeProvider.js";
import { useCookieConsent } from "../../app/providers/CookieConsentProvider.js";
import { HostAlert, HostStatus } from "../../components/HostChrome.js";
import {
  changePasswordRequest,
  createInvitationRequest,
  forgotPasswordRequest,
} from "../api/auth-client.js";
import { AuthApiError, formatAuthError } from "../api/auth-errors.js";
import { useAuth } from "../session/AuthProvider.js";
import { getAccessToken } from "../session/token-store.js";
import {
  listNotificationPreferences,
  updateNotificationPreferences,
} from "../../notifications/notification-api.js";
import type { NotificationPreference } from "@hamd/ui/notifications";

type SettingsSection = "appearance" | "notifications" | "privacy" | "security" | "session" | "account";

const SECTIONS: Array<{ id: SettingsSection; title: string }> = [
  { id: "appearance", title: "Appearance" },
  { id: "notifications", title: "Notifications" },
  { id: "privacy", title: "Privacy" },
  { id: "security", title: "Security" },
  { id: "session", title: "Session" },
  { id: "account", title: "Account" },
];

function prefOn(
  rows: NotificationPreference[],
  type: string,
  channel: string,
): boolean {
  const row = rows.find((item) => item.type === type && item.channel === channel);
  if (row) return row.enabled;
  return true;
}

export function AuthSettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const cookies = useCookieConsent();
  const [section, setSection] = useState<SettingsSection>("appearance");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const token = getAccessToken() ?? (await auth.ensureSession());
        if (!token) return;
        setPrefs(await listNotificationPreferences(token));
      } catch {
        setPrefs([]);
      }
    })();
  }, [auth.ensureSession]);

  const setPref = async (type: string, channel: string, enabled: boolean) => {
    setError(null);
    try {
      const token = getAccessToken() ?? (await auth.ensureSession());
      if (!token) throw new Error("Sign in again to update notification preferences.");
      const next = prefs.filter((row) => !(row.type === type && row.channel === channel));
      next.push({ type, channel, enabled });
      setPrefs(await updateNotificationPreferences(token, next));
      setMessage("Notification preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save notification preferences.");
    }
  };

  const sendPasswordResetEmail = async () => {
    const email = auth.user?.email?.trim();
    if (!email) {
      setError("Your account email is unavailable. Sign in again.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await forgotPasswordRequest(email);
      setMessage("Password reset email sent. Check your inbox to continue.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the password reset email.");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = getAccessToken() ?? (await auth.ensureSession());
      if (!token) throw new Error("Sign in again to change your password.");
      await changePasswordRequest(token, { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? formatAuthError(err, "Unable to change password.")
          : err instanceof Error
            ? err.message
            : "Unable to change password.",
      );
    } finally {
      setBusy(false);
    }
  };

  const panel = useMemo(() => {
    if (section === "appearance") {
      return (
        <DetailSection title="Appearance">
          <div className="hamd-settings-row">
            <div>
              <h3>Theme</h3>
              <p>Choose light, dark, or match this device.</p>
            </div>
            <div className="hamd-settings-row__control" role="group" aria-label="Theme">
              {(["light", "dark", "system"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={theme === mode ? "hamd-btn hamd-btn--primary" : "hamd-btn hamd-btn--secondary"}
                  aria-pressed={theme === mode}
                  onClick={() => setTheme(mode)}
                >
                  {mode === "system" ? "System" : mode === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>
        </DetailSection>
      );
    }
    if (section === "notifications") {
      return (
        <DetailSection title="Notifications">
          <div className="hamd-settings-row">
            <div>
              <h3>Email updates</h3>
              <p>Receive important procurement updates by email.</p>
            </div>
            <label className="hamd-settings-row__control">
              <input
                type="checkbox"
                checked={prefOn(prefs, "procurement", "email")}
                onChange={(event) => void setPref("procurement", "email", event.target.checked)}
              />
              <span className="hamd-sr-only">Email updates</span>
            </label>
          </div>
          <div className="hamd-settings-row">
            <div>
              <h3>In-app alerts</h3>
              <p>Show procurement activity in the notification inbox.</p>
            </div>
            <label className="hamd-settings-row__control">
              <input
                type="checkbox"
                checked={prefOn(prefs, "procurement", "in_app")}
                onChange={(event) => void setPref("procurement", "in_app", event.target.checked)}
              />
              <span className="hamd-sr-only">In-app alerts</span>
            </label>
          </div>
          <div className="hamd-settings-row">
            <div>
              <h3>Announcement notices</h3>
              <p>Notify me when a new announcement is published.</p>
            </div>
            <label className="hamd-settings-row__control">
              <input
                type="checkbox"
                checked={prefOn(prefs, "announcement", "in_app")}
                onChange={(event) => void setPref("announcement", "in_app", event.target.checked)}
              />
              <span className="hamd-sr-only">Announcement notices</span>
            </label>
          </div>
        </DetailSection>
      );
    }
    if (section === "privacy") {
      return (
        <DetailSection title="Privacy">
          <div className="hamd-settings-row">
            <div>
              <h3>Analytics cookies</h3>
              <p>Allow optional analytics cookies on this device.</p>
            </div>
            <label className="hamd-settings-row__control">
              <input
                type="checkbox"
                checked={cookies.analyticsAllowed}
                onChange={(event) => cookies.savePreferences({ analytics: event.target.checked })}
              />
              <span className="hamd-sr-only">Analytics cookies</span>
            </label>
          </div>
        </DetailSection>
      );
    }
    if (section === "security") {
      return (
        <DetailSection title="Security">
          <form
            className="hamd-auth-settings__form"
            onSubmit={(event) => {
              event.preventDefault();
              void changePassword();
            }}
          >
            <Field label="Current password" htmlFor="settings-current-password" required>
              <input
                id="settings-current-password"
                className="hamd-auth-settings__input"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </Field>
            <Field label="New password" htmlFor="settings-new-password" required>
              <input
                id="settings-new-password"
                className="hamd-auth-settings__input"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Change password"}
            </Button>
          </form>
          <p className="hamd-auth-settings__help">
            You can also receive a one-time reset link at {auth.user?.email ?? "your email"}.
          </p>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void sendPasswordResetEmail()}>
            Send reset email
          </Button>
        </DetailSection>
      );
    }
    if (section === "session") {
      return (
        <DetailSection title="Session">
          <div className="hamd-settings-row">
            <div>
              <h3>Keep me signed in on this device</h3>
              <p>Remember this browser after you close the tab.</p>
            </div>
            <label className="hamd-settings-row__control">
              <input
                type="checkbox"
                checked={auth.rememberMe}
                onChange={(event) => auth.persistRememberMe(event.target.checked)}
              />
              <span className="hamd-sr-only">Keep me signed in on this device</span>
            </label>
          </div>
        </DetailSection>
      );
    }
    return (
      <DetailSection title="Account">
        <p className="hamd-auth-settings__help">
          Invite a teammate to your organisation, or sign out of this device.
        </p>
        <form
          className="hamd-auth-settings__form hamd-auth-settings__form--invite"
          onSubmit={async (event) => {
            event.preventDefault();
            const token = getAccessToken() ?? (await auth.ensureSession());
            if (!token) {
              setError("Sign in again to send invitations.");
              return;
            }
            await createInvitationRequest(token, inviteEmail);
            setInviteEmail("");
            setMessage("Invitation sent.");
          }}
        >
          <label className="hamd-auth-settings__label">
            Work email
            <input
              className="hamd-auth-settings__input"
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          <Button type="submit">Send invitation</Button>
        </form>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void auth.logout().then(() => navigate("/", { replace: true }));
          }}
        >
          Sign out
        </Button>
      </DetailSection>
    );
  }, [
    auth,
    busy,
    cookies,
    currentPassword,
    inviteEmail,
    navigate,
    newPassword,
    prefs,
    section,
    setTheme,
    theme,
  ]);

  return (
    <div className="hamd-settings-layout" id="guide">
      <header className="hamd-catalog-page__header">
        <h1>Settings</h1>
        <p>Appearance, notifications, privacy, and account security.</p>
      </header>
      {message ? <HostStatus tone="success">{message}</HostStatus> : null}
      {error ? <HostAlert>{error}</HostAlert> : null}
      <div className="hamd-settings-body">
      <nav className="hamd-settings-nav" aria-label="Settings sections">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={section === item.id}
            onClick={() => setSection(item.id)}
          >
            {item.title}
          </button>
        ))}
      </nav>
      <div className="hamd-settings-panel">{panel}</div>
      </div>
    </div>
  );
}
