import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_DEPARTMENTS = [
  "Administration",
  "Commercial",
  "Coupe",
  "Production",
  "Qualité",
  "Livraison",
  "Stock",
  "RH",
  "Comptabilité",
];

const DEFAULT_POSITIONS = [
  "Administrateur",
  "Manager",
  "Assistant RH",
  "Commercial",
  "Coupeur",
  "Couturier",
  "Responsable production",
  "Contrôleur qualité",
  "Livreur",
  "Stockiste",
  "Caissier",
];

async function ensureHrMeta() {
  const prismaAny = prisma as any;
  const [departmentCount, positionCount] = await Promise.all([
    prismaAny.department.count(),
    prismaAny.position.count(),
  ]);

  if (departmentCount === 0) {
    await prismaAny.department.createMany({
      data: DEFAULT_DEPARTMENTS.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  if (positionCount === 0) {
    await prismaAny.position.createMany({
      data: DEFAULT_POSITIONS.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }
}

export async function GET() {

  try {
    const prismaAny = prisma as any;
    await ensureHrMeta();

    const [departments, positions] = await Promise.all([
      prismaAny.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prismaAny.position.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      departments,
      positions,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur meta RH" },
      { status: 500 }
    );
  }
}
