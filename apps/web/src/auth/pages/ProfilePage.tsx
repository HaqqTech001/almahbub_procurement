import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AccountActionGroup,
  AttributeList,
  Button,
  DetailSection,
  Field,
  ProfileIdentityHeader,
} from "@hamd/ui/primitives";
import { useAuth } from "../session/AuthProvider.js";
import { updateProfileRequest } from "../api/auth-client.js";
import { AuthApiError, formatAuthError } from "../api/auth-errors.js";
import { HostAlert, HostStatus } from "../../components/HostChrome.js";

function fullName(user: {
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  email?: string;
}): string {
  const named = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return user.displayName?.trim() || named || user.email || "Buyer";
}

function formatWhen(value?: string | null, withTime = false): string {
  if (!value) return "Not available";
  return withTime
    ? new Date(value).toLocaleString()
    : new Date(value).toLocaleDateString();
}

export function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(auth.user?.firstName ?? "");
  const [lastName, setLastName] = useState(auth.user?.lastName ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(auth.user?.firstName ?? "");
    setLastName(auth.user?.lastName ?? "");
  }, [auth.user?.firstName, auth.user?.lastName]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await auth.ensureSession();
      if (!token) {
        setError("Your session expired. Sign in again.");
        return;
      }
      await updateProfileRequest(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setMessage("Profile updated.");
      setEditing(false);
      await auth.refreshSession();
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? formatAuthError(err, "Unable to update your profile.")
          : "Unable to update your profile.",
      );
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    await auth.logout();
    navigate("/", { replace: true });
  };

  const name = fullName(auth.user ?? {});
  const verified = Boolean(auth.user?.emailVerifiedAt);

  return (
    <div className="hamd-account-profile">
      <ProfileIdentityHeader
        name={name}
        email={auth.user?.email}
        status={verified ? "Email verified" : "Verification pending"}
        context={auth.organizationName || undefined}
        actions={
          <AccountActionGroup>
            {editing ? null : (
              <Button type="button" onClick={() => setEditing(true)}>
                Edit Profile
              </Button>
            )}
            <Link className="hamd-btn hamd-btn--ghost" to="/app/settings">
              Settings
            </Link>
            <Button type="button" variant="outline" onClick={() => void onLogout()}>
              Sign out
            </Button>
          </AccountActionGroup>
        }
      />

      {message ? <HostStatus tone="success">{message}</HostStatus> : null}
      {error ? <HostAlert>{error}</HostAlert> : null}

      {editing ? (
        <form className="hamd-auth-settings__form" data-guide="profile-form" onSubmit={(e) => void onSubmit(e)}>
          <Field label="First name" htmlFor="profile-first-name" required>
            <input
              id="profile-first-name"
              className="hamd-auth-settings__input"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </Field>
          <Field label="Last name" htmlFor="profile-last-name" required>
            <input
              id="profile-last-name"
              className="hamd-auth-settings__input"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </Field>
          <AccountActionGroup>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save profile"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setFirstName(auth.user?.firstName ?? "");
                setLastName(auth.user?.lastName ?? "");
              }}
            >
              Cancel
            </Button>
          </AccountActionGroup>
        </form>
      ) : (
        <>
          <DetailSection title="Personal information">
            <AttributeList
              items={[
                { label: "Name", value: name },
                { label: "Email", value: auth.user?.email },
              ]}
            />
          </DetailSection>
          <DetailSection title="Organisation">
            <AttributeList
              items={[
                {
                  label: "Organisation",
                  value: auth.organizationName?.trim() || "No organisation associated",
                },
              ]}
            />
          </DetailSection>
          <DetailSection title="Account">
            <AttributeList
              items={[
                {
                  label: "Verification",
                  value: verified
                    ? `Verified ${formatWhen(auth.user?.emailVerifiedAt)}`
                    : "Pending verification",
                },
                { label: "Created", value: formatWhen(auth.user?.createdAt) },
                {
                  label: "Last sign-in",
                  value: formatWhen(auth.user?.lastAuthenticatedAt, true),
                },
              ]}
            />
          </DetailSection>
        </>
      )}
    </div>
  );
}
