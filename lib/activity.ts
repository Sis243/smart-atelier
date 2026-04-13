// lib/activity.ts
import { prisma } from "@/lib/prisma";

type LogParams = {
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
};

export async function logActivity({
  userId,
  action,
  entity,
  entityId,
  meta,
}: LogParams) {
  return prisma.activityLog.create({
    data: {
      userId: userId ?? null,
      action,
      entity: entity ?? null,
      entityId: entityId ?? null,
      metaJson: meta ? JSON.stringify(meta) : null,
    },
  });
}