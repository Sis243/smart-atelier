import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

const ALLOWED = ["EN_ATTENTE", "EN_COURS", "TERMINE", "REJETE"];

export async function GET(_: Request, ctx: { params: { id: string } }) {
  try {
    const prismaAny = prisma as any;

    const step = await prismaAny.deliveryStep.findUnique({
      where: { id: ctx.params.id },
      include: {
        responsible: true,
        order: {
          include: {
            customer: true,
            attachments: true,
          },
        },
      },
    });

    if (!step) {
      return NextResponse.json(
        { ok: false, error: "Etape livraison introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, step });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur lecture livraison" },
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

    const step = await prismaAny.deliveryStep.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!step) {
      return NextResponse.json(
        { ok: false, error: "Etape livraison introuvable" },
        { status: 404 }
      );
    }

    await prismaAny.$transaction(async (tx: any) => {
      await tx.deliveryStep.update({
        where: { id },
        data: {
          status,
          note,
          deliveredAt: status === "TERMINE" ? new Date() : step.deliveredAt,
        },
      });

      if (step.order?.id) {
        await tx.order.update({
          where: { id: step.order.id },
          data: {
            status: status === "TERMINE" ? "TERMINE" : "EN_COURS",
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Mise a jour livraison impossible" },
      { status: 500 }
    );
  }
}
