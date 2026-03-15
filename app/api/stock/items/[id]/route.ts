import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/authz";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await prisma.stockItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRoles(["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE", "CAISSIER"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.category !== undefined) data.category = body.category ? String(body.category).trim() : null;
  if (body.unit !== undefined) data.unit = body.unit ? String(body.unit).trim() : null;

  if (body.minQuantity !== undefined) {
    const v = Number(body.minQuantity);
    if (!Number.isFinite(v) || v < 0) return NextResponse.json({ error: "Seuil min invalide" }, { status: 400 });
    data.minQuantity = v;
  }

  if (body.unitCost !== undefined) {
    const v = Number(body.unitCost);
    if (!Number.isFinite(v) || v < 0) return NextResponse.json({ error: "Coût unitaire invalide" }, { status: 400 });
    data.unitCost = v;
  }

  const item = await prisma.stockItem.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRoles(["SUPERADMIN", "ADMIN", "MANAGER"]);
  if (!guard.ok) return guard.response;

  await prisma.stockItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
