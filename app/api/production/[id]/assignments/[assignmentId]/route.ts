import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function PATCH(
  req: Request,
  ctx: { params: { id: string; assignmentId: string } }
) {
  try {
    const prismaAny = prisma as any;
    const body = await req.json();

    const quantityDone =
      body.quantityDone != null
        ? Math.max(0, toNum(body.quantityDone, 0))
        : undefined;

    const status = body.status != null ? toStr(body.status) : undefined;

    const current = await prismaAny.productionAssignment.findUnique({
      where: { id: ctx.params.assignmentId },
      select: {
        id: true,
        productionStepId: true,
        assignedQuantity: true,
      },
    });

    if (!current || current.productionStepId !== ctx.params.id) {
      return NextResponse.json(
        { ok: false, error: "Affectation introuvable" },
        { status: 404 }
      );
    }

    const safeQuantityDone =
      quantityDone != null
        ? Math.min(quantityDone, Number(current.assignedQuantity ?? 0))
        : undefined;

    const updated = await prismaAny.productionAssignment.update({
      where: { id: ctx.params.assignmentId },
      data: {
        completedQuantity: safeQuantityDone,
        status,
        startAt: status === "EN_COURS" ? new Date() : undefined,
        endAt: status === "TERMINE" ? new Date() : undefined,
      },
      select: { id: true },
    });

    const aggregate = await prismaAny.productionAssignment.aggregate({
      where: { productionStepId: ctx.params.id },
      _sum: { completedQuantity: true },
    });

    await prismaAny.productionStep.update({
      where: { id: ctx.params.id },
      data: {
        completedQuantity: Number(aggregate._sum.completedQuantity ?? 0),
        status: status === "EN_COURS" ? "EN_COURS" : undefined,
        startedAt: status === "EN_COURS" ? new Date() : undefined,
      },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Mise a jour impossible" },
      { status: 500 }
    );
  }
}
