import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function targetQuantity(order: any) {
  return Math.max(1, order?.isLot ? Number(order?.lotQuantity ?? 1) : 1);
}

export async function PATCH(_: Request, ctx: { params: { id: string } }) {
  try {
    const prismaAny = prisma as any;
    const id = ctx.params.id;

    const step = await prismaAny.productionStep.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            quality: true,
          },
        },
        assignments: true,
      },
    });

    if (!step) {
      return NextResponse.json(
        { ok: false, error: "Etape production introuvable" },
        { status: 404 }
      );
    }

    const target = targetQuantity(step.order);
    const completedTotal = (step.assignments || []).reduce(
      (sum: number, assignment: any) => sum + Number(assignment.completedQuantity ?? 0),
      0
    );

    if ((step.assignments || []).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Affecte au moins un couturier avant de cloturer la production." },
        { status: 400 }
      );
    }

    if (completedTotal < target) {
      return NextResponse.json(
        {
          ok: false,
          error: `Production incomplete: ${completedTotal}/${target} piece(s) realisees.`,
        },
        { status: 400 }
      );
    }

    await prismaAny.$transaction(async (tx: any) => {
      await tx.productionStep.update({
        where: { id },
        data: {
          status: "TERMINE",
          finishedAt: new Date(),
          completedQuantity: completedTotal,
          plannedQuantity: target,
        },
      });

      if (step.order?.quality?.id) {
        await tx.qualityStep.update({
          where: { id: step.order.quality.id },
          data: {
            status: "EN_ATTENTE",
          },
        });
      } else {
        await tx.qualityStep.create({
          data: {
            orderId: step.orderId,
            status: "EN_ATTENTE",
          },
        });
      }

      await tx.order.update({
        where: { id: step.orderId },
        data: {
          status: "EN_COURS",
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Production terminee, commande envoyee en qualite.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Cloture production impossible" },
      { status: 500 }
    );
  }
}
