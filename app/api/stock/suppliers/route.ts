import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/authz";

export async function GET() {
  const suppliers = await prisma.stockSupplier.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ suppliers });
}

export async function POST(req: Request) {
  const guard = await requireRoles(["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE", "CAISSIER"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const supplier = await prisma.stockSupplier.upsert({
    where: { name },
    update: {
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      address: body.address ? String(body.address) : null,
    },
    create: {
      name,
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      address: body.address ? String(body.address) : null,
    },
  });

  return NextResponse.json({ ok: true, supplier });
}
