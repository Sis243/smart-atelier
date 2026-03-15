import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type StepStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "REJETE";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

const ALLOWED: StepStatus[] = ["EN_ATTENTE", "EN_COURS", "TERMINE", "REJETE"];

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = toStr(ctx.params.id);
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "id requis" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = toStr(body.status) as StepStatus;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ ok: false, error: "Statut invalide" }, { status: 400 });
    }

    const step = await prisma.$transaction(async (tx) => {
      // ✅ upsert productionStep
      const s = await tx.productionStep.upsert({
        where: { orderId },
        create: { orderId, status: status as any },
        update: { status: status as any },
        select: { id: true, status: true, orderId: true, updatedAt: true },
      });

      // ✅ si production commence => commande EN_COURS
      if (status === "EN_COURS") {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "EN_COURS" as any },
        });
      }

      // ✅ si production termine => créer QualityStep si absent (pour enchaîner)
      if (status === "TERMINE") {
        await tx.qualityStep.upsert({
          where: { orderId },
          create: { orderId, status: "EN_ATTENTE" as any },
          update: {},
          select: { id: true },
        });
      }

      return s;
    });

    return NextResponse.json({ ok: true, step });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}
