import { useState, type FormEvent } from "react";
import {
  AccountActionGroup,
  AttributeList,
  Button,
  DetailSection,
  Field,
  ProfileIdentityHeader,
} from "@hamd/ui/primitives";

import { changePasswordRequest } from "../auth/api/auth-client.js";
import { AuthApiError } from "../auth/api/auth-errors.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";

function fullName(user: {
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  email?: string;
}): string {
  const named = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return user.displayName?.trim() || named || user.email || "Administrator";
}

function formatWhen(value?: string | null, withTime = false): string {
  if (!value) return "Not available";
  return withTime
    ? new Date(value).toLocaleString()
    : new Date(value).toLocaleDateString();
}

export function AccountPage() {
  const auth = useAuth();
  const name = fullName(auth.user ?? {});
  const roleLabel = auth.permissions.includes("ops:access")
    ? "Operations administrator"
    : "Staff";
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await auth.ensureSession();
      if (!token) throw new Error("Sign in again to change your password.");
      await changePasswordRequest(token, { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setEditingPassword(false);
      setSuccess("Password updated.");
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to change password.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OpsPage className="hamd-admin-account hamd-account-profile">
      <ProfileIdentityHeader
        name={name}
        email={auth.user?.email}
        context={roleLabel}
        status={auth.user?.emailVerifiedAt ? "Email verified" : undefined}
        actions={
          <AccountActionGroup>
            <Button type="button" onClick={() => setEditingPassword(true)}>
              Change password
            </Button>
            <Button type="button" variant="outline" onClick={() => void auth.logout()}>
              Sign out
            </Button>
          </AccountActionGroup>
        }
      />
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      {editingPassword ? (
        <form className="hamd-auth-settings__form" onSubmit={(event) => void onChangePassword(event)}>
          <Field label="Current password" htmlFor="ops-current-password" required>
            <input
              id="ops-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </Field>
          <Field label="New password" htmlFor="ops-new-password" required>
            <input
              id="ops-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </Field>
          <AccountActionGroup>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save password"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditingPassword(false)}>
              Cancel
            </Button>
          </AccountActionGroup>
        </form>
      ) : null}
      <DetailSection title="Personal">
        <AttributeList
          items={[
            { label: "Name", value: name },
            { label: "Email", value: auth.user?.email ?? "Not recorded" },
          ]}
        />
      </DetailSection>
      <DetailSection title="Account">
        <AttributeList
          items={[
            { label: "Account context", value: roleLabel },
            {
              label: "Last sign-in",
              value: formatWhen(auth.user?.lastAuthenticatedAt, true),
            },
            { label: "Created", value: formatWhen(auth.user?.createdAt) },
          ]}
        />
      </DetailSection>
      <DetailSection title="Security">
        <p className="hamd-ops-empty">Use Change password to update credentials for this account.</p>
      </DetailSection>
    </OpsPage>
  );
}
