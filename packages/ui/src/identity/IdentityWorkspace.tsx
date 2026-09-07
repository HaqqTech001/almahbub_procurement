import { useId, useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import { useMemberDirectory } from "./useMemberDirectory.js";
import {
  LOCALES,
  THEMES,
  statusLabel,
  userDisplayName,
  userInitials,
  type ActivityLogEntry,
  type BulkMemberAction,
  type IdentityUser,
  type MembershipRecord,
  type OrganizationInvitation,
  type OrganizationSummary,
  type PermissionSummary,
  type RoleSummary,
  type SessionDevice,
  type ThemePreference,
  type UserPreferences,
} from "./types.js";

export type IdentityWorkspaceTab =
  | "overview"
  | "members"
  | "invitations"
  | "roles"
  | "profile"
  | "security"
  | "activity"
  | "admin";

export type IdentityWorkspaceProps = {
  currentUser: IdentityUser;
  organizations: OrganizationSummary[];
  activeOrganizationId: string;
  members: MembershipRecord[];
  invitations: OrganizationInvitation[];
  roles: RoleSummary[];
  permissions: PermissionSummary[];
  sessions: SessionDevice[];
  activity: ActivityLogEntry[];
  preferences: UserPreferences;
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  initialTab?: IdentityWorkspaceTab | undefined;
  /** Admin capability gate (host computes from permissions). */
  canManageMembers?: boolean | undefined;
  canManageUsers?: boolean | undefined;
  onSwitchOrganization?: ((organizationId: string) => void | Promise<void>) | undefined;
  onInvite?: ((input: {
    email: string;
    roleKeys: string[];
  }) => void | Promise<void>) | undefined;
  onAssignRoles?: ((membershipId: string, roleIds: string[]) => void | Promise<void>) | undefined;
  onMembershipAction?: ((
    membershipId: string,
    action: "suspend" | "restore" | "remove",
  ) => void | Promise<void>) | undefined;
  onBulkAction?: ((
    action: BulkMemberAction,
    membershipIds: string[],
    meta?: { roleId?: string },
  ) => void | Promise<void>) | undefined;
  onExportCsv?: ((csv: string) => void) | undefined;
  onSaveProfile?: ((patch: Partial<IdentityUser>) => void | Promise<void>) | undefined;
  onAvatarChange?: ((file: File) => void | Promise<void>) | undefined;
  onSavePreferences?: ((prefs: UserPreferences) => void | Promise<void>) | undefined;
  onThemeChange?: ((theme: ThemePreference) => void) | undefined;
  onRevokeSession?: ((sessionId: string) => void | Promise<void>) | undefined;
  onRevokeOtherSessions?: (() => void | Promise<void>) | undefined;
  onAdminUserAction?: ((
    userId: string,
    action:
      | "create"
      | "suspend"
      | "deactivate"
      | "restore"
      | "delete"
      | "invite"
      | "reset_password"
      | "transfer_org",
    meta?: Record<string, string>,
  ) => void | Promise<void>) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function IdentityWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-id", "hamd-id--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-id-skel hamd-id-skel--nav" />
      <div className="hamd-id-skel hamd-id-skel--main" />
    </div>
  );
}

/**
 * User & Organization Management workspace.
 * Presentational - hosts inject API handlers. Preserves Genesis status model
 * (account ≠ membership) and soft lifecycle actions.
 */
