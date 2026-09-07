import { Badge, type BadgeTone } from "./Badge.js";

export type StatusSemantic = Exclude<BadgeTone, "celebration">;

const EXPLICIT: Record<string, StatusSemantic> = {
  draft: "neutral",
  new: "neutral",
  queued: "neutral",
  archived: "neutral",
  closed: "neutral",
  inactive: "neutral",
  submitted: "info",
  reviewing: "info",
  accepted_for_sourcing: "info",
  sourcing: "info",
  quote_issued: "info",
  quoted: "info",
  purchase_in_progress: "info",
  processing: "info",
  shipping: "info",
  shipped: "info",
  in_progress: "info",
  needs_clarification: "warning",
  revision_requested: "warning",
  pending: "warning",
  pending_verification: "warning",
  needs_verification: "warning",
  awaiting: "warning",
  approved: "success",
  published: "success",
  paid: "success",
  completed: "success",
  fulfilled: "success",
  active: "success",
  cancelled: "danger",
  canceled: "danger",
  declined: "danger",
  rejected: "danger",
  failed: "danger",
  expired: "danger",
  suspended: "danger",
};

const SUCCESS = /\b(approved|published|paid|completed|complete|delivered|active|accepted|fulfilled|success|succeeded|resolved|verified)\b/i;
const WARNING = /\b(pending|awaiting|attention|review|on[_\s-]?hold|partial|expir|due|clarif|verif)\b/i;
const DANGER = /\b(rejected|failed|cancelled|canceled|declined|blocked|error|overdue|void|expired|suspended)\b/i;
const INFO = /\b(in[_\s-]?progress|processing|shipped|shipping|quoted|submitted|open|sent|issued|sourcing)\b/i;
const NEUTRAL = /\b(draft|new|idle|queued|archived|closed|inactive)\b/i;

function humanizeStatus(status: string): string {
  return status
    .trim()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/** Map a domain status string to a visual tone. Does not change the stored value. */
export function statusSemantic(status: string): StatusSemantic {
  const value = status.trim();
  if (!value) return "neutral";
  const explicit = EXPLICIT[value.toLowerCase().replaceAll(" ", "_")];
  if (explicit) return explicit;
  if (DANGER.test(value)) return "danger";
  if (SUCCESS.test(value)) return "success";
  if (WARNING.test(value)) return "warning";
  if (INFO.test(value)) return "info";
  if (NEUTRAL.test(value)) return "neutral";
  return "neutral";
}

export type StatusBadgeProps = {
  status: string;
  label?: string | undefined;
  className?: string | undefined;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge tone={statusSemantic(status)} className={className}>
      {label ?? humanizeStatus(status)}
    </Badge>
  );
}
