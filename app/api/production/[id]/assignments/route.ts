import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function targetQuantity(order: any) {
  return Math.max(1, order?.isLot ? Number(order?.lotQuantity ?? 1) : 1);
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  try {
    const prismaAny = prisma as any;

    const rows = await prismaAny.productionAssignment.findMany({
      where: { productionStepId: ctx.params.id },
      orderBy: { createdAt: "desc" },
      include: {
        employee: true,
      },
    });

    return NextResponse.json({
      ok: true,
      rows: rows.map((a: any) => ({
        id: a.id,
        employeeId: a.employeeId,
        employeeName: a.employee?.fullName ?? "-",
        quantityAssigned: Number(a.assignedQuantity ?? 0),
        quantityDone: Number(a.completedQuantity ?? 0),
        status: a.status ?? "EN_ATTENTE",
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur lecture affectations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const prismaAny = prisma as any;
    const body = await req.json();

    const productionStepId = ctx.params.id;
    const employeeId = toStr(body.employeeId);
    const quantityAssigned = Math.max(1, toNum(body.quantityAssigned, 1));

    if (!employeeId) {
      return NextResponse.json(
        { ok: false, error: "Employe requis" },
        { status: 400 }
      );
    }

    const step = await prismaAny.productionStep.findUnique({
      where: { id: productionStepId },
      include: {
        order: {
          select: {
            id: true,
            isLot: true,
            lotQuantity: true,
          },
        },
        assignments: {
          select: {
            assignedQuantity: true,
          },
        },
      },
    });

    if (!step) {
      return NextResponse.json(
        { ok: false, error: "Etape production introuvable" },
        { status: 404 }
      );
    }

    const maxQuantity = targetQuantity(step.order);
    const alreadyAssigned = step.assignments.reduce(
      (sum: number, assignment: any) => sum + Number(assignment.assignedQuantity ?? 0),
      0
    );

    if (alreadyAssigned + quantityAssigned > maxQuantity) {
      return NextResponse.json(
        {
          ok: false,
          error: `Quantite trop elevee. Reste a affecter: ${Math.max(0, maxQuantity - alreadyAssigned)}.`,
        },
        { status: 400 }
      );
    }

    const created = await prismaAny.productionAssignment.create({
      data: {
        productionStepId,
        employeeId,
        assignedQuantity: quantityAssigned,
        completedQuantity: 0,
        status: "EN_ATTENTE",
      },
      select: { id: true },
    });

    await prismaAny.productionStep.update({
      where: { id: productionStepId },
      data: {
        plannedQuantity: maxQuantity,
        status: "EN_COURS",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Creation affectation impossible" },
      { status: 500 }
    );
  }
}
