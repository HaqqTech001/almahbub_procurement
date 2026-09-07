import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AttributeList,
  InitialsAvatar,
  StatusBadge,
} from "@hamd/ui/primitives";
import { ModuleWorkspace } from "@hamd/ui/module-layout";

import {
  fetchOpsDirectory,
  OpsApiError,
  requireToken,
  type OpsDirectoryMember,
  type OpsOrganizationRow,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage } from "../components/OpsChrome.js";
import { directoryDisplayName, directoryFormatDate, directoryStatusKey } from "./directory-helpers.js";

export function OrganizationsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OpsOrganizationRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await requireToken(auth.ensureSession);
        const live = await fetchOpsDirectory(token, { pageSize: 1 });
        if (!cancelled) setOrganizations(live.organizations);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof OpsApiError
              ? err.message
              : "Unable to load organisations.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.ensureSession]);

  const rows = organizations.filter((org) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [org.name, org.legalName, org.slug, org.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <OpsPage className="hamd-admin-directory hamd-list-queue">
      <ModuleWorkspace
        header={{
          title: "Organisations",
          description: "Open an organisation for members and profile details.",
        }}
        toolbar={{
          search: {
            value: search,
            onChange: setSearch,
            placeholder: "Organisation name",
          },
        }}
        loading={loading}
        loadingLabel="Loading organisations…"
        error={error}
        empty={
          !loading && rows.length === 0
            ? {
                title: "No organisations yet",
                description: "No organisations match the current search.",
              }
            : null
        }
      >
        {rows.length > 0 ? (
          <ul className="hamd-ops-record-list" aria-label="Organisations">
            {rows.map((org) => (
              <li key={org.id} className="hamd-ops-record-card">
                <button
                  type="button"
                  className="hamd-ops-record-card__main"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                >
                  <span className="hamd-ops-record-card__name">{org.name}</span>
                  <span className="hamd-ops-record-card__email">
                    {org.memberCount != null
                      ? `${org.memberCount} member${org.memberCount === 1 ? "" : "s"}`
                      : "Members not available"}
                  </span>
                </button>
                <div className="hamd-ops-record-card__meta">
                  <StatusBadge status={org.status} />
                  <Link className="hamd-btn hamd-btn--ghost" to={`/organizations/${org.id}`}>
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </ModuleWorkspace>
    </OpsPage>
  );
}

const MEMBER_PAGE_SIZE = 25;

export function OrganizationDetailPage() {
  const auth = useAuth();
  const { id = "" } = useParams();
  const [org, setOrg] = useState<OpsOrganizationRow | null>(null);
  const [members, setMembers] = useState<OpsDirectoryMember[]>([]);
  const [memberPage, setMemberPage] = useState({
    page: 1,
    total: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (page = 1) => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const live = await fetchOpsDirectory(token, {
        organizationId: id,
        page,
        pageSize: MEMBER_PAGE_SIZE,
      });
      const current = live.organizations.find((item) => item.id === id) ?? null;
      setOrg(current);
      setMembers((prev) => (page === 1 ? live.members : [...prev, ...live.members]));
      setMemberPage({
        page: live.page.page,
        total: live.page.total,
        hasMore: live.page.hasMore,
      });
      if (!current) setError("Organisation not found.");
    } catch (err) {
      setError(
        err instanceof OpsApiError ? err.message : "Unable to load this organisation.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, id]);

  useEffect(() => {
    setLoading(true);
    setMembers([]);
    void load(1);
  }, [load]);

  const primaryContact = useMemo(() => members[0], [members]);

  return (
    <OpsPage className="hamd-ops-profile">
      <p className="hamd-entity-form__crumb">
        <Link to="/organizations">Organisations</Link>
        <span aria-hidden="true">/</span>
        <span>Detail</span>
      </p>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {loading ? <OpsLoading label="Loading organisation…" /> : null}
      {!loading && org ? (
        <article className="hamd-ops-profile__card">
          <header className="hamd-ops-profile__identity">
            <InitialsAvatar name={org.name} size="lg" />
            <h1>{org.name}</h1>
            <StatusBadge status={org.status} />
            {primaryContact ? (
              <p className="hamd-ops-profile__context">{primaryContact.email}</p>
            ) : null}
          </header>

          <section className="hamd-ops-profile__section">
            <h2>Organisation</h2>
            <AttributeList
              items={[
                { label: "Organisation name", value: org.name },
                { label: "Legal name", value: org.legalName || org.name },
                { label: "Slug", value: org.slug },
                { label: "Country", value: org.countryCode || "Not recorded" },
                { label: "Status", value: <StatusBadge status={org.status} /> },
                { label: "Members", value: String(org.memberCount ?? memberPage.total) },
                {
                  label: "Procurement requests",
                  value: String(org.requestCount ?? 0),
                },
                { label: "Created", value: directoryFormatDate(org.createdAt) },
                { label: "Updated", value: directoryFormatDate(org.updatedAt) },
              ]}
            />
          </section>

          <section className="hamd-ops-profile__section">
            <h2>Members</h2>
            {members.length === 0 ? (
              <p className="hamd-ops-empty">No members in this organisation.</p>
            ) : (
              <ul className="hamd-ops-member-list">
                {members.map((member) => (
                  <li key={member.id}>
                    <Link className="hamd-ops-member-list__hit" to={`/users/${member.userId}`}>
                      <InitialsAvatar name={directoryDisplayName(member)} size="sm" />
                      <span>
                        <strong>{directoryDisplayName(member)}</strong>
                        <span>{member.email}</span>
                      </span>
                      <StatusBadge status={directoryStatusKey(member)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {memberPage.hasMore ? (
              <button
                type="button"
                className="hamd-btn hamd-btn--secondary"
                onClick={() => void load(memberPage.page + 1)}
              >
                Load more members
              </button>
            ) : null}
          </section>
        </article>
      ) : null}
    </OpsPage>
  );
}
