import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ACCOUNTS = [
  { code: "101", name: "Capital", type: "CAPITAUX" },
  { code: "401", name: "Fournisseurs", type: "PASSIF" },
  { code: "411", name: "Clients", type: "ACTIF" },
  { code: "512", name: "Banque", type: "ACTIF" },
  { code: "531", name: "Caisse", type: "ACTIF" },
  { code: "601", name: "Achats matières et fournitures", type: "CHARGE" },
  { code: "606", name: "Frais généraux atelier", type: "CHARGE" },
  { code: "701", name: "Ventes couture", type: "PRODUIT" },
  { code: "706", name: "Prestations de service", type: "PRODUIT" },
];

function toStr(value: unknown) {
  return String(value ?? "").trim();
}

async function ensureDefaultAccounts() {
  const count = await prisma.account.count();
  if (count > 0) return;

  await prisma.account.createMany({
    data: DEFAULT_ACCOUNTS,
    skipDuplicates: true,
  });
}

export async function GET() {
  try {
    await ensureDefaultAccounts();

    const accounts = await prisma.account.findMany({
      orderBy: [{ code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, accounts });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur chargement comptes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = toStr(body.code);
    const name = toStr(body.name);
    const type = toStr(body.type) || "AUTRE";

    if (!code || !name) {
      return NextResponse.json(
        { ok: false, error: "Code et nom du compte requis" },
        { status: 400 }
      );
    }

    const account = await prisma.account.upsert({
      where: { code },
      update: { name, type },
      create: { code, name, type },
    });

    return NextResponse.json({ ok: true, account });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Création compte impossible" },
      { status: 500 }
    );
  }
}
