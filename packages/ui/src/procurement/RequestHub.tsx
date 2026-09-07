import type { ReactNode } from "react";

import { CopyRequestIdButton } from "../primitives/CopyRequestIdButton.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { cx } from "../utils/cx.js";
import { ProcurementProgress } from "./ProcurementProgress.js";
import {
  procurementActionRequiredCopy,
  procurementLobLabel,
  procurementPriorityLabel,
  procurementStatusLabel,
} from "./types.js";

export type RequestRelatedDto = {
  quotations?: Array<{
    id: string;
    publicCode: string;
    status: string;
    rowVersion?: number | null;
    totalAmount?: string | null;
    currencyCode?: string | null;
  }>;
  purchaseOrders?: Array<{ id: string; publicCode: string; status: string }>;
  shipments?: Array<{
    id: string;
    publicCode: string;
    status: string;
    trackingNumber?: string | null;
    carrierName?: string | null;
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount?: string | null;
    currencyCode?: string | null;
  }>;
  payments?: Array<{ id: string; status: string; amount?: string | null }>;
};

export type RequestHubRow = {
  id: string;
  publicCode: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  organizationName?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  categoryLabel?: string | null;
  lob?: string | null;
  priority?: string | null;
  assigneeName?: string | null;
  assigneeMembershipId?: string | null;
  related?: RequestRelatedDto | null;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function buyerActionRequired(row: RequestHubRow): boolean {
  return ["draft", "needs_clarification", "quote_issued", "revision_requested"].includes(
    row.status,
  );
}

export function RequestHub({
  title,
  description,
  rows,
  loading,
  audience,
  onOpen,
  toolbar,
  empty,
  onRequestIdCopied,
}: {
  title: string;
  description?: string;
  rows: readonly RequestHubRow[];
  loading?: boolean;
  audience: "customer" | "admin";
  onOpen: (row: RequestHubRow) => void;
  toolbar?: ReactNode;
  empty?: string;
  onRequestIdCopied?: (value: string) => void;
}) {
  const isOps = audience === "admin";
  return (
    <section
      className={cx(
        "hamd-request-hub",
        "hamd-list-module-frame",
        isOps ? "hamd-request-hub--ops" : "hamd-request-hub--buyer",
      )}
    >
      <header className="hamd-request-hub__header">
        {title ? (
          <div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
        ) : null}
        {!loading && rows.length > 0 ? (
          <p className="hamd-request-hub__count" aria-live="polite">
            {rows.length} {rows.length === 1 ? "request" : "requests"}
          </p>
        ) : null}
      </header>
      {toolbar}
      {loading ? (
        <ul className="hamd-request-hub__list" aria-busy="true" aria-label="Loading requests">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className="hamd-request-hub__row hamd-request-hub__row--skeleton">
              <span className="hamd-sr-only">Loading request</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!loading && rows.length === 0 ? (
        <p className="hamd-request-hub__empty" role="status">
          {empty ?? "No requests yet."}
        </p>
      ) : null}
      {!loading && rows.length > 0 && !isOps ? (
        <ul className="hamd-request-hub__list" role="list">
          {rows.map((row) => {
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className="hamd-request-hub__row"
                  onClick={() => onOpen(row)}
                >
                  <div className="hamd-request-hub__row-main">
                    <p className="hamd-request-hub__code">{row.publicCode}</p>
                    <h2>{row.title}</h2>
                    {row.categoryLabel ? (
                      <p className="hamd-request-hub__meta">{row.categoryLabel}</p>
                    ) : null}
                    {buyerActionRequired(row) ? (
                      <p className="hamd-request-hub__action-note">
                        Action required: {procurementActionRequiredCopy(row.status)}
                      </p>
                    ) : null}
                  </div>
                  <dl className="hamd-request-hub__row-meta">
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <StatusBadge
                          status={row.status}
                          label={procurementStatusLabel(row.status)}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{formatWhen(row.updatedAt)}</dd>
                    </div>
                  </dl>
                  <span className="hamd-request-hub__open" aria-hidden="true">
                    <svg viewBox="0 0 20 20" width="16" height="16">
                      <path
                        d="M7.5 4.5L13 10l-5.5 5.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {!loading && rows.length > 0 && isOps ? (
        <div className="hamd-request-hub__table-wrap">
          <table className="hamd-request-hub__table">
            <caption className="hamd-sr-only">Procurement request queue</caption>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Request</th>
                <th scope="col">Customer</th>
                <th scope="col">Organisation</th>
                <th scope="col">LOB</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">Updated</th>
                <th scope="col"><span className="hamd-sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={0}
                  className="hamd-request-hub__queue-row"
                  onClick={() => onOpen(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(row);
                    }
                  }}
                >
                  <td className="hamd-request-hub__id" data-label="Code">
                    <span className="hamd-request-hub__code">{row.publicCode}</span>
                    <CopyRequestIdButton value={row.publicCode} onCopied={onRequestIdCopied} />
                  </td>
                  <td data-label="Request">
                    <strong>{row.title}</strong>
                    {row.categoryLabel ? (
                      <span className="hamd-request-hub__meta">{row.categoryLabel}</span>
                    ) : null}
                    {procurementActionRequiredCopy(row.status) ? (
                      <span className="hamd-request-hub__action-note">
                        Action required: {procurementActionRequiredCopy(row.status)}
                      </span>
                    ) : null}
                  </td>
                  <td data-label="Customer">
                    <span>{row.requesterName || "Not provided"}</span>
                    {row.requesterEmail ? (
                      <span className="hamd-request-hub__meta hamd-request-hub__email">
                        {row.requesterEmail}
                      </span>
                    ) : null}
                  </td>
                  <td data-label="Organisation">{row.organizationName || "Not provided"}</td>
                  <td data-label="Line of business">{procurementLobLabel(row.lob)}</td>
                  <td data-label="Status">
                    <StatusBadge status={row.status} label={procurementStatusLabel(row.status)} />
                  </td>
                  <td data-label="Priority">{procurementPriorityLabel(row.priority)}</td>
                  <td data-label="Updated">{formatWhen(row.updatedAt)}</td>
                  <td data-label="Open">
                    <span className="hamd-request-hub__open">Open</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export function RequestLifecycle({
  status,
  related,
  variant = "full",
}: {
  status: string;
  related?: RequestRelatedDto | null;
  variant?: "full" | "compact" | "preview";
}) {
  return (
    <ProcurementProgress status={status} related={related ?? null} variant={variant} />
  );
}
