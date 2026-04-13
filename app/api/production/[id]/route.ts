import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type StepStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "REJETE";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

const ALLOWED: StepStatus[] = ["EN_ATTENTE", "EN_COURS", "TERMINE", "REJETE"];

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const productionStepId = toStr(ctx.params.id);
    if (!productionStepId) {
      return NextResponse.json(
        { ok: false, error: "id requis" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const status = toStr(body.status) as StepStatus;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Statut invalide" },
        { status: 400 }
      );
    }

    const prismaAny = prisma as any;

    const step = await prismaAny.productionStep.findUnique({
      where: { id: productionStepId },
      select: {
        id: true,
        orderId: true,
      },
    });

    if (!step) {
      return NextResponse.json(
        { ok: false, error: "Étape production introuvable" },
        { status: 404 }
      );
    }

    const updated = await prismaAny.productionStep.update({
      where: { id: productionStepId },
      data: {
        status,
        startedAt: status === "EN_COURS" ? new Date() : undefined,
        finishedAt: status === "TERMINE" ? new Date() : status === "REJETE" ? null : undefined,
      },
      select: { id: true, status: true, orderId: true },
    });

    if (status === "EN_COURS") {
      await prisma.order.update({
        where: { id: step.orderId },
        data: { status: "EN_COURS" as any },
      });
    }

    return NextResponse.json({ ok: true, step: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}