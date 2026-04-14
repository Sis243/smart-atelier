import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function clean(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = String(body.fullName ?? "").trim();
    if (!fullName) {
      return NextResponse.json({ ok: false, error: "Le nom complet est obligatoire." }, { status: 400 });
    }

    const type = String(body.type ?? "STANDARD");
    const phone = clean(body.phone);
    const email = clean(body.email);
    const address = clean(body.address);
    const note = clean(body.note);

    const created = await prisma.customer.create({
      data: {
        fullName,
        type: type === "VIP" ? "VIP" : "STANDARD",
        phone,
        email,
        address,
        note,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
