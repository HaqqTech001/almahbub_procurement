import { useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import { useSupplierDirectory } from "./useSupplierDirectory.js";
import {
  riskLabel,
  supplierStatusLabel,
  type SupplierAdminAction,
  type SupplierRecord,
} from "./types.js";

export type SupplierWorkspaceTab =
  | "profile"
  | "contacts"
  | "locations"
  | "certifications"
  | "documents"
  | "ratings"
  | "lead_time"
  | "performance"
  | "communication"
  | "products"
  | "admin";

export type SupplierWorkspaceProps = {
  suppliers: SupplierRecord[];
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  initialSupplierId?: string | undefined;
  canApprove?: boolean | undefined;
  canSuspend?: boolean | undefined;
  canVerify?: boolean | undefined;
  onSelect?: ((supplier: SupplierRecord) => void) | undefined;
  onAdminAction?: ((
    supplierId: string,
    action: SupplierAdminAction,
    meta?: { riskScore?: number; note?: string },
  ) => void | Promise<void>) | undefined;
  onExportCsv?: ((csv: string) => void) | undefined;
  onOpenCommunication?: ((href: string) => void) | undefined;
  onOpenProduct?: ((href: string) => void) | undefined;
};

function Stars({ value }: { value: number }) {
  return (
    <span className="hamd-sup-stars" aria-label={`${value} out of 5`}>
      <span className="hamd-sup-stars__num">{value.toFixed(1)} / 5</span>
    </span>
  );
}

export function SupplierWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-sup", "hamd-sup--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-sup-skel hamd-sup-skel--list" />
      <div className="hamd-sup-skel hamd-sup-skel--detail" />
    </div>
  );
}

/**
 * Enterprise supplier management - directory + profile facets + admin controls.
 * Presentational; hosts inject approve/suspend/verify/risk handlers.
 */
