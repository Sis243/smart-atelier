// lib/notify.ts
import { prisma } from "@/lib/prisma";

type NotifyParams = {
  userIds: string[];
  type:
    | "MESSAGE"
    | "ORDER_ASSIGNED"
    | "ORDER_STATUS_CHANGED"
    | "WORKFLOW_STEP_CHANGED"
    | "PAYMENT_RECORDED"
    | "STOCK_LOW"
    | "SYSTEM";
  title: string;
  body?: string | null;
  entity?: string | null;
  entityId?: string | null;
  url?: string | null;
};

export async function createNotifications({
  userIds,
  type,
  title,
  body,
  entity,
  entityId,
  url,
}: NotifyParams) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));

  if (!ids.length) return { count: 0 };

  return prisma.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      type: type as any,
      title,
      body: body ?? null,
      entity: entity ?? null,
      entityId: entityId ?? null,
      url: url ?? null,
    })),
  });
}