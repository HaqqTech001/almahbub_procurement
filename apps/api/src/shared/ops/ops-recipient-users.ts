import type { DatabaseClient } from "../database/database-client.js";

export async function findUserIdsWithPermission(
  database: DatabaseClient,
  permissionKey: string,
): Promise<string[]> {
  const rows = await database.membershipRole.findMany({
    where: {
      endsAt: null,
      membership: { status: "active" },
      role: {
        permissions: {
          some: { permission: { key: permissionKey } },
        },
      },
    },
    select: { membership: { select: { userId: true } } },
  });
  return [...new Set(rows.map((row) => row.membership.userId))];
}
