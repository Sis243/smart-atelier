import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const id = context.params.id;
    const body = await req.json().catch(() => ({}));

    const responsibleId = toStr(body?.assignedToId) || null;
    const prismaAny = prisma as any;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          message: "Commande introuvable.",
        },
        { status: 404 }
      );
    }

    if (responsibleId) {
      const user = await prismaAny.user.findUnique({
        where: { id: responsibleId },
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            ok: false,
            message: "Utilisateur introuvable.",
          },
          { status: 404 }
        );
      }

      if (user.isActive === false) {
        return NextResponse.json(
          {
            ok: false,
            message: "Cet utilisateur est inactif.",
          },
          { status: 400 }
        );
      }
    }

    const existingCutStep = await prismaAny.cutStep.findFirst({
      where: { orderId: id },
      select: {
        id: true,
        orderId: true,
        responsibleId: true,
        status: true,
      },
    });

    if (!existingCutStep) {
      const created = await prismaAny.cutStep.create({
        data: {
          orderId: id,
          status: "EN_ATTENTE",
          responsibleId,
        },
      });

      return NextResponse.json({
        ok: true,
        message: responsibleId
          ? "Étape de coupe créée et assignée."
          : "Étape de coupe créée sans responsable.",
        data: created,
      });
    }

    const updated = await prismaAny.cutStep.update({
      where: { id: existingCutStep.id },
      data: {
        responsibleId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: responsibleId
        ? "Affectation de coupe mise à jour."
        : "Responsable de coupe retiré.",
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/orders/[id]/cut-assign error:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message ||
          "Erreur serveur lors de la mise à jour de l’affectation de coupe.",
      },
      { status: 500 }
    );
  }
}