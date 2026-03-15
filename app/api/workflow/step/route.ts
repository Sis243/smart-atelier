import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/authz";

type StepName = "CUT" | "PRODUCTION" | "QUALITY" | "DELIVERY";

function nextStep(step: StepName): StepName | null {
  if (step === "CUT") return "PRODUCTION";
  if (step === "PRODUCTION") return "QUALITY";
  if (step === "QUALITY") return "DELIVERY";
  return null;
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const body = await req.json();
    const orderId: string = body?.orderId;
    const step: StepName = body?.step;
    const status: string = body?.status; // StepStatus
    const note: string | null = typeof body?.note === "string" ? body.note : null;

    if (!orderId || !step || !status) {
      return NextResponse.json({ error: "orderId + step + status required" }, { status: 400 });
    }

    // permission mapping
    const permMap: Record<StepName, string> = {
      CUT: "CUT_UPDATE",
      PRODUCTION: "PRODUCTION_UPDATE",
      QUALITY: "QUALITY_VALIDATE",
      DELIVERY: "DELIVERY_CONFIRM",
    };
    await requirePermission(user.id, permMap[step]);

    const now = new Date();

    // Update the step
    if (step === "CUT") {
      await prisma.cutStep.upsert({
        where: { orderId },
        update: {
          status: status as any,
          note,
          responsibleId: user.id,
          startedAt: status === "EN_COURS" ? now : undefined,
          finishedAt: status === "TERMINE" ? now : undefined,
        },
        create: { orderId, status: status as any, note, responsibleId: user.id, startedAt: status === "EN_COURS" ? now : null, finishedAt: status === "TERMINE" ? now : null },
      });
    }

    if (step === "PRODUCTION") {
      await prisma.productionStep.upsert({
        where: { orderId },
        update: {
          status: status as any,
          note,
          responsibleId: user.id,
          startedAt: status === "EN_COURS" ? now : undefined,
          finishedAt: status === "TERMINE" ? now : undefined,
        },
        create: { orderId, status: status as any, note, responsibleId: user.id, startedAt: status === "EN_COURS" ? now : null, finishedAt: status === "TERMINE" ? now : null },
      });
    }

    if (step === "QUALITY") {
      await prisma.qualityStep.upsert({
        where: { orderId },
        update: {
          status: status as any,
          note,
          responsibleId: user.id,
          checkedAt: now,
        },
        create: { orderId, status: status as any, note, responsibleId: user.id, checkedAt: now },
      });
    }

    if (step === "DELIVERY") {
      await prisma.deliveryStep.upsert({
        where: { orderId },
        update: {
          status: status as any,
          note,
          responsibleId: user.id,
          deliveredAt: status === "TERMINE" ? now : undefined,
        },
        create: { orderId, status: status as any, note, responsibleId: user.id, deliveredAt: status === "TERMINE" ? now : null },
      });
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "WORKFLOW_STEP_CHANGED",
        entity: "Order",
        entityId: orderId,
        metaJson: JSON.stringify({ step, status, note }),
      },
    });

    // Notify next step responsible role (simple strategy)
    const n = nextStep(step);
    if (n && status === "TERMINE") {
      const roleMap: Record<StepName, any> = {
        CUT: "COUPE",
        PRODUCTION: "PRODUCTION",
        QUALITY: "QUALITE",
        DELIVERY: "LOGISTIQUE",
      };
      const targetRole = roleMap[n];
      const targets = await prisma.user.findMany({
        where: { role: targetRole, isActive: true },
        select: { id: true },
      });

      if (targets.length) {
        await prisma.notification.createMany({
          data: targets.map((t) => ({
            userId: t.id,
            type: "WORKFLOW_STEP_CHANGED",
            title: "Nouvelle commande à traiter",
            body: `La commande ${orderId} est prête pour l'étape ${n}.`,
            entity: "Order",
            entityId: orderId,
            url: `/dashboard/commandes/${orderId}`,
          })),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
