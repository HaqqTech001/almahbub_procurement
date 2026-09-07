import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { ProcurementRequestService } from "../application/procurement-request-service.js";
import { serializeRequestRelated } from "./procurement-request-related.js";

export type ProcurementRequestAudience = "buyer" | "ops";

type RequestRecord = Awaited<ReturnType<ProcurementRequestService["get"]>>;

export function procurementRequestAudience(
  context: AuthContext,
): ProcurementRequestAudience {
  return context.permissionKeys.has("request:manage") ? "ops" : "buyer";
}

function personName(person?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null): string | null {
  const name = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || person?.email || null;
}

function formatAttachmentSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentKind(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType === "text/plain") return "document";
  return "file";
}

function primaryAssignment(request: RequestRecord) {
  return (
    request.assignments?.find((row) => row.isPrimary) ??
    request.assignments?.[0] ??
    null
  );
}

function assigneeName(request: RequestRecord): string | null {
  return personName(primaryAssignment(request)?.membership?.user ?? null);
}

function assigneeMembershipId(request: RequestRecord): string | null {
  return primaryAssignment(request)?.membershipId ?? null;
}

/**
 * Buyer projections omit Ops-only fields (assignee, archive metadata, actor identities).
 * `notes` is the requester's own request notes, not V1 admin_notes.
 */
export function serializeProcurementRequest(
  request: RequestRecord,
  audience: ProcurementRequestAudience,
) {
  const shared = {
    id: request.id,
    publicCode: request.publicCode,
    status: request.status,
    lob: request.lob,
    title: request.title,
    currencyCode: request.currencyCode,
    notes: request.notes,
    destinationCountryCode: request.destinationCountryCode,
    destinationAddress: request.destinationAddress,
    requiredByDate: request.requiredByDate,
    budgetAmount: request.budgetAmount?.toString() ?? null,
    priority: request.priority,
    restrictedGoodsDeclared: request.restrictedGoodsDeclared,
    requesterId: request.requesterId,
    requesterEmail: request.requester?.email ?? null,
    requesterName: personName(request.requester),
    ownerName: personName(request.requester),
    organizationId: request.organizationId,
    organizationName:
      request.organization?.displayName ||
      request.organization?.legalName ||
      null,
    rowVersion: request.rowVersion,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    related: serializeRequestRelated(request),
    history: (request.statusEvents ?? []).map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      command: event.command,
      reason: event.reason,
      actorName: audience === "ops" ? personName(event.actor) : null,
      createdAt: event.createdAt,
    })),
    items: request.items.map((item) => ({
      id: item.id,
      productVariantId: item.productVariantId,
      description: item.description,
      quantity: item.quantity.toString(),
      unit: item.unit,
      targetUnitAmount: item.targetUnitAmount?.toString() ?? null,
    })),
    attachments: (request.documents ?? []).map((link) => ({
      id: link.document.id,
      name: link.document.originalFilename,
      mimeType: link.document.mimeType,
      sizeBytes: link.document.sizeBytes,
      sizeLabel: formatAttachmentSize(link.document.sizeBytes),
      href: `/api/v1/documents/${link.document.id}`,
      kind: attachmentKind(link.document.mimeType),
      uploadedAt: link.document.createdAt,
    })),
    documentIds: (request.documents ?? []).map((link) => link.documentId),
  };

  if (audience === "buyer") {
    return {
      ...shared,
      archivedAt: null,
      assigneeName: null,
      assigneeMembershipId: null,
    };
  }

  return {
    ...shared,
    archivedAt: request.archivedAt,
    assigneeName: assigneeName(request),
    assigneeMembershipId: assigneeMembershipId(request),
  };
}
