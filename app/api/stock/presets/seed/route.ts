import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

const INITIAL_PRESETS = [
  { name: "Wax imprimé", category: "Tissu", unit: "m", minQuantity: 20, unitCost: 5.5 },
  { name: "Bazin riche", category: "Tissu", unit: "m", minQuantity: 10, unitCost: 12 },
  { name: "Lin", category: "Tissu", unit: "m", minQuantity: 8, unitCost: 9 },
  { name: "Jean (denim)", category: "Tissu", unit: "m", minQuantity: 10, unitCost: 7 },
  { name: "Coton simple", category: "Tissu", unit: "m", minQuantity: 15, unitCost: 3.2 },
  { name: "Satin", category: "Tissu", unit: "m", minQuantity: 10, unitCost: 6 },
  { name: "Soie", category: "Tissu", unit: "m", minQuantity: 5, unitCost: 15 },
  { name: "Fil noir polyester", category: "Fil", unit: "bobine", minQuantity: 15, unitCost: 1.2 },
  { name: "Fil blanc", category: "Fil", unit: "bobine", minQuantity: 15, unitCost: 1.2 },
  { name: "Boutons noirs", category: "Mercerie", unit: "pièce", minQuantity: 50, unitCost: 0.05 },
  { name: "Fermeture éclair 40 cm", category: "Mercerie", unit: "pièce", minQuantity: 20, unitCost: 1.5 },
  { name: "Élastique 4 cm", category: "Mercerie", unit: "m", minQuantity: 40, unitCost: 0.8 },
  { name: "Aiguilles machine", category: "Fourniture", unit: "boîte", minQuantity: 5, unitCost: 3.5 },
  { name: "Ciseaux de coupe", category: "Fourniture", unit: "pièce", minQuantity: 2, unitCost: 12 },
];

export async function POST() {
  const guard = await requireRole(["SUPERADMIN", "ADMIN", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    await prisma.$transaction(async (tx) => {
      for (const p of INITIAL_PRESETS) {
        await tx.stockPreset.upsert({
          where: { name: p.name },
          update: {
            category: p.category,
            unit: p.unit,
            minQuantity: p.minQuantity,
            unitCost: p.unitCost,
          },
          create: {
            name: p.name,
            category: p.category,
            unit: p.unit,
            minQuantity: p.minQuantity,
            unitCost: p.unitCost,
          },
        });

        const existing = await tx.stockItem.findFirst({
          where: { name: p.name },
        });

        if (!existing) {
          await tx.stockItem.create({
            data: {
              name: p.name,
              category: p.category,
              unit: p.unit,
              quantity: 0,
              minQuantity: p.minQuantity,
              unitCost: p.unitCost,
            },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Seed presets impossible" },
      { status: 500 }
    );
  }
}
