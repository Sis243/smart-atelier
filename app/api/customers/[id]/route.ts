import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function clean(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
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

    const updated = await prisma.customer.update({
      where: { id },
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

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // ✅ Sécurité: interdire suppression si le client a des commandes
    const count = await prisma.order.count({ where: { customerId: id } });
    if (count > 0) {
      return NextResponse.json(
        { ok: false, error: "Impossible: ce client a déjà des commandes." },
        { status: 400 }
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
