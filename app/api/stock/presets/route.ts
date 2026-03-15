import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/authz";

export async function GET() {
  const presets = await prisma.stockPreset.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ presets });
}

export async function POST(req: Request) {
  const guard = await requireRoles(["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE", "CAISSIER"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const category = body.category ? String(body.category).trim() : null;
  const unit = body.unit ? String(body.unit).trim() : null;

  const minQuantity = Number(body.minQuantity ?? 0);
  const unitCost = Number(body.unitCost ?? 0);

  const preset = await prisma.stockPreset.upsert({
    where: { name },
    update: { category, unit, minQuantity, unitCost },
    create: { name, category, unit, minQuantity, unitCost },
  });

  return NextResponse.json({ ok: true, preset });
}
