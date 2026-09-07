import type { PaymentStatus } from "@hamd/database";

import { AppError } from "../../../../lib/app-error.js";

export type PaymentCommand = "submit" | "confirm";

const transitions: Readonly<Record<PaymentStatus, Partial<Record<PaymentCommand, PaymentStatus>>>> = {
  draft: { submit: "pending_confirmation" },
  requested: {},
  initiated: {},
  pending_confirmation: { confirm: "confirmed" },
  confirmed: {},
  allocated: {},
  settled: {},
  failed: {},
  refunded: {},
  voided: {},
  disputed: {},
};

export function transitionPayment(status: PaymentStatus, command: PaymentCommand): PaymentStatus {
  const target = transitions[status][command];
  if (target) return target;
  throw new AppError({
    statusCode: 409,
    code: "INVALID_STATE_TRANSITION",
    message: `Cannot ${command} a payment in ${status} status.`,
  });
}
