import { AppError } from "../../../../lib/app-error.js";

export const quotationCommands = [
  "review",
  "issue",
  "accept",
  "decline",
] as const;

export type QuotationCommand = (typeof quotationCommands)[number];

const transitions: Readonly<Record<string, Partial<Record<QuotationCommand, string>>>> =
  {
    draft: { review: "internally_reviewed" },
    internally_reviewed: { issue: "issued" },
    issued: { accept: "accepted", decline: "declined" },
  };

export function transitionQuotation(
  status: string,
  command: QuotationCommand,
): string {
  const target = transitions[status]?.[command];
  if (!target) {
    throw new AppError({
      statusCode: 409,
      code: "POLICY_VIOLATION",
      message: `Cannot ${command} a quotation in ${status}.`,
    });
  }
  return target;
}
