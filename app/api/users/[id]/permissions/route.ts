import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = params.id;

  try {
    const rows = await prisma.userPermission.findMany({
      where: { userId },
      select: {
        permission: { select: { id: true, key: true, label: true } },
      },
    });

    return NextResponse.json(rows.map((r) => r.permission));
  } catch (e) {
    console.error("[GET /api/users/:id/permissions]", e);
    return NextResponse.json(
      { error: "Erreur chargement permissions user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = params.id;

  try {
    const body = await req.json().catch(() => ({}));
    const permissionIds: string[] = Array.isArray(body.permissionIds) ? body.permissionIds : [];

    await prisma.$transaction([
      prisma.userPermission.deleteMany({ where: { userId } }),
      ...permissionIds.map((permissionId) =>
        prisma.userPermission.create({
          data: { userId, permissionId },
        })
      ),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PUT /api/users/:id/permissions]", e);
    return NextResponse.json(
      { error: "Erreur sauvegarde permissions user" },
      { status: 500 }
    );
  }
}
