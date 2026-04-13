import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: Request,
  ctx: { params: { id: string } }
) {

  try {
    const id = ctx.params.id;
    const prismaAny = prisma as any;

    const department = await prismaAny.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { ok: false, error: "DÃ©partement introuvable" },
        { status: 404 }
      );
    }

    if ((department._count?.employees ?? 0) > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Impossible de supprimer : ce dÃ©partement est dÃ©jÃ  utilisÃ©.",
        },
        { status: 400 }
      );
    }

    await prismaAny.department.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Suppression impossible" },
      { status: 500 }
    );
  }
}