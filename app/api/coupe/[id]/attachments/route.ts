export const dynamic = "force-dynamic";

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OrderFileType } from "@prisma/client";

const ORDER_FILE_TYPES = Object.values(OrderFileType) as OrderFileType[];

function parseOrderFileType(v: unknown): OrderFileType {
  const raw = String(v ?? "").trim();
  const upper = raw.toUpperCase();

  const found =
    ORDER_FILE_TYPES.find((x) => String(x) === raw) ??
    ORDER_FILE_TYPES.find((x) => String(x).toUpperCase() === upper);

  return found ?? ORDER_FILE_TYPES[0];
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = ctx.params.id;
    const body = await req.json();

    const url = String(body?.url ?? "").trim();
    if (!url) return NextResponse.json({ ok: false, error: "url requis" }, { status: 400 });

    const fileName = body?.fileName ? String(body.fileName).trim() : null;
    const title = body?.title ? String(body.title).trim() : null;
    const type = parseOrderFileType(body?.type);

    const attachment = await prisma.orderAttachment.create({
      data: { orderId, url, fileName, title, type },
      select: { id: true, url: true, fileName: true, title: true, type: true, createdAt: true },
    });

    return NextResponse.json({
      ok: true,
      attachment: { ...attachment, createdAt: attachment.createdAt.toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
