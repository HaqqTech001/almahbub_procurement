import type { ProcurementRequestStatus } from "@hamd/database";

import { AppError } from "../../../lib/app-error.js";

export const procurementRequestCommands = [
  "submit",
  "request_clarification",
  "accept_for_sourcing",
  "start_sourcing",
  "request_revision",
  "approve",
  "decline",
  "start_purchase",
  "fulfill",
  "close",
  "cancel",
] as const;

export type ProcurementRequestCommand =
  (typeof procurementRequestCommands)[number];

const transitions: Readonly<
  Record<ProcurementRequestCommand, readonly ProcurementRequestStatus[]>
> = {
  submit: ["draft", "needs_clarification"],
  request_clarification: ["submitted"],
  accept_for_sourcing: ["submitted"],
  start_sourcing: ["accepted_for_sourcing"],
  request_revision: ["quote_issued"],
  approve: ["quote_issued"],
  decline: ["quote_issued"],
  start_purchase: ["approved"],
  fulfill: ["purchase_in_progress"],
  close: ["fulfilled"],
  cancel: [
    "draft",
    "submitted",
    "needs_clarification",
    "accepted_for_sourcing",
    "sourcing",
  ],
};

const targetStates: Readonly<
  Record<ProcurementRequestCommand, ProcurementRequestStatus>
> = {
  submit: "submitted",
  request_clarification: "needs_clarification",
  accept_for_sourcing: "accepted_for_sourcing",
  start_sourcing: "sourcing",
  request_revision: "revision_requested",
  approve: "approved",
  decline: "declined",
  start_purchase: "purchase_in_progress",
  fulfill: "fulfilled",
  close: "closed",
  cancel: "cancelled",
};

export function transitionProcurementRequest(
  currentStatus: ProcurementRequestStatus,
  command: ProcurementRequestCommand,
): ProcurementRequestStatus {
  if (!transitions[command].includes(currentStatus)) {
    throw new AppError({
      statusCode: 409,
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot ${command.replaceAll("_", " ")} a request in ${currentStatus}.`,
    });
  }

  return targetStates[command];
}
