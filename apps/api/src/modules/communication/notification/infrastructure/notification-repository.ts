import type { Prisma } from "@hamd/database";

import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import type { ListNotificationsInput } from "../api/notification-schemas.js";

const notificationInclude = { deliveries: { orderBy: { createdAt: "desc" } } } as const satisfies Prisma.NotificationInclude;
export type NotificationRecord = Prisma.NotificationGetPayload<{ include: typeof notificationInclude }>;

export class NotificationRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public listInbox(userId: string, input: ListNotificationsInput): Promise<NotificationRecord[]> {
    return this.database.notification.findMany({
      where: {
        recipientUserId: userId, deletedAt: null,
        ...(input.status ? { status: input.status } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.q ? { OR: [{ title: { contains: input.q, mode: "insensitive" } }, { body: { contains: input.q, mode: "insensitive" } }] } : {}),
      },
      include: notificationInclude,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      take: input.pageSize + 1,
    });
  }

  public findInboxItem(userId: string, notificationId: string): Promise<NotificationRecord | null> {
    return this.database.notification.findFirst({ where: { id: notificationId, recipientUserId: userId, deletedAt: null }, include: notificationInclude });
  }
}
