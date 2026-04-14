import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const authGuard = await requireUser();
  if (!authGuard.ok) return authGuard.response;

  const permGuard = await requirePermission("workflow.update");
  if (!permGuard.ok) return permGuard.response;

  try {
    const body = await req.json();

    const orderId = String(body?.orderId ?? "").trim();
    const step = String(body?.step ?? "").trim();
    const status = String(body?.status ?? "").trim();

    if (!orderId || !step || !status) {
      return NextResponse.json(
        { ok: false, error: "orderId, step et status requis" },
        { status: 400 }
      );
    }

    let updated;

    if (step === "COUPE") {
      updated = await prisma.cutStep.update({
        where: { orderId },
        data: {
          status: status as any,
          updatedAt: new Date(),
        },
      });
    } else if (step === "PRODUCTION") {
      updated = await prisma.productionStep.update({
        where: { orderId },
        data: {
          status: status as any,
          updatedAt: new Date(),
        },
      });
    } else if (step === "QUALITE") {
      updated = await prisma.qualityStep.update({
        where: { orderId },
        data: {
          status: status as any,
          updatedAt: new Date(),
        },
      });
    } else if (step === "LIVRAISON") {
      updated = await prisma.deliveryStep.update({
        where: { orderId },
        data: {
          status: status as any,
          updatedAt: new Date(),
        },
      });
    } else {
      return NextResponse.json(
        { ok: false, error: "Étape inconnue" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, step: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur mise à jour workflow" },
      { status: 500 }
    );
  }
}