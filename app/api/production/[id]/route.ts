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
    if (!orderId) return NextResponse.json({ ok: false, error: "id requis" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const status = toStr(body.status) as StepStatus;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ ok: false, error: "Statut invalide" }, { status: 400 });
    }

    // ✅ upsert productionStep (sécurise si jamais la relation manque)
    const step = await prisma.productionStep.upsert({
      where: { orderId },
      create: { orderId, status: status as any },
      update: { status: status as any },
      select: { id: true, status: true, orderId: true },
    });

    // Optionnel: quand production commence, on met order.status = EN_COURS
    if (status === "EN_COURS") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "EN_COURS" as any },
      });
    }

    return NextResponse.json({ ok: true, step });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
