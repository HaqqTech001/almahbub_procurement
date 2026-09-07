import type { OpsDirectoryMember } from "../api/ops-api.js";

export function directoryDisplayName(member: OpsDirectoryMember): string {
  return (
    member.displayName?.trim() ||
    [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
    member.email
  );
}

export function directoryFormatDate(iso?: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function directoryHasOpsAccess(member: OpsDirectoryMember): boolean {
  if (member.hasOpsAccess) return true;
  return member.roles.some((item) =>
    ["ops_admin", "ops", "operations"].includes(item.key),
  );
}

export function directoryStatusKey(member: OpsDirectoryMember): string {
  return member.userStatus ?? member.status;
}
