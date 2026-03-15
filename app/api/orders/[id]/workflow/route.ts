import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Step = "CUT" | "PRODUCTION" | "QUALITY" | "DELIVERY";
type StepStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "REJETE";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = ctx.params.id;
    const body = await req.json();

    const step = String(body.step || "") as Step;
    const status = String(body.status || "") as StepStatus;
    const note = body.note != null ? String(body.note) : undefined;

    if (!orderId) return bad("orderId manquant");
    if (!["CUT", "PRODUCTION", "QUALITY", "DELIVERY"].includes(step)) return bad("step invalide");
    if (!["EN_ATTENTE", "EN_COURS", "TERMINE", "REJETE"].includes(status)) return bad("status invalide");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { cut: true, production: true, quality: true, delivery: true },
    });

    if (!order) return bad("Commande introuvable", 404);

    // Helpers
    const cut = order.cut;
    const prod = order.production;
    const qual = order.quality;
    const del = order.delivery;

    if (!cut || !prod || !qual || !del) {
      return bad("Workflow incomplet: étapes manquantes. (Crée-les à la création de commande)");
    }

    // Règles de séquence (ne pas sauter d’étape)
    const canStartProduction = cut.status === "TERMINE";
    const canStartQuality = prod.status === "TERMINE";
    const canStartDelivery = qual.status === "TERMINE";

    // Règles générales: on ne peut pas "terminer" si pas EN_COURS
    function mustBeInProgress(current: StepStatus) {
      if (current !== "EN_COURS") return false;
      return true;
    }

    // Update selon l’étape
    if (step === "CUT") {
      // CUT: autorise EN_COURS, TERMINE
      if (status === "EN_COURS" && cut.status !== "EN_ATTENTE") return bad("Coupe doit être EN_ATTENTE pour démarrer.");
      if (status === "TERMINE" && !mustBeInProgress(cut.status)) return bad("Coupe doit être EN_COURS pour terminer.");

      await prisma.cutStep.update({
        where: { orderId },
        data: {
          status,
          startedAt: status === "EN_COURS" ? new Date() : cut.startedAt,
          finishedAt: status === "TERMINE" ? new Date() : cut.finishedAt,
          note,
        },
      });

      // Quand coupe démarre → commande EN_COURS
      if (status === "EN_COURS" && order.status === "EN_ATTENTE") {
        await prisma.order.update({ where: { id: orderId }, data: { status: "EN_COURS" } });
      }
    }

    if (step === "PRODUCTION") {
      if (!canStartProduction) return bad("Impossible: la Coupe doit être TERMINÉE avant Production.");

      if (status === "EN_COURS" && prod.status !== "EN_ATTENTE") return bad("Production doit être EN_ATTENTE pour démarrer.");
      if (status === "TERMINE" && !mustBeInProgress(prod.status)) return bad("Production doit être EN_COURS pour terminer.");

      await prisma.productionStep.update({
        where: { orderId },
        data: {
          status,
          startedAt: status === "EN_COURS" ? new Date() : prod.startedAt,
          finishedAt: status === "TERMINE" ? new Date() : prod.finishedAt,
          note,
        },
      });
    }

    if (step === "QUALITY") {
      if (!canStartQuality) return bad("Impossible: la Production doit être TERMINÉE avant Qualité.");

      // Qualité: EN_COURS, TERMINE, REJETE
      if (status === "EN_COURS" && qual.status !== "EN_ATTENTE") return bad("Qualité doit être EN_ATTENTE pour démarrer.");
      if (status === "TERMINE" && !mustBeInProgress(qual.status)) return bad("Qualité doit être EN_COURS pour valider.");
      if (status === "REJETE" && !mustBeInProgress(qual.status)) return bad("Qualité doit être EN_COURS pour rejeter.");

      await prisma.qualityStep.update({
        where: { orderId },
        data: {
          status,
          checkedAt: status === "TERMINE" || status === "REJETE" ? new Date() : qual.checkedAt,
          note,
        },
      });

      // Si REJETE => on remet Production EN_COURS (pratique atelier)
      if (status === "REJETE") {
        await prisma.productionStep.update({
          where: { orderId },
          data: { status: "EN_COURS" },
        });
      }
    }

    if (step === "DELIVERY") {
      if (!canStartDelivery) return bad("Impossible: la Qualité doit être TERMINÉE avant Livraison.");

      if (status === "EN_COURS" && del.status !== "EN_ATTENTE") return bad("Livraison doit être EN_ATTENTE pour démarrer.");
      if (status === "TERMINE" && !mustBeInProgress(del.status)) return bad("Livraison doit être EN_COURS pour confirmer.");

      await prisma.deliveryStep.update({
        where: { orderId },
        data: {
          status,
          deliveredAt: status === "TERMINE" ? new Date() : del.deliveredAt,
          note,
        },
      });

      // Livraison terminée => commande TERMINE
      if (status === "TERMINE") {
        await prisma.order.update({ where: { id: orderId }, data: { status: "TERMINE" } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
