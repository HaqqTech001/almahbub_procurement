import type { ReactNode } from "react";
import { useState } from "react";

import { ConfirmationDialog, Dialog } from "../primitives/Dialog.js";
import { CopyRequestIdButton } from "../primitives/CopyRequestIdButton.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { commandLabel, procurementLobLabel, procurementPriorityLabel, procurementStatusLabel } from "./types.js";
import type { ProcurementCommand } from "./types.js";
import {
  clarificationFieldsFromRequest,
  encodeClarificationItems,
  isMeaningfulClarificationQuestion,
  parseClarificationReason,
  type ClarificationFieldKey,
  type ClarificationItem,
} from "./clarification.js";
import { RequestLifecycle, type RequestRelatedDto } from "./RequestHub.js";
import { relatedStateLabel } from "./lifecycle.js";
import { AttachmentBoard } from "../primitives/AuthenticatedMedia.js";

export type RequestDetailModel = {
  id: string;
  publicCode: string;
  title: string;
  status: string;
  notes?: string | null;
  destinationCountryCode?: string | null;
  destinationAddress?: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion?: number;
  requesterName?: string | null;
  requesterEmail?: string | null;
  organizationName?: string | null;
  lob?: string | null;
  priority?: string | null;
  budgetAmount?: string | number | null;
  requiredByDate?: string | null;
  assigneeName?: string | null;
  assigneeMembershipId?: string | null;
  items: Array<{
    id: string;
    description: string;
    quantity: string | number;
    unit: string;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    href?: string;
    mimeType?: string | null;
    kind?: string | null;
    sizeBytes?: number | null;
    sizeLabel?: string | null;
    uploadedAt?: string | null;
  }>;
  history?: Array<{
    id: string;
    toStatus: string;
    fromStatus?: string | null;
    command?: string | null;
    reason?: string | null;
    actorName?: string | null;
    createdAt: string;
  }>;
  related?: RequestRelatedDto | null;
};

function historyParty(
  event: NonNullable<RequestDetailModel["history"]>[number],
  audience: "customer" | "admin",
): string {
  const fromAlmahbub =
    event.command === "request_clarification" || event.toStatus === "needs_clarification";
  if (audience === "customer") {
    if (fromAlmahbub) return "Almahbub";
    if (event.command === "submit" || event.toStatus === "submitted") return "You";
    return fromAlmahbub ? "Almahbub" : "You";
  }
  if (fromAlmahbub) return event.actorName?.trim() || "Operations";
  return event.actorName?.trim() || "Buyer";
}

function nextStepCopy(audience: "customer" | "admin", status: string): string {
  if (audience === "customer") {
    if (status === "draft") return "Submit this request when the destination and items are ready.";
    if (status === "needs_clarification") return "Add the clarification Almahbub asked for, then resubmit.";
    if (status === "quote_issued") return "Review the quotation and accept or decline it.";
    if (status === "revision_requested") return "Waiting for a revised quotation.";
    if (status === "cancelled" || status === "closed" || status === "declined") {
      return "No further action is required on this request.";
    }
    return "Almahbub is working this request. Watch status, documents, and quotations here.";
  }
  if (status === "submitted") return "Approve for sourcing or request clarification.";
  if (status === "accepted_for_sourcing") return "Start sourcing for this request.";
  if (status === "sourcing") return "Issue or manage quotations for this request.";
  if (status === "quote_issued") return "Approve or reject the issued quote, or wait for the buyer response.";
  if (status === "approved") return "Start purchase once commercial terms are confirmed.";
  if (status === "purchase_in_progress") return "Fulfil the request and keep documents current.";
  if (status === "fulfilled") return "Close the request when the operational file is complete.";
  return "Use the operational commands that your permissions allow. Do not use the buyer tracker for queue work.";
}

