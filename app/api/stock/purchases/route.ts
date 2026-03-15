import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/authz";

type Currency = "USD" | "CDF";
function asCurrency(v: any): Currency {
  return v === "CDF" ? "CDF" : "USD";
}

export async function POST(req: Request) {
  const guard = await requireRoles(["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE", "CAISSIER"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));

  const itemName = String(body.itemName ?? "").trim();
  if (!itemName) return NextResponse.json({ error: "itemName requis" }, { status: 400 });

  const item = await prisma.stockItem.findFirst({ where: { name: itemName } });
  if (!item) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

  const supplierId = body.supplierId ? String(body.supplierId) : null;
  const quantity = Number(body.quantity ?? 0);
  const unitCost = Number(body.unitCost ?? 0);
  const currency = asCurrency(body.currency);
  const reference = body.reference ? String(body.reference) : null;

  await prisma.stockPurchase.create({
    data: {
      itemId: item.id,
      supplierId,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      unitCost: Number.isFinite(unitCost) ? unitCost : 0,
      currency,
      reference,
      purchasedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
