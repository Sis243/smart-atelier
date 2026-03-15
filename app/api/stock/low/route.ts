import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/authz";

export async function GET() {
  const guard = await requireRoles(["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE", "CAISSIER"]);
  if (!guard.ok) return guard.response;

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

  const low = items.filter((i) => Number(i.quantity || 0) < Number(i.minQuantity || 0));
  return NextResponse.json({ items: low });
}