function formatWhen(iso?: string | null): string {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function historyActionLabel(
  event: NonNullable<RequestDetailModel["history"]>[number],
): string {
  if (event.command === "customer_update") return "Customer updated the request";
  if (event.command === "request_clarification" || event.toStatus === "needs_clarification") {
    return "Clarification requested";
  }
  if (event.command === "submit" && event.fromStatus === "needs_clarification") {
    return "Response submitted";
  }
  if (event.command === "submit") return "Request submitted";
  return procurementStatusLabel(event.toStatus);
}

function ClarificationHistory({
  events,
  audience,
}: {
  events: NonNullable<RequestDetailModel["history"]>;
  audience: "customer" | "admin";
}) {
  return (
    <section className="hamd-request-detail__panel">
      <h2>{audience === "admin" ? "History" : "Progress"}</h2>
      <div className="hamd-request-detail__history" role="list">
        {events.map((event) => {
          const parsed = parseClarificationReason(event.reason);
          return (
            <article
              key={event.id}
              className="hamd-request-detail__history-item"
              data-party={historyParty(event, audience)}
              role="listitem"
            >
              <header>
                <span className="hamd-request-detail__history-party">
                  {historyParty(event, audience)}
                </span>
                <strong>{historyActionLabel(event)}</strong>
                <time dateTime={event.createdAt}>{formatWhen(event.createdAt)}</time>
              </header>
              {parsed?.area ? (
                <p className="hamd-request-detail__history-area">{parsed.area}</p>
              ) : null}
              {parsed?.question && !parsed.items?.length ? (
                <p className="hamd-request-detail__history-note">{parsed.question}</p>
              ) : null}
              {parsed?.items?.length
                ? parsed.items.map((item) => (
                    <p key={item.fieldKey} className="hamd-request-detail__history-note">
                      {item.label}: {item.prompt}
                    </p>
                  ))
                : null}
              {event.command === "customer_update" && event.reason ? (
                <p className="hamd-request-detail__history-note">{event.reason}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RelatedBlock({
  title,
  empty,
  rows,
  onOpen,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; reference: string; status: string; extra?: string | null }>;
  onOpen?: ((id: string) => void) | undefined;
}) {
  return (
    <section className="hamd-request-detail__panel">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="hamd-request-detail__empty">{empty}</p>
      ) : (
        <ul className="hamd-request-detail__related">
          {rows.map((row) => (
            <li key={row.id}>
              <div>
                <strong>{row.reference}</strong>
                <span>{procurementStatusLabel(row.status)}</span>
                {row.extra ? <span>{row.extra}</span> : null}
              </div>
              {onOpen ? (
                <button type="button" className="hamd-btn hamd-btn--ghost" onClick={() => onOpen(row.id)}>
                  View
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RequestDetailView({
  request,
  audience,
  requestCommands,
  quotationCommands,
  onRequestCommand,
  onQuotationCommand,
  onOpenQuotation,
  onOpenShipment,
  onOpenInvoice,
  onOpenPayment,
  extraActions,
  getAccessToken,
  onBuyerUpdate,
  onDelete,
  onRequestIdCopied,
}: {
  request: RequestDetailModel;
  audience: "customer" | "admin";
  requestCommands: ProcurementCommand[];
  quotationCommands: Array<"review" | "issue" | "accept" | "decline">;
  onRequestCommand: (command: ProcurementCommand, extra?: { reason?: string }) => void;
  onQuotationCommand?: (quotationId: string, command: "review" | "issue" | "accept" | "decline") => void;
  onOpenQuotation?: (id: string) => void;
  onOpenShipment?: (id: string) => void;
  onOpenInvoice?: (id: string) => void;
  onOpenPayment?: (id: string) => void;
  extraActions?: ReactNode;
  getAccessToken?: (() => Promise<string | null>) | undefined;
  onBuyerUpdate?: ((patch: {
    destinationAddress?: string;
    notes?: string;
    items?: RequestDetailModel["items"];
    explanation?: string;
  }) => void | Promise<void>) | undefined;
  onDelete?: (() => void | Promise<void>) | undefined;
  onRequestIdCopied?: ((value: string) => void) | undefined;
}) {
  const related = request.related ?? {};
  const latestQuote = related.quotations?.[0];
  const isOps = audience === "admin";
  const statusCommands = requestCommands.filter(
    (command) =>
      command !== "cancel" &&
      command !== "request_clarification" &&
      command !== "submit",
  );
  const canCancel = requestCommands.includes("cancel");
  const canDelete =
    Boolean(onDelete) &&
    !isOps &&
    (request.status === "draft" || request.status === "cancelled");
  const [statusHelpOpen, setStatusHelpOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<ProcurementCommand | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [clarifyText, setClarifyText] = useState("");
  const [clarifyKeys, setClarifyKeys] = useState<ClarificationFieldKey[]>([]);
  const [clarifyPrompts, setClarifyPrompts] = useState<Partial<Record<ClarificationFieldKey, string>>>({});
  const [clarifyError, setClarifyError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyByField, setReplyByField] = useState<Record<string, string>>({});
  const fieldOptions = clarificationFieldsFromRequest({
    title: request.title,
    notes: request.notes ?? null,
    destinationAddress: request.destinationAddress ?? null,
    destinationCountryCode: request.destinationCountryCode ?? null,
    requiredByDate: request.requiredByDate ?? null,
    requesterName: request.requesterName ?? null,
    requesterEmail: request.requesterEmail ?? null,
    organizationName: request.organizationName ?? null,
    items: request.items,
    attachmentsCount: request.attachments?.length ?? 0,
  });
  const clarification =
    request.status === "needs_clarification"
      ? parseClarificationReason(
          [...(request.history ?? [])]
            .reverse()
            .find((event) => event.toStatus === "needs_clarification" || event.command === "request_clarification")
            ?.reason ?? null,
        )
      : null;
  return (
    <article className={isOps ? "hamd-request-detail hamd-request-detail--ops" : "hamd-request-detail"}>
      <header className="hamd-request-detail__header">
        <div className="hamd-request-detail__header-main">
          <p className="hamd-request-detail__kicker">
            {isOps ? "Operations request" : "My request"}
          </p>
          <div className="hamd-request-detail__code-row">
            <p className="hamd-request-detail__code">{request.publicCode}</p>
            <CopyRequestIdButton value={request.publicCode} onCopied={onRequestIdCopied} />
          </div>
          <h1>{request.title}</h1>
          <p className="hamd-request-detail__submitted">
            Submitted {formatWhen(request.createdAt)}
          </p>
          <div className="hamd-request-detail__status-row">
            <StatusBadge status={request.status} label={procurementStatusLabel(request.status)} />
            {isOps && statusCommands.length > 0 ? (
              <button
                type="button"
                className="hamd-btn hamd-btn--primary hamd-request-detail__change-status"
                onClick={() => {
                  setSelectedCommand(statusCommands[0] ?? "");
                  setStatusNote("");
                  setStatusDialogOpen(true);
                }}
              >
                Change Status
              </button>
            ) : null}
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              onClick={() => setStatusHelpOpen((open) => !open)}
              aria-expanded={statusHelpOpen}
            >
              What does this status mean?
            </button>
          </div>
          {statusHelpOpen ? (
            <p className="hamd-request-detail__status-help">{nextStepCopy(audience, request.status)}</p>
          ) : null}
        </div>
        {isOps ? (
          <div className="hamd-request-detail__header-actions">
            {requestCommands.includes("request_clarification") ? (
              <button
                type="button"
                className="hamd-btn hamd-btn--secondary"
                onClick={() => {
                  setClarifyError(null);
                  setClarifyOpen(true);
                }}
              >
                Request Clarification
              </button>
            ) : null}
            {extraActions}
          </div>
        ) : null}
      </header>

      <section className="hamd-request-detail__panel hamd-request-detail__panel--next" aria-labelledby="request-next-step">
        <h2 id="request-next-step">
          {isOps ? "Operational next actions" : "Your next step"}
        </h2>
        <p>{nextStepCopy(audience, request.status)}</p>
        {!isOps && request.status === "needs_clarification" ? (
          <div id="clarification" className="hamd-request-detail__clarify">
            <div className="hamd-request-detail__clarify-banner">
              <span className="hamd-request-detail__clarify-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 8v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="16.2" r="1" fill="currentColor" />
                </svg>
              </span>
              <div>
                <h3>Action required</h3>
                <p>Almahbub needs additional information to continue reviewing this request.</p>
              </div>
            </div>
            <div className="hamd-request-detail__clarify-almahbub">
              <p>Required information</p>
              <strong>{clarification?.area ?? "Additional details"}</strong>
              <p>Question</p>
              {clarification?.question ? (
                <blockquote>
                  <p>{clarification.question}</p>
                  <time dateTime={request.updatedAt}>{formatWhen(request.updatedAt)}</time>
                </blockquote>
              ) : (
                <blockquote>
                  <p>Almahbub needs additional information from you.</p>
                </blockquote>
              )}
            </div>
            <div className="hamd-request-detail__clarify-buyer">
              {(clarification?.items?.length ? clarification.items : []).map((item) => (
                <fieldset key={item.fieldKey} className="hamd-request-detail__clarify-item">
                  <legend>{item.label}</legend>
                  <p className="hamd-request-detail__hint">Your previous answer</p>
                  <p>{item.currentValue || "Not provided"}</p>
                  <p className="hamd-request-detail__hint">What we need</p>
                  <p>{item.prompt}</p>
                  <label>
                    Updated information
                    <textarea
                      rows={3}
                      value={replyByField[item.fieldKey] ?? ""}
                      onChange={(event) =>
                        setReplyByField((prev) => ({
                          ...prev,
                          [item.fieldKey]: event.target.value,
                        }))
                      }
                    />
                  </label>
                </fieldset>
              ))}
              {!(clarification?.items && clarification.items.length > 0) ? (
                <label htmlFor="buyer-clarification-response">Your response
                  <textarea
                    id="buyer-clarification-response"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    rows={4}
                  />
                </label>
              ) : null}
              <label>
                Optional explanation
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="hamd-btn hamd-btn--primary"
                onClick={() => {
                  const items = clarification?.items ?? [];
                  const first = request.items[0];
                  const destination =
                    replyByField.destination?.trim() || request.destinationAddress || undefined;
                  const notes = replyByField.notes?.trim() || request.notes || undefined;
                  const quantity = replyByField.quantity?.trim();
                  const unit = replyByField.unit?.trim();
                  const description = replyByField.product?.trim();
                  void onBuyerUpdate?.({
                    ...(destination ? { destinationAddress: destination } : {}),
                    ...(notes ? { notes } : {}),
                    ...(first && (quantity || unit || description)
                      ? {
                          items: [
                            {
                              ...first,
                              description: description || first.description,
                              quantity: quantity || first.quantity,
                              unit: unit || first.unit,
                            },
                            ...request.items.slice(1),
                          ],
                        }
                      : {}),
                    ...(replyText.trim() ? { explanation: replyText.trim() } : {}),
                  });
                  onRequestCommand("submit", {
                    reason:
                      replyText.trim() ||
                      items
                        .map((item) => `${item.label}: ${replyByField[item.fieldKey] ?? ""}`)
                        .join("; ") ||
                      "Clarification provided.",
                  });
                }}
              >
                Submit Clarification
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="hamd-request-detail__lifecycle">
        <RequestLifecycle status={request.status} related={related} />
      </div>

      <div className={isOps ? "hamd-request-detail__ops-grid" : undefined}>
        <div className={isOps ? "hamd-request-detail__ops-col" : undefined}>
      {isOps ? (
        <section className="hamd-request-detail__panel">
          <h2>Customer</h2>
          <p className="hamd-request-detail__hint">
            The organisation and person who submitted this procurement request.
          </p>
          <dl className="hamd-request-detail__dl">
            <div>
              <dt>Requested by</dt>
              <dd>{request.requesterName || "Not provided"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd className="hamd-request-detail__break">{request.requesterEmail || "Not provided"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>Not provided</dd>
            </div>
            <div>
              <dt>Organisation</dt>
              <dd>{request.organizationName || "Not provided"}</dd>
            </div>
            <div>
              <dt>Line of business</dt>
              <dd>{procurementLobLabel(request.lob)}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{procurementPriorityLabel(request.priority)}</dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>
                {request.budgetAmount != null && request.budgetAmount !== ""
                  ? String(request.budgetAmount)
                  : "Not supplied"}
              </dd>
            </div>
            <div>
              <dt>Required by</dt>
              <dd>
                {request.requiredByDate
                  ? formatWhen(request.requiredByDate)
                  : "Not supplied"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="hamd-request-detail__panel">
        <h2>Request</h2>
        <dl className="hamd-request-detail__dl">
          <div>
            <dt>Created</dt>
            <dd>{formatWhen(request.createdAt)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatWhen(request.updatedAt)}</dd>
          </div>
          {!isOps ? (
            <div>
              <dt>Line of business</dt>
              <dd>{procurementLobLabel(request.lob)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Destination</dt>
            <dd>
              {request.destinationAddress || request.destinationCountryCode
                ? [request.destinationAddress, request.destinationCountryCode]
                    .filter(Boolean)
                    .join(", ")
                : "Not supplied"}
            </dd>
          </div>
        </dl>
        {request.notes ? <p className="hamd-request-detail__notes">{request.notes}</p> : null}
      </section>

      <section className="hamd-request-detail__panel hamd-request-detail__panel--items">
        <h2>Items</h2>
        {request.items.length === 0 ? (
          <p className="hamd-request-detail__empty">No line items.</p>
        ) : (
          <ul className="hamd-request-detail__items">
            {request.items.map((item) => (
              <li key={item.id}>
                <strong>{item.description}</strong>
                <span>
                  {item.quantity} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="hamd-request-detail__panel">
        <h2>Attachments</h2>
        <AttachmentBoard
          files={request.attachments ?? []}
          mediaTitle="Request media"
          documentsTitle="Documents"
          emptyLabel="No attachments."
          getAccessToken={getAccessToken}
        />
      </section>

        </div>
        <div className={isOps ? "hamd-request-detail__ops-col" : undefined}>

      <RelatedBlock
        title="Quotations"
        empty="Not available yet"
        rows={(related.quotations ?? []).map((row) => ({
          id: row.id,
          reference: row.publicCode,
          status: row.status,
        }))}
        onOpen={onOpenQuotation}
      />
      {latestQuote && quotationCommands.length > 0 ? (
        <div className="hamd-request-detail__actions">
          {quotationCommands.map((command) => (
            <button
              key={command}
              type="button"
              className="hamd-btn hamd-btn--primary"
              onClick={() => onQuotationCommand?.(latestQuote.id, command)}
            >
              {commandLabel(command)} quotation
            </button>
          ))}
        </div>
      ) : null}

      <RelatedBlock
        title="Purchase orders"
        empty="Not available yet"
        rows={(related.purchaseOrders ?? []).map((row) => ({
          id: row.id,
          reference: row.publicCode,
          status: row.status,
        }))}
      />
      <RelatedBlock
        title="Shipments"
        empty="Not available yet"
        rows={(related.shipments ?? []).map((row) => ({
          id: row.id,
          reference: row.publicCode,
          status: row.status,
          extra: row.trackingNumber ? `Tracking ${row.trackingNumber}` : null,
        }))}
        onOpen={onOpenShipment}
      />
      <RelatedBlock
        title="Invoices"
        empty="Not available yet"
        rows={(related.invoices ?? []).map((row) => ({
          id: row.id,
          reference: row.invoiceNumber,
          status: row.status,
          extra: row.totalAmount ? row.totalAmount : null,
        }))}
        onOpen={onOpenInvoice}
      />
      <RelatedBlock
        title="Payments"
        empty="Not available yet"
        rows={(related.payments ?? []).map((row) => ({
          id: row.id,
          reference: row.id.slice(0, 8).toUpperCase(),
          status: row.status,
        }))}
        onOpen={onOpenPayment}
      />

      {audience === "customer" && (request.history ?? []).length > 0 ? (
        <ClarificationHistory events={request.history ?? []} audience="customer" />
      ) : null}

      {audience === "admin" && (request.history ?? []).length > 0 ? (
        <ClarificationHistory events={request.history ?? []} audience="admin" />
      ) : null}

        </div>
      </div>

      <div className="hamd-request-detail__actions">
        {requestCommands
          .filter((command) => {
            if (command === "request_clarification") return false;
            if (isOps && statusCommands.some((item) => item === command)) return false;
            if (
              !isOps &&
              request.status === "needs_clarification" &&
              command === "submit"
            ) {
              return false;
            }
            if (command === "cancel") return false;
            return true;
          })
          .map((command) => (
          <button
            key={command}
            type="button"
            className="hamd-btn hamd-btn--secondary"
            onClick={() => onRequestCommand(command)}
          >
            {commandLabel(command)}
          </button>
        ))}
        {canCancel ? (
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            onClick={() => setCancelOpen(true)}
          >
            Cancel Request
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Request
          </button>
        ) : null}
        {!isOps ? extraActions : null}
      </div>
      <Dialog
        open={statusDialogOpen}
        title="Change request status"
        description={`Current status: ${procurementStatusLabel(request.status)}. Only valid next stages are listed.`}
        onClose={() => setStatusDialogOpen(false)}
        footer={
          <>
            <button type="button" className="hamd-btn hamd-btn--ghost" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="hamd-btn hamd-btn--primary"
              disabled={!selectedCommand}
              onClick={() => {
                if (!selectedCommand) return;
                const needsNote = selectedCommand === "decline";
                if (needsNote && statusNote.trim().length < 3) return;
                const note = statusNote.trim();
                onRequestCommand(selectedCommand, note ? { reason: note } : {});
                setStatusDialogOpen(false);
              }}
            >
              Update status
            </button>
          </>
        }
      >
        <fieldset className="hamd-request-detail__status-choices">
          <legend>Next status</legend>
          {statusCommands.map((command) => (
            <label key={command}>
              <input
                type="radio"
                name="next-status"
                checked={selectedCommand === command}
                onChange={() => setSelectedCommand(command)}
              />
              {commandLabel(command)}
            </label>
          ))}
        </fieldset>
        <label className="hamd-request-detail__assign">
          Update note
          <textarea
            value={statusNote}
            onChange={(event) => setStatusNote(event.target.value)}
            rows={3}
            placeholder="Optional customer-visible note where the transition requires a reason."
          />
        </label>
      </Dialog>
      <Dialog
        open={clarifyOpen}
        title="Request clarification"
        description="Choose the subject and write the exact question the buyer must answer."
        onClose={() => setClarifyOpen(false)}
        footer={
          <>
            <button type="button" className="hamd-btn hamd-btn--ghost" onClick={() => setClarifyOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="hamd-btn hamd-btn--primary"
              onClick={() => {
                const selected = fieldOptions.filter((field) =>
                  clarifyKeys.includes(field.fieldKey),
                );
                const items: ClarificationItem[] = selected.map((field) => ({
                  fieldKey: field.fieldKey,
                  label: field.label,
                  currentValue: field.currentValue,
                  prompt: (clarifyPrompts[field.fieldKey] ?? clarifyText).trim(),
                }));
                if (items.length === 0) {
                  setClarifyError("Select at least one information area.");
                  return;
                }
                if (items.some((item) => !isMeaningfulClarificationQuestion(item.prompt))) {
                  setClarifyError("Write what we need for each selected area.");
                  return;
                }
                onRequestCommand("request_clarification", {
                  reason: encodeClarificationItems(items),
                });
                setClarifyOpen(false);
                setClarifyText("");
                setClarifyKeys([]);
                setClarifyError(null);
              }}
            >
              Send clarification request
            </button>
          </>
        }
      >
        <div className="hamd-request-detail__clarify-fields">
          {fieldOptions.map((field) => {
            const selected = clarifyKeys.includes(field.fieldKey);
            return (
              <fieldset key={field.fieldKey} className="hamd-request-detail__clarify-item">
                <label className="hamd-request-detail__check">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      setClarifyKeys((prev) =>
                        prev.includes(field.fieldKey)
                          ? prev.filter((key) => key !== field.fieldKey)
                          : [...prev, field.fieldKey],
                      )
                    }
                  />
                  {field.label}
                </label>
                {selected ? (
                  <>
                    <p className="hamd-request-detail__hint">Current information</p>
                    <p>{field.currentValue}</p>
                    <label>
                      What needs clarification
                      <textarea
                        rows={3}
                        value={clarifyPrompts[field.fieldKey] ?? ""}
                        onChange={(event) =>
                          setClarifyPrompts((prev) => ({
                            ...prev,
                            [field.fieldKey]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </>
                ) : null}
              </fieldset>
            );
          })}
        </div>
        {clarifyError ? <p className="hamd-request-detail__clarify-error">{clarifyError}</p> : null}
      </Dialog>
      <ConfirmationDialog
        open={cancelOpen}
        title="Cancel this procurement request?"
        confirmLabel="Cancel Request"
        cancelLabel="Keep Request"
        tone="danger"
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          onRequestCommand("cancel", { reason: "Cancelled from the request workspace." });
          setCancelOpen(false);
        }}
      >
        <p>The request will be marked cancelled. Procurement history is retained.</p>
      </ConfirmationDialog>
      <ConfirmationDialog
        open={deleteOpen}
        title="Delete this request?"
        confirmLabel="Delete Request"
        busyLabel="Deleting..."
        busy={deleteBusy}
        cancelLabel="Keep Request"
        tone="danger"
        onCancel={() => {
          if (!deleteBusy) setDeleteOpen(false);
        }}
        onConfirm={() => {
          void (async () => {
            setDeleteBusy(true);
            try {
              await onDelete?.();
              setDeleteOpen(false);
            } finally {
              setDeleteBusy(false);
            }
          })();
        }}
      >
        <p>This request will be removed from My Requests.</p>
      </ConfirmationDialog>
    </article>
  );
}

export function requestFinanceLabel(related?: RequestRelatedDto | null): string {
  return relatedStateLabel(related?.invoices, "Not available yet");
}
