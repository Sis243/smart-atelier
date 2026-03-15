import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/authz";

export async function GET() {
  const items = await prisma.stockItem.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      quantity: true,
      minQuantity: true,
      unitCost: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const guard = await requireRoles(["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE", "CAISSIER"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));

  const name = String(body.name ?? "").trim();
  const category = body.category ? String(body.category).trim() : null;
  const unit = body.unit ? String(body.unit).trim() : null;

  const quantity = Number(body.quantity ?? 0);
  const minQuantity = Number(body.minQuantity ?? 0);
  const unitCost = Number(body.unitCost ?? 0);

  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity < 0) return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
  if (!Number.isFinite(minQuantity) || minQuantity < 0) return NextResponse.json({ error: "Seuil min invalide" }, { status: 400 });
  if (!Number.isFinite(unitCost) || unitCost < 0) return NextResponse.json({ error: "Coût unitaire invalide" }, { status: 400 });

  const item = await prisma.stockItem.create({
    data: { name, category, unit, quantity, minQuantity, unitCost },
  });

  return NextResponse.json({ ok: true, item });
}