export function SupplierWorkspace({
  suppliers,
  title = "Supplier management",
  loading,
  className,
  initialSupplierId,
  canApprove = true,
  canSuspend = true,
  canVerify = true,
  onSelect,
  onAdminAction,
  onExportCsv,
  onOpenCommunication,
  onOpenProduct,
}: SupplierWorkspaceProps) {
  const [tab, setTab] = useState<SupplierWorkspaceTab>("profile");
  const [riskDraft, setRiskDraft] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const directory = useSupplierDirectory(suppliers, {
    ...(onExportCsv ? { onExportCsv } : {}),
  });

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const s of suppliers) {
      if (s.countryCode) set.add(s.countryCode);
      s.countriesServed.forEach((c) => set.add(c));
    }
    return Array.from(set).sort();
  }, [suppliers]);

  const selected = useMemo(() => {
    if (initialSupplierId && !directory.selected) {
      return suppliers.find((s) => s.id === initialSupplierId) ?? null;
    }
    return directory.selected;
  }, [directory.selected, initialSupplierId, suppliers]);

  if (loading) {
    return <SupplierWorkspaceSkeleton className={className} />;
  }

  const run = async (fn?: () => void | Promise<void>, ok?: string) => {
    setError(null);
    try {
      await fn?.();
      if (ok) setToast(ok);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const tabs: { id: SupplierWorkspaceTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "contacts", label: "Contacts" },
    { id: "locations", label: "Locations" },
    { id: "certifications", label: "Certifications" },
    { id: "documents", label: "Documents" },
    { id: "ratings", label: "Ratings" },
    { id: "lead_time", label: "Lead time" },
    { id: "performance", label: "Performance" },
    { id: "communication", label: "Communication" },
    { id: "products", label: "Products" },
    { id: "admin", label: "Admin" },
  ];

  return (
    <div
      className={cx(
        "hamd-sup",
        mobileShowDetail && "hamd-sup--detail-open",
        className,
      )}
    >
      <a className="hamd-sup__skip" href="#hamd-sup-detail">
        Skip to supplier detail
      </a>

      <header className="hamd-sup__header">
        <div>
          <h1 className="hamd-sup__title">{title}</h1>
          <p className="hamd-sup__subtitle">
            {directory.filtered.length} suppliers · risk, verification, and
            performance in one workspace
          </p>
        </div>
        <button
          type="button"
          className="hamd-sup-btn"
          onClick={() => directory.exportCsv()}
        >
          Export CSV
        </button>
      </header>

      <div className="hamd-sup__layout">
        <aside className="hamd-sup__directory" aria-label="Supplier directory">
          <div className="hamd-sup-filters">
            <label className="hamd-sr-only" htmlFor="hamd-sup-q">
              Search suppliers
            </label>
            <input
              id="hamd-sup-q"
              type="search"
              placeholder="Search name, country, contact…"
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
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              Country
              <select
                value={directory.filters.country}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    country: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="">All countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Risk
              <select
                value={directory.filters.riskTier}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    riskTier: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="all">All tiers</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label>
              Verification
              <select
                value={directory.filters.verification}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    verification: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="unverified">Unverified</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </label>
          </div>

          <ul className="hamd-sup-list" role="list" aria-label="Suppliers">
            {directory.page.items.map((row) => {
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={cx("hamd-sup-row", active && "is-active")}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      directory.select(row.id);
                      setMobileShowDetail(true);
                      setTab("profile");
                      onSelect?.(row);
                    }}
                  >
                    <span className="hamd-sup-row__title">{row.legalName}</span>
                    <span className="hamd-sup-row__meta">
                      {row.countryCode || "-"} · {supplierStatusLabel(String(row.status))}
                    </span>
                    <span className="hamd-sup-row__meta">
                      Risk {riskLabel(String(row.riskTier))} ({row.riskScore}) ·{" "}
                      {supplierStatusLabel(String(row.verification))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hamd-sup-pager" aria-label="Pagination">
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
              {directory.page.page}/{directory.page.pageCount}
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
        </aside>

        <section
          id="hamd-sup-detail"
          className="hamd-sup__detail"
          aria-label="Supplier detail"
        >
          {selected ? (
            <>
              <header className="hamd-sup-detail__head">
                <button
                  type="button"
                  className="hamd-sup-back"
                  onClick={() => setMobileShowDetail(false)}
                >
                  Directory
                </button>
                <div>
                  <h2 className="hamd-sup-detail__title">{selected.legalName}</h2>
                  <p className="hamd-sup-detail__sub">
                    {selected.tradeName ? `${selected.tradeName} · ` : ""}
                    <span className="hamd-sup-pill" data-status={selected.status}>
                      {supplierStatusLabel(String(selected.status))}
                    </span>{" "}
                    <span
                      className="hamd-sup-pill"
                      data-risk={selected.riskTier}
                    >
                      Risk {selected.riskScore}
                    </span>{" "}
                    <span
                      className="hamd-sup-pill"
                      data-verify={selected.verification}
                    >
                      {supplierStatusLabel(String(selected.verification))}
                    </span>
                  </p>
                </div>
              </header>

              <nav className="hamd-sup-tabs" aria-label="Supplier sections">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cx(
                      "hamd-sup-tab",
                      tab === t.id && "is-active",
                    )}
                    aria-current={tab === t.id ? "page" : undefined}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              <div className="hamd-sup-panel">
                {tab === "profile" ? (
                  <div className="hamd-sup-grid">
                    <dl className="hamd-sup-facts">
                      <div>
                        <dt>Legal name</dt>
                        <dd>{selected.legalName}</dd>
                      </div>
                      <div>
                        <dt>Trade name</dt>
                        <dd>{selected.tradeName || "-"}</dd>
                      </div>
                      <div>
                        <dt>Home country</dt>
                        <dd>{selected.countryCode || "-"}</dd>
                      </div>
                      <div>
                        <dt>Countries served</dt>
                        <dd>{selected.countriesServed.join(", ") || "-"}</dd>
                      </div>
                      <div>
                        <dt>Categories</dt>
                        <dd>{selected.categories?.join(", ") || "-"}</dd>
                      </div>
                      <div>
                        <dt>Website</dt>
                        <dd>
                          {selected.website ? (
                            <a href={selected.website} rel="noreferrer">
                              {selected.website}
                            </a>
                          ) : (
                            "-"
                          )}
                        </dd>
                      </div>
                    </dl>
                    {selected.notes ? (
                      <p className="hamd-sup-notes">{selected.notes}</p>
                    ) : null}
                  </div>
                ) : null}

                {tab === "contacts" ? (
                  <ul className="hamd-sup-cards">
                    {selected.contacts.map((c) => (
                      <li key={c.id}>
                        <strong>
                          {c.name}
                          {c.isPrimary ? " · Primary" : ""}
                        </strong>
                        <span>{c.role || "Contact"}</span>
                        <span>{c.email || "-"}</span>
                        <span>{c.phone || "-"}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {tab === "locations" ? (
                  <ul className="hamd-sup-cards">
                    {selected.locations.map((loc) => (
                      <li key={loc.id}>
                        <strong>
                          {loc.label}
                          {loc.isHeadquarters ? " · HQ" : ""}
                        </strong>
                        <span>{loc.addressLine}</span>
                        <span>
                          {loc.city}, {loc.countryCode}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {tab === "certifications" ? (
                  <ul className="hamd-sup-cards">
                    {selected.certifications.length === 0 ? (
                      <li className="hamd-sup-empty">No certifications on file.</li>
                    ) : (
                      selected.certifications.map((cert) => (
                        <li key={cert.id}>
                          <strong>
                            {cert.type} · {cert.number}
                          </strong>
                          <span>
                            {cert.issuer} · {supplierStatusLabel(String(cert.status))}
                          </span>
                          <span>
                            Issued {new Date(cert.issuedAt).toLocaleDateString()}
                            {cert.expiresAt
                              ? ` · Expires ${new Date(cert.expiresAt).toLocaleDateString()}`
                              : ""}
                          </span>
                          {cert.documentHref ? (
                            <a href={cert.documentHref}>View document</a>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}

                {tab === "documents" ? (
                  <ul className="hamd-sup-cards">
                    {selected.documents.length === 0 ? (
                      <li className="hamd-sup-empty">No documents uploaded.</li>
                    ) : (
                      selected.documents.map((doc) => (
                        <li key={doc.id}>
                          <a href={doc.href}>{doc.name}</a>
                          <span>
                            {doc.kind}
                            {doc.sizeLabel ? ` · ${doc.sizeLabel}` : ""}
                          </span>
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}

                {tab === "ratings" ? (
                  <div className="hamd-sup-ratings">
                    <Stars value={selected.ratings.overall} />
                    <p>
                      {selected.ratings.reviewCount} reviews · Quality{" "}
                      {selected.ratings.quality.toFixed(1)} · Delivery{" "}
                      {selected.ratings.delivery.toFixed(1)} · Communication{" "}
                      {selected.ratings.communication.toFixed(1)}
                    </p>
                  </div>
                ) : null}

                {tab === "lead_time" ? (
                  <div className="hamd-sup-lead">
                    <div className="hamd-sup-stats">
                      <div>
                        <strong>{selected.leadTime.minDays}d</strong>
                        <span>Minimum</span>
                      </div>
                      <div>
                        <strong>{selected.leadTime.typicalDays}d</strong>
                        <span>Typical</span>
                      </div>
                      <div>
                        <strong>{selected.leadTime.maxDays}d</strong>
                        <span>Maximum</span>
                      </div>
                    </div>
                    {selected.leadTime.notes ? (
                      <p>{selected.leadTime.notes}</p>
                    ) : null}
                  </div>
                ) : null}

                {tab === "performance" ? (
                  <div>
                    <h3 className="hamd-sr-only">Performance analytics</h3>
                    {selected.performance.length === 0 ? (
                      <p className="hamd-sup-empty">
                        No performance analytics yet.
                      </p>
                    ) : (
                      <ul className="hamd-sup-metrics">
                        {selected.performance.map((m) => (
                          <li key={m.key} data-trend={m.trend}>
                            <strong>{m.value}</strong>
                            <span>{m.label}</span>
                            <small>
                              {m.period}
                              {m.trend ? ` · ${m.trend}` : ""}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}

                {tab === "communication" ? (
                  <ul className="hamd-sup-cards">
                    {selected.communications.length === 0 ? (
                      <li className="hamd-sup-empty">
                        No supplier conversations linked.
                      </li>
                    ) : (
                      selected.communications.map((msg) => (
                        <li key={msg.id}>
                          <button
                            type="button"
                            className="hamd-sup-linkish"
                            onClick={() => onOpenCommunication?.(msg.href)}
                          >
                            <strong>
                              {msg.subject}
                              {msg.unread ? " · Unread" : ""}
                            </strong>
                            <span>{msg.preview}</span>
                            <span>
                              {new Date(msg.updatedAt).toLocaleString()}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}

                {tab === "products" ? (
                  <ul className="hamd-sup-cards">
                    {selected.products.length === 0 ? (
                      <li className="hamd-sup-empty">
                        No linked products / capabilities.
                      </li>
                    ) : (
                      selected.products.map((p) => (
                        <li key={p.id}>
                          {p.href ? (
                            <button
                              type="button"
                              className="hamd-sup-linkish"
                              onClick={() => onOpenProduct?.(p.href!)}
                            >
                              <strong>{p.name}</strong>
                            </button>
                          ) : (
                            <strong>{p.name}</strong>
                          )}
                          <span>
                            {[p.sku, p.category, p.moq].filter(Boolean).join(" · ")}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}

                {tab === "admin" ? (
                  <div className="hamd-sup-admin">
                    <p className="hamd-sup-hint">
                      Lifecycle: draft → approve/activate → suspend/restore →
                      archive. Risk score and verification are audited admin
                      actions - hosts persist via API.
                    </p>
                    <div className="hamd-sup-admin__actions">
                      {canApprove &&
                      (selected.status === "draft" ||
                        selected.status === "suspended") ? (
                        <button
                          type="button"
                          className="hamd-sup-btn hamd-sup-btn--primary"
                          onClick={() =>
                            void run(
                              () =>
                                onAdminAction?.(selected.id, "approve"),
                              "Supplier approved",
                            )
                          }
                        >
                          Approve supplier
                        </button>
                      ) : null}
                      {canSuspend && selected.status === "active" ? (
                        <button
                          type="button"
                          className="hamd-sup-btn hamd-sup-btn--warn"
                          onClick={() =>
                            void run(
                              () =>
                                onAdminAction?.(selected.id, "suspend"),
                              "Supplier suspended",
                            )
                          }
                        >
                          Suspend supplier
                        </button>
                      ) : null}
                      {canSuspend && selected.status === "suspended" ? (
                        <button
                          type="button"
                          className="hamd-sup-btn"
                          onClick={() =>
                            void run(
                              () =>
                                onAdminAction?.(selected.id, "restore"),
                              "Supplier restored",
                            )
                          }
                        >
                          Restore supplier
                        </button>
                      ) : null}
                      {canVerify && selected.verification !== "verified" ? (
                        <button
                          type="button"
                          className="hamd-sup-btn hamd-sup-btn--primary"
                          onClick={() =>
                            void run(
                              () =>
                                onAdminAction?.(selected.id, "verify"),
                              "Supplier verified",
                            )
                          }
                        >
                          Complete verification
                        </button>
                      ) : null}
                      {canVerify ? (
                        <button
                          type="button"
                          className="hamd-sup-btn"
                          onClick={() =>
                            void run(
                              () =>
                                onAdminAction?.(
                                  selected.id,
                                  "reject_verification",
                                ),
                              "Verification rejected",
                            )
                          }
                        >
                          Reject verification
                        </button>
                      ) : null}
                    </div>
                    <form
                      className="hamd-sup-risk-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const score = Number(riskDraft);
                        if (!Number.isFinite(score)) return;
                        void run(
                          () =>
                            onAdminAction?.(selected.id, "reassess_risk", {
                              riskScore: score,
                            }),
                          "Risk score updated",
                        );
                      }}
                    >
                      <label htmlFor="hamd-sup-risk">
                        Risk score (0–100)
                        <input
                          id="hamd-sup-risk"
                          type="number"
                          min={0}
                          max={100}
                          value={riskDraft}
                          placeholder={String(selected.riskScore)}
                          onChange={(e) => setRiskDraft(e.target.value)}
                          required
                        />
                      </label>
                      <button
                        type="submit"
                        className="hamd-sup-btn hamd-sup-btn--primary"
                      >
                        Update risk score
                      </button>
                    </form>
                    <div className="hamd-sup-analytics">
                      <h3>Performance analytics snapshot</h3>
                      <ul className="hamd-sup-metrics">
                        {selected.performance.map((m) => (
                          <li key={`admin-${m.key}`}>
                            <strong>{m.value}</strong>
                            <span>{m.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <p className="hamd-sup-empty" role="status">
              Select a supplier from the directory.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-sup-toast hamd-sup-toast--error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast || directory.announce}
      </div>
    </div>
  );
}
