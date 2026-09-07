import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "@hamd/ui/primitives";
import {
  ModuleWorkspace,
  type FilterOption,
} from "@hamd/ui/module-layout";

import {
  fetchOpsDirectory,
  OpsApiError,
  requireToken,
  type OpsDirectoryMember,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage } from "../components/OpsChrome.js";
import { directoryDisplayName, directoryStatusKey } from "./directory-helpers.js";

export function UsersPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<OpsDirectoryMember[]>([]);
  const [page, setPage] = useState({ page: 1, pageSize: 25, total: 0, hasMore: false });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const userStatus =
        status === "active" ||
        status === "suspended" ||
        status === "deactivated" ||
        status === "pending_verification"
          ? status
          : undefined;
      const membershipStatus = status === "invited" ? status : undefined;
      const live = await fetchOpsDirectory(token, {
        q: search.trim() || undefined,
        page: page.page,
        pageSize: page.pageSize,
        status: membershipStatus,
        userStatus,
      });
      setMembers(live.members);
      setPage(live.page);
    } catch (err) {
      setMembers([]);
      setError(
        err instanceof OpsApiError
          ? err.message
          : "Unable to load the user directory.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, page.page, page.pageSize, search, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rows = useMemo(() => {
    if (role === "all") return members;
    return members.filter((member) =>
      member.roles.some((item) => item.key === role || item.name === role),
    );
  }, [members, role]);

  const roleOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const member of members) {
      for (const item of member.roles) keys.add(item.key);
    }
    return [...keys].sort();
  }, [members]);

  const statusFilterOptions: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: "active", label: "Active" },
      { value: "suspended", label: "Suspended" },
      { value: "deactivated", label: "Deactivated" },
      { value: "pending_verification", label: "Pending verification" },
      { value: "invited", label: "Invited" },
    ],
    [],
  );

  const onResetFilters = useCallback(() => {
    setSearch("");
    setStatus("all");
    setRole("all");
    setPage((current) => ({ ...current, page: 1 }));
  }, []);

  const emptyState = useMemo(
    () =>
      !loading && rows.length === 0
        ? {
            title: "No users found",
            description: "No users match the current filters.",
            onReset: () => onResetFilters(),
          }
        : null,
    [loading, rows.length, onResetFilters],
  );

  return (
    <OpsPage className="hamd-admin-directory hamd-list-queue">
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      <ModuleWorkspace
        header={{
          title: "Users",
          description: "Identify an account, then open the profile for full details.",
        }}
        toolbar={{
          search: {
            value: search,
            onChange: (value: string) => {
              setPage((current) => ({ ...current, page: 1 }));
              setSearch(value);
            },
            placeholder: "Name or email",
          },
          filters: [
            {
              label: "Status",
              value: status,
              onChange: setStatus,
              options: statusFilterOptions,
            },
            {
              label: "Role",
              value: role,
              onChange: setRole,
              options: roleOptions.map((key) => ({ value: key, label: key })),
            },
          ],
        }}
        loading={loading}
        loadingLabel="Loading users…"
        error={error}
        empty={emptyState}
      >
        {!loading && rows.length > 0 ? (
          <ul className="hamd-ops-record-list" aria-label="Users">
            {rows.map((member) => {
              const statusKey = directoryStatusKey(member);
              const name = directoryDisplayName(member);
              return (
                <li key={member.id} className="hamd-ops-record-card">
                  <button
                    type="button"
                    className="hamd-ops-record-card__main"
                    onClick={() => navigate(`/users/${member.userId}`)}
                  >
                    <span className="hamd-ops-record-card__name">{name}</span>
                    <span className="hamd-ops-record-card__email">{member.email}</span>
                  </button>
                  <div className="hamd-ops-record-card__meta">
                    <StatusBadge
                      status={statusKey}
                      label={
                        statusKey === "pending_verification"
                          ? "Needs verification"
                          : undefined
                      }
                    />
                    <Link
                      className="hamd-btn hamd-btn--ghost"
                      to={`/users/${member.userId}`}
                    >
                      Open
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </ModuleWorkspace>

      <div className="hamd-ops-module__pager">
        <span>
          Page {page.page} · {page.total} users
        </span>
        <button
          type="button"
          className="hamd-btn hamd-btn--ghost"
          disabled={page.page <= 1}
          onClick={() =>
            setPage((current) => ({ ...current, page: current.page - 1 }))
          }
        >
          Previous
        </button>
        <button
          type="button"
          className="hamd-btn hamd-btn--ghost"
          disabled={!page.hasMore}
          onClick={() =>
            setPage((current) => ({ ...current, page: current.page + 1 }))
          }
        >
          Next
        </button>
      </div>
    </OpsPage>
  );
}
