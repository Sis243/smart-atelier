import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

const ALLOWED = ["EN_ATTENTE", "EN_COURS", "TERMINE", "REJETE"];

export async function GET(_: Request, ctx: { params: { id: string } }) {
  try {
    const prismaAny = prisma as any;

    const step = await prismaAny.qualityStep.findUnique({
      where: { id: ctx.params.id },
      include: {
        responsible: true,
        order: {
          include: {
            customer: true,
            attachments: true,
            production: true,
            coupeMeasurements: true,
          },
        },
      },
    });

    if (!step) {
      return NextResponse.json(
        { ok: false, error: "Etape qualite introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, step });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur lecture qualite" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const prismaAny = prisma as any;
    const body = await req.json();

    const id = ctx.params.id;
    const status = toStr(body.status).toUpperCase();
    const note = toStr(body.note) || null;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Statut invalide" },
        { status: 400 }
      );
    }

    const step = await prismaAny.qualityStep.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            production: true,
            delivery: true,
          },
        },
      },
    });

    if (!step) {
      return NextResponse.json(
        { ok: false, error: "Etape qualite introuvable" },
        { status: 404 }
      );
    }

    await prismaAny.$transaction(async (tx: any) => {
      await tx.qualityStep.update({
        where: { id },
        data: {
          status,
          note,
          checkedAt: status === "TERMINE" || status === "REJETE" ? new Date() : step.checkedAt,
        },
      });

      if (status === "EN_COURS") {
        await tx.order.update({
          where: { id: step.orderId },
          data: { status: "EN_COURS" },
        });
      }

      if (status === "TERMINE") {
        if (step.order?.delivery?.id) {
          await tx.deliveryStep.update({
            where: { id: step.order.delivery.id },
            data: {
              status: "EN_ATTENTE",
            },
          });
        } else {
          await tx.deliveryStep.create({
            data: {
              orderId: step.orderId,
              status: "EN_ATTENTE",
            },
          });
        }

        await tx.order.update({
          where: { id: step.orderId },
          data: { status: "EN_COURS" },
        });
      }

      if (status === "REJETE") {
        if (step.order?.production?.id) {
          await tx.productionStep.update({
            where: { id: step.order.production.id },
            data: {
              status: "EN_COURS",
              finishedAt: null,
            },
          });
        } else {
          await tx.productionStep.create({
            data: {
              orderId: step.orderId,
              status: "EN_COURS",
              startedAt: new Date(),
            },
          });
        }

        await tx.order.update({
          where: { id: step.orderId },
          data: { status: "EN_COURS" },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Mise a jour qualite impossible" },
      { status: 500 }
    );
  }
}