export function IdentityWorkspace({
  currentUser,
  organizations,
  activeOrganizationId,
  members,
  invitations,
  roles,
  permissions,
  sessions,
  activity,
  preferences,
  title = "User & organization",
  loading,
  className,
  initialTab = "overview",
  canManageMembers = true,
  canManageUsers = true,
  onSwitchOrganization,
  onInvite,
  onAssignRoles,
  onMembershipAction,
  onBulkAction,
  onExportCsv,
  onSaveProfile,
  onAvatarChange,
  onSavePreferences,
  onThemeChange,
  onRevokeSession,
  onRevokeOtherSessions,
  onAdminUserAction,
}: IdentityWorkspaceProps) {
  const inviteEmailId = useId();
  const [tab, setTab] = useState<IdentityWorkspaceTab>(initialTab);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(roles[0]?.key ?? "buyer");
  const [profile, setProfile] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    displayName: currentUser.displayName ?? "",
    avatarUrl: currentUser.avatarUrl ?? "",
  });
  const [prefs, setPrefs] = useState(preferences);
  const [adminUserId, setAdminUserId] = useState(members[1]?.userId ?? "");
  const [assignMembershipId, setAssignMembershipId] = useState(
    members[1]?.id ?? "",
  );
  const [assignRoleId, setAssignRoleId] = useState(roles[0]?.id ?? "");
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeOrg =
    organizations.find((o) => o.id === activeOrganizationId) ??
    organizations[0] ??
    null;

  const directory = useMemberDirectory(members, {
    ...(onBulkAction ? { onBulkAction } : {}),
    ...(onExportCsv ? { onExportCsv } : {}),
  });

  const uniquePermissions = useMemo(() => {
    const map = new Map(permissions.map((p) => [p.key, p]));
    return Array.from(map.values());
  }, [permissions]);

  if (loading) {
    return <IdentityWorkspaceSkeleton className={className} />;
  }

  const tabs: { id: IdentityWorkspaceTab; label: string; hidden?: boolean }[] = [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "invitations", label: "Invitations" },
    { id: "roles", label: "Roles" },
    { id: "profile", label: "Profile & prefs" },
    { id: "security", label: "Security" },
    { id: "activity", label: "Activity" },
    { id: "admin", label: "Admin", hidden: !canManageUsers },
  ];

  const run = async (fn?: () => void | Promise<void>, ok?: string) => {
    setError(null);
    try {
      await fn?.();
      if (ok) {
        setToast(ok);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  return (
    <div className={cx("hamd-id", className)} data-theme={prefs.theme}>
      <a className="hamd-id__skip" href="#hamd-id-main">
        Skip to identity content
      </a>

      <header className="hamd-id__header">
        <div>
          <h1 className="hamd-id__title">{title}</h1>
          <p className="hamd-id__subtitle">
            {activeOrg
              ? `${activeOrg.displayName} · ${statusLabel(String(activeOrg.status))}`
              : "No organization selected"}
          </p>
        </div>
        <div className="hamd-id-switcher" role="group" aria-label="Organization switcher">
          <label className="hamd-sr-only" htmlFor="hamd-id-org">
            Switch organization
          </label>
          <select
            id="hamd-id-org"
            value={activeOrganizationId}
            onChange={(e) => {
              void run(
                () => onSwitchOrganization?.(e.target.value),
                "Organization switched",
              );
            }}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.displayName}
                {org.roleLabel ? ` (${org.roleLabel})` : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="hamd-id__layout">
        <nav className="hamd-id__nav" aria-label="Identity sections">
          {tabs
            .filter((t) => !t.hidden)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                className={cx("hamd-id-navbtn", tab === t.id && "is-active")}
                aria-current={tab === t.id ? "page" : undefined}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
        </nav>

        <main id="hamd-id-main" className="hamd-id__main">
          {tab === "overview" ? (
            <section className="hamd-id-panel" aria-labelledby="id-overview">
              <h2 id="id-overview">Workspace overview</h2>
              <div className="hamd-id-stats">
                <div>
                  <strong>{members.length}</strong>
                  <span>Members</span>
                </div>
                <div>
                  <strong>
                    {members.filter((m) => m.status === "active").length}
                  </strong>
                  <span>Active</span>
                </div>
                <div>
                  <strong>{invitations.length}</strong>
                  <span>Open invites</span>
                </div>
                <div>
                  <strong>
                    {sessions.filter((s) => s.status === "active").length}
                  </strong>
                  <span>Active sessions</span>
                </div>
              </div>
              <div className="hamd-id-card hamd-id-card--user">
                <div className="hamd-id-avatar" aria-hidden="true">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="" />
                  ) : (
                    userInitials(currentUser)
                  )}
                </div>
                <div>
                  <p className="hamd-id-card__title">
                    {userDisplayName(currentUser)}
                  </p>
                  <p className="hamd-id-card__meta">{currentUser.email}</p>
                  <p className="hamd-id-card__meta">
                    Account {statusLabel(String(currentUser.status))} · Locale{" "}
                    {currentUser.locale}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "members" ? (
            <section className="hamd-id-panel" aria-labelledby="id-members">
              <div className="hamd-id-panel__head">
                <h2 id="id-members">Membership management</h2>
                <button
                  type="button"
                  className="hamd-id-btn"
                  onClick={() => void directory.runBulk("export")}
                >
                  CSV export
                </button>
              </div>

              <div className="hamd-id-toolbar">
                <label className="hamd-sr-only" htmlFor="hamd-id-member-q">
                  Search members
                </label>
                <input
                  id="hamd-id-member-q"
                  type="search"
                  placeholder="Search name, email, role…"
                  value={directory.filters.query}
                  onChange={(e) =>
                    directory.setFilters((prev) => ({
                      ...prev,
                      query: e.target.value,
                      page: 1,
                    }))
                  }
                />
                <label>
                  Status
                  <select
                    value={directory.filters.status}
                    onChange={(e) =>
                      directory.setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                        page: 1,
                      }))
                    }
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="suspended">Suspended</option>
                    <option value="removed">Removed</option>
                  </select>
                </label>
                <label>
                  Role
                  <select
                    value={directory.filters.roleKey}
                    onChange={(e) =>
                      directory.setFilters((prev) => ({
                        ...prev,
                        roleKey: e.target.value,
                        page: 1,
                      }))
                    }
                  >
                    <option value="">All roles</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {directory.selected.length > 0 && canManageMembers ? (
                <div className="hamd-id-bulk" role="region" aria-label="Bulk actions">
                  <span>{directory.selected.length} selected</span>
                  <button
                    type="button"
                    onClick={() => void directory.runBulk("suspend")}
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    onClick={() => void directory.runBulk("restore")}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => void directory.runBulk("remove")}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => void directory.runBulk("export")}
                  >
                    Export selected
                  </button>
                  <button type="button" onClick={directory.clearSelection}>
                    Clear
                  </button>
                </div>
              ) : null}

              <div className="hamd-id-table-wrap">
                <table className="hamd-id-table">
                  <caption className="hamd-sr-only">
                    Organization members
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">
                        <input
                          type="checkbox"
                          aria-label="Select page"
                          checked={
                            directory.page.items.length > 0 &&
                            directory.page.items.every((m) =>
                              directory.selected.includes(m.id),
                            )
                          }
                          onChange={directory.togglePage}
                        />
                      </th>
                      <th scope="col">Member</th>
                      <th scope="col">Status</th>
                      <th scope="col">Roles</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directory.page.items.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${userDisplayName(row.user)}`}
                            checked={directory.selected.includes(row.id)}
                            onChange={() => directory.toggle(row.id)}
                          />
                        </td>
                        <td>
                          <div className="hamd-id-member">
                            <span className="hamd-id-avatar hamd-id-avatar--sm">
                              {userInitials(row.user)}
                            </span>
                            <span>
                              <strong>{userDisplayName(row.user)}</strong>
                              <small>{row.user.email}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="hamd-id-pill"
                            data-status={row.status}
                          >
                            {statusLabel(String(row.status))}
                          </span>
                        </td>
                        <td>
                          {row.roles.map((r) => r.name).join(", ") || "-"}
                        </td>
                        <td>
                          <div className="hamd-id-row-actions">
                            {canManageMembers && row.status === "active" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void run(
                                    () =>
                                      onMembershipAction?.(row.id, "suspend"),
                                    "Member suspended",
                                  )
                                }
                              >
                                Suspend
                              </button>
                            ) : null}
                            {canManageMembers &&
                            (row.status === "suspended" ||
                              row.status === "removed") ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void run(
                                    () =>
                                      onMembershipAction?.(row.id, "restore"),
                                    "Member restored",
                                  )
                                }
                              >
                                Restore
                              </button>
                            ) : null}
                            {canManageMembers ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignMembershipId(row.id);
                                  setTab("roles");
                                }}
                              >
                                Roles
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="hamd-id-pager" aria-label="Pagination">
                <button
                  type="button"
                  disabled={directory.page.page <= 1}
                  onClick={() =>
                    directory.setFilters((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                >
                  Previous
                </button>
                <span>
                  Page {directory.page.page} of {directory.page.pageCount} ·{" "}
                  {directory.page.total} total
                </span>
                <button
                  type="button"
                  disabled={directory.page.page >= directory.page.pageCount}
                  onClick={() =>
                    directory.setFilters((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                >
                  Next
                </button>
              </div>
            </section>
          ) : null}

          {tab === "invitations" ? (
            <section className="hamd-id-panel" aria-labelledby="id-invites">
              <h2 id="id-invites">Organization invitations</h2>
              {canManageMembers ? (
                <form
                  className="hamd-id-form hamd-id-form--inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      await onInvite?.({
                        email: inviteEmail.trim(),
                        roleKeys: [inviteRole],
                      });
                      setInviteEmail("");
                    }, "Invitation sent");
                  }}
                >
                  <label htmlFor={inviteEmailId}>
                    Email
                    <input
                      id={inviteEmailId}
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.key}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="hamd-id-btn hamd-id-btn--primary">
                    Invite user
                  </button>
                </form>
              ) : null}
              <ul className="hamd-id-list">
                {invitations.map((inv) => (
                  <li key={inv.id}>
                    <strong>{inv.email}</strong>
                    <span>{statusLabel(String(inv.status))}</span>
                    <span>Expires {formatWhen(inv.expiresAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === "roles" ? (
            <section className="hamd-id-panel" aria-labelledby="id-roles">
              <h2 id="id-roles">Roles & permissions</h2>
              <div className="hamd-id-grid">
                {roles.map((role) => (
                  <article key={role.id} className="hamd-id-card">
                    <h3>{role.name}</h3>
                    <p className="hamd-id-card__meta">{role.key}</p>
                    <p>{role.description}</p>
                    <ul>
                      {role.permissionKeys.map((key) => (
                        <li key={key}>
                          <code>{key}</code>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              {canManageMembers ? (
                <form
                  className="hamd-id-form hamd-id-form--inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(
                      () => onAssignRoles?.(assignMembershipId, [assignRoleId]),
                      "Roles updated",
                    );
                  }}
                >
                  <label>
                    Member
                    <select
                      value={assignMembershipId}
                      onChange={(e) => setAssignMembershipId(e.target.value)}
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {userDisplayName(m.user)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Assign role
                    <select
                      value={assignRoleId}
                      onChange={(e) => setAssignRoleId(e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="hamd-id-btn hamd-id-btn--primary">
                    Assign roles
                  </button>
                </form>
              ) : null}
              <h3>Permission catalog</h3>
              <ul className="hamd-id-perm-list">
                {uniquePermissions.map((p) => (
                  <li key={p.key}>
                    <code>{p.key}</code>
                    <span>
                      {p.resource}:{p.action}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === "profile" ? (
            <section className="hamd-id-panel" aria-labelledby="id-profile">
              <h2 id="id-profile">Profile, preferences & theme</h2>
              <form
                className="hamd-id-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(
                    () =>
                      onSaveProfile?.({
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        displayName: profile.displayName || null,
                      }),
                    "Profile saved",
                  );
                }}
              >
                <div className="hamd-id-avatar-edit">
                  <div className="hamd-id-avatar" aria-hidden="true">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="" />
                    ) : (
                      userInitials({
                        ...currentUser,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        displayName: profile.displayName,
                      })
                    )}
                  </div>
                  <label className="hamd-id-btn">
                    Upload avatar
                    <input
                      type="file"
                      accept="image/*"
                      className="hamd-sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setProfile((prev) => ({ ...prev, avatarUrl: url }));
                        void run(
                          () => onAvatarChange?.(file),
                          "Avatar updated",
                        );
                      }}
                    />
                  </label>
                </div>
                <label>
                  First name
                  <input
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Display name
                  <input
                    value={profile.displayName}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                  />
                </label>
                <button type="submit" className="hamd-id-btn hamd-id-btn--primary">
                  Save profile
                </button>
              </form>

              <form
                className="hamd-id-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(
                    () => onSavePreferences?.(prefs),
                    "Preferences saved",
                  );
                }}
              >
                <h3>Language & theme</h3>
                <label>
                  Language
                  <select
                    value={prefs.locale}
                    onChange={(e) =>
                      setPrefs((prev) => ({ ...prev, locale: e.target.value }))
                    }
                  >
                    {LOCALES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Time zone
                  <input
                    value={prefs.timeZone}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        timeZone: e.target.value,
                      }))
                    }
                  />
                </label>
                <fieldset>
                  <legend>Theme</legend>
                  <div className="hamd-id-chips" role="radiogroup" aria-label="Theme">
                    {THEMES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        role="radio"
                        aria-checked={prefs.theme === t.value}
                        className={cx(
                          "hamd-id-chip",
                          prefs.theme === t.value && "is-active",
                        )}
                        onClick={() => {
                          setPrefs((prev) => ({ ...prev, theme: t.value }));
                          onThemeChange?.(t.value);
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <h3>Notification preferences</h3>
                <ul className="hamd-id-pref-list">
                  {prefs.notifications.map((row, idx) => (
                    <li key={`${row.type}-${row.channel}`}>
                      <label>
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) =>
                            setPrefs((prev) => {
                              const next = [...prev.notifications];
                              next[idx] = {
                                ...row,
                                enabled: e.target.checked,
                              };
                              return { ...prev, notifications: next };
                            })
                          }
                        />
                        <span>
                          {row.type} · {row.channel}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button type="submit" className="hamd-id-btn hamd-id-btn--primary">
                  Save preferences
                </button>
              </form>
            </section>
          ) : null}

          {tab === "security" ? (
            <section className="hamd-id-panel" aria-labelledby="id-security">
              <div className="hamd-id-panel__head">
                <h2 id="id-security">Sessions & devices</h2>
                <button
                  type="button"
                  className="hamd-id-btn"
                  onClick={() =>
                    void run(
                      () => onRevokeOtherSessions?.(),
                      "Other sessions revoked",
                    )
                  }
                >
                  Sign out other sessions
                </button>
              </div>
              <ul className="hamd-id-list">
                {sessions.map((session) => (
                  <li key={session.id} className="hamd-id-session">
                    <div>
                      <strong>
                        {session.deviceName || "Unknown device"}
                        {session.current ? " · Current" : ""}
                      </strong>
                      <span>
                        {session.platform || "-"} · {session.userAgent || "-"}
                      </span>
                      <span>
                        {session.ipLabel || "IP hidden"} · Last used{" "}
                        {formatWhen(session.lastUsedAt)}
                      </span>
                      <span className="hamd-id-pill" data-status={session.status}>
                        {statusLabel(String(session.status))}
                      </span>
                    </div>
                    {session.status === "active" && !session.current ? (
                      <button
                        type="button"
                        onClick={() =>
                          void run(
                            () => onRevokeSession?.(session.id),
                            "Session revoked",
                          )
                        }
                      >
                        Revoke
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="hamd-id-hint">
                MFA enrollment uses the auth MFA placeholder until the TOTP API
                ships. Password reset remains on `@hamd/ui/auth` screens.
              </p>
            </section>
          ) : null}

          {tab === "activity" ? (
            <section className="hamd-id-panel" aria-labelledby="id-activity">
              <h2 id="id-activity">Activity & audit log</h2>
              <ol className="hamd-id-activity">
                {activity.map((entry) => (
                  <li key={entry.id}>
                    <time dateTime={entry.createdAt}>
                      {formatWhen(entry.createdAt)}
                    </time>
                    <strong>{entry.action}</strong>
                    <span>
                      {entry.resourceType} · {entry.actorName || "System"}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {tab === "admin" && canManageUsers ? (
            <section className="hamd-id-panel" aria-labelledby="id-admin">
              <h2 id="id-admin">Admin user lifecycle</h2>
              <p className="hamd-id-hint">
                Account status is global (suspend/deactivate/restore/delete).
                Membership status is org-scoped. Prefer soft delete.
              </p>
              <label>
                Target user
                <select
                  value={adminUserId}
                  onChange={(e) => setAdminUserId(e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {userDisplayName(m.user)} ({m.user.status})
                    </option>
                  ))}
                </select>
              </label>
              <div className="hamd-id-admin-actions">
                {(
                  [
                    ["create", "Create user"],
                    ["invite", "Invite user"],
                    ["suspend", "Suspend user"],
                    ["deactivate", "Deactivate user"],
                    ["restore", "Restore user"],
                    ["reset_password", "Reset password"],
                    ["delete", "Delete user"],
                    ["transfer_org", "Organization transfer"],
                  ] as const
                ).map(([action, label]) => (
                  <button
                    key={action}
                    type="button"
                    className={cx(
                      "hamd-id-btn",
                      action === "delete" && "hamd-id-btn--danger",
                    )}
                    onClick={() =>
                      void run(
                        () => onAdminUserAction?.(adminUserId, action),
                        `${label} requested`,
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {error ? (
        <p className="hamd-id-toast hamd-id-toast--error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast || directory.announce}
      </div>
    </div>
  );
}
