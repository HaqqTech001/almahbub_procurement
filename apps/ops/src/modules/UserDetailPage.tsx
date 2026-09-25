import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AttributeList,
  ProfileIdentityHeader,
  StatusBadge,
} from "@hamd/ui/primitives";

import {
  fetchOpsDirectory,
  OpsApiError,
  patchUserAccountStatus,
  patchUserOpsAccess,
  patchUserProfile,
  requireToken,
  type OpsDirectoryMember,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import {
  directoryDisplayName,
  directoryFormatDate,
  directoryHasOpsAccess,
  directoryStatusKey,
} from "./directory-helpers.js";

type PendingAction =
  | { kind: "status"; command: "suspend" | "activate" | "deactivate" }
  | { kind: "ops"; command: "grant" | "revoke" };

export function UserDetailPage() {
  const auth = useAuth();
  const { userId = "" } = useParams();
  const [member, setMember] = useState<OpsDirectoryMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const live = await fetchOpsDirectory(token, { userId, pageSize: 1 });
      setMember(live.members[0] ?? null);
      if (live.members[0]) {
        setFirstName(live.members[0].firstName ?? "");
        setLastName(live.members[0].lastName ?? "");
        setDisplayName(live.members[0].displayName ?? "");
      }
      if (!live.members[0]) setError("User not found.");
    } catch (err) {
      setMember(null);
      setError(
        err instanceof OpsApiError ? err.message : "Unable to load this user.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyPending = async () => {
    if (!member || !pending) return;
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const updated =
        pending.kind === "status"
          ? await patchUserAccountStatus(
              token,
              member.userId,
              pending.command,
              reason.trim() || undefined,
            )
          : await patchUserOpsAccess(token, member.userId, pending.command);
      setMember((current) => (current ? { ...current, ...updated } : current));
      setSuccess(
        pending.kind === "status"
          ? pending.command === "suspend"
            ? "Account suspended."
            : pending.command === "activate"
              ? "Account activated."
              : "Account deactivated."
          : pending.command === "grant"
            ? "Operations access granted."
            : "Operations access revoked.",
      );
      setPending(null);
      setReason("");
    } catch (err) {
      setError(
        err instanceof OpsApiError ? err.message : "Unable to complete that action.",
      );
    } finally {
      setActing(false);
    }
  };

  const saveProfile = async () => {
    if (!member || !firstName.trim() || !lastName.trim()) return;
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const updated = await patchUserProfile(token, member.userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim() || null,
      });
      setMember(updated);
      setEditing(false);
      setSuccess("User profile updated.");
    } catch (err) {
      setError(err instanceof OpsApiError ? err.message : "Unable to update this user.");
    } finally {
      setActing(false);
    }
  };

  const name = member ? directoryDisplayName(member) : "";
  const statusKey = member ? directoryStatusKey(member) : "";

  return (
    <OpsPage className="hamd-ops-profile">
      <p className="hamd-entity-form__crumb">
        <Link to="/users">Users</Link>
        <span aria-hidden="true">/</span>
        <span>Profile</span>
      </p>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      {loading ? <OpsLoading label="Loading user…" /> : null}
      {!loading && member ? (
        <article className="hamd-ops-profile__card">
          <ProfileIdentityHeader
            name={name}
            email={member.email}
            status={
              <StatusBadge
                status={statusKey}
                label={
                  statusKey === "pending_verification" ? "Needs verification" : undefined
                }
              />
            }
            context={
              member.roles[0]
                ? member.roles.map((item) => item.name || item.key).join(", ")
                : undefined
            }
          />

          <section className="hamd-ops-profile__section">
            <div className="hamd-ops-profile__actions">
              <h2>Account</h2>
              <button type="button" className="hamd-btn hamd-btn--ghost" onClick={() => setEditing((value) => !value)}>
                {editing ? "Cancel editing" : "Edit profile"}
              </button>
            </div>
            {editing ? (
              <div className="hamd-admin-user-confirm">
                <label>First name<input value={firstName} maxLength={100} onChange={(event) => setFirstName(event.target.value)} /></label>
                <label>Last name<input value={lastName} maxLength={100} onChange={(event) => setLastName(event.target.value)} /></label>
                <label>Display name (optional)<input value={displayName} maxLength={160} onChange={(event) => setDisplayName(event.target.value)} /></label>
                <button type="button" className="hamd-btn hamd-btn--primary" disabled={acting || !firstName.trim() || !lastName.trim()} onClick={() => void saveProfile()}>
                  {acting ? "Saving…" : "Save profile"}
                </button>
              </div>
            ) : null}
            <AttributeList
              items={[
                { label: "Name", value: name },
                {
                  label: "Email",
                  value: <a href={`mailto:${member.email}`}>{member.email}</a>,
                },
                { label: "Organisation", value: member.organizationName ?? "None" },
                {
                  label: "Account status",
                  value: (
                    <StatusBadge
                      status={statusKey}
                      label={
                        statusKey === "pending_verification"
                          ? "Needs verification"
                          : undefined
                      }
                    />
                  ),
                },
                {
                  label: "Verification",
                  value: member.emailVerifiedAt
                    ? `Verified ${directoryFormatDate(member.emailVerifiedAt)}`
                    : "Email not verified",
                },
                {
                  label: "Roles",
                  value:
                    member.roles.map((item) => item.name || item.key).join(", ") ||
                    "None",
                },
                { label: "Created", value: directoryFormatDate(member.createdAt) },
                {
                  label: "Last activity",
                  value: directoryFormatDate(member.lastAuthenticatedAt),
                },
                {
                  label: "Procurement requests",
                  value: String(member.requestCount ?? 0),
                },
              ]}
            />
          </section>

          {auth.user?.id === member.userId ? (
            <p className="hamd-ops-empty">
              You cannot change your own account status or operations access here.
            </p>
          ) : (
            <section className="hamd-ops-profile__section">
              <h2>Administration</h2>
              <div className="hamd-ops-profile__actions">
                {(member.userStatus ?? member.status) === "active" ? (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--primary"
                    onClick={() => setPending({ kind: "status", command: "suspend" })}
                  >
                    Suspend
                  </button>
                ) : null}
                {member.userStatus === "suspended" ||
                member.userStatus === "deactivated" ? (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--primary"
                    onClick={() => setPending({ kind: "status", command: "activate" })}
                  >
                    Reactivate
                  </button>
                ) : null}
                {directoryHasOpsAccess(member) ? (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--secondary"
                    onClick={() => setPending({ kind: "ops", command: "revoke" })}
                  >
                    Revoke operations access
                  </button>
                ) : (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--secondary"
                    onClick={() => setPending({ kind: "ops", command: "grant" })}
                  >
                    Grant operations access
                  </button>
                )}
                {member.userStatus !== "deactivated" ? (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--ghost"
                    onClick={() =>
                      setPending({ kind: "status", command: "deactivate" })
                    }
                  >
                    Deactivate
                  </button>
                ) : null}
              </div>
              {pending ? (
                <div className="hamd-admin-user-confirm" role="alertdialog">
                  <p>
                    {pending.kind === "status"
                      ? `Confirm ${pending.command} for ${member.email}. Existing requests and documents are kept.`
                      : pending.command === "grant"
                        ? `Grant operations console access to ${member.email}? This maps to the ops_admin role.`
                        : `Revoke operations console access from ${member.email}? They will keep buyer access.`}
                  </p>
                  {pending.kind === "status" && pending.command !== "activate" ? (
                    <label className="hamd-admin-user-reason">
                      Reason (optional, stored in the audit log)
                      <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows={3}
                        maxLength={500}
                      />
                    </label>
                  ) : null}
                  <div className="hamd-ops-profile__actions">
                    <button
                      type="button"
                      className="hamd-btn hamd-btn--primary"
                      disabled={acting}
                      onClick={() => void applyPending()}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="hamd-btn hamd-btn--ghost"
                      disabled={acting}
                      onClick={() => {
                        setPending(null);
                        setReason("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          )}
        </article>
      ) : null}
    </OpsPage>
  );
}
