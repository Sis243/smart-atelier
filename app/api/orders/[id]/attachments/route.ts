import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderFileType } from "@prisma/client";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toInt(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function parseOrderFileType(v: unknown): OrderFileType {
  const raw = toStr(v).toUpperCase();
  const values = Object.values(OrderFileType) as string[];
  if (values.includes(raw)) return raw as OrderFileType;
  return OrderFileType.OTHER;
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = ctx.params.id;
    const body = await req.json().catch(() => ({}));

    const url = toStr(body.url);
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "url requis" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const created = await prisma.orderAttachment.create({
      data: {
        orderId,
        title: toStr(body.title) || null,
        fileName: toStr(body.fileName) || null,
        type: parseOrderFileType(body.type),
        url,
        mimeType: toStr(body.mimeType) || null,
        fileSize: toInt(body.fileSize) ?? null,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        type: true,
        url: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      attachment: {
        ...created,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}