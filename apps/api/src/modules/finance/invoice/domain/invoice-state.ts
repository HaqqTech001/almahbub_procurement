import type { InvoiceStatus } from "@hamd/database";

import { AppError } from "../../../../lib/app-error.js";

export type InvoiceCommand = "issue" | "void";

const transitions: Readonly<Record<InvoiceStatus, Partial<Record<InvoiceCommand, InvoiceStatus>>>> = {
  draft: { issue: "issued", void: "voided" },
  issued: { void: "voided" },
  paid: {},
  partially_paid: {},
  overdue: {},
  voided: {},
};

export function transitionInvoice(status: InvoiceStatus, command: InvoiceCommand): InvoiceStatus {
  const target = transitions[status][command];
  if (target) return target;
  throw new AppError({
    statusCode: 409,
    code: "INVALID_STATE_TRANSITION",
    message: `Cannot ${command} an invoice in ${status} status.`,
  });
}
