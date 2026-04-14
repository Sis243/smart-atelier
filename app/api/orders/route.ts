import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderFileType } from "@prisma/client";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function makeOrderCode() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${y}${m}${day}-${rnd}`;
}

type IncomingAttachment = {
  title?: string | null;
  fileName?: string | null;
  type?: string | null;
  url: string;
  mimeType?: string | null;
  fileSize?: number | null;
};

function normalizeAttachmentType(t?: string | null): OrderFileType {
  const v = String(t ?? "").toUpperCase().trim();
  const values = Object.values(OrderFileType) as string[];
  return values.includes(v) ? (v as OrderFileType) : OrderFileType.OTHER;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerId = toStr(body.customerId);
    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: "customerId requis" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json(
        { ok: false, error: "Client introuvable" },
        { status: 404 }
      );
    }

    const currency = toStr(body.currency) === "CDF" ? "CDF" : "USD";
    const fxRate = toNum(body.fxRate, 1);

    const grossTotal = toNum(body.totalAmount, 0);
    const discount = toNum(body.discount, 0);
    const depositAmount = toNum(body.depositAmount, 0);

    const totalAmount = Math.max(0, grossTotal - discount);
    const balanceAmount = Math.max(0, totalAmount - depositAmount);

    const isLot = Boolean(body.isLot);
    const lotLabel = toStr(body.lotLabel) || null;
    const lotQuantity = Math.max(1, Math.floor(toNum(body.lotQuantity, 1)));

    const itemType = toStr(body.itemType) || null;
    const category = toStr(body.category) || null;
    const fabricType = toStr(body.fabricType) || null;
    const fabricColor = toStr(body.fabricColor) || null;

    const fabricMetersRaw = body.fabricMeters;
    const fabricMeters =
      fabricMetersRaw === null ||
      fabricMetersRaw === undefined ||
      String(fabricMetersRaw).trim() === ""
        ? null
        : toNum(fabricMetersRaw, 0);

    const description = toStr(body.description) || null;
    const measurements = toStr(body.measurements) || null;

    const attachments: IncomingAttachment[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    const created = await prisma.$transaction(async (tx) => {
      const now = new Date();

      const order = await tx.order.create({
        data: {
          code: makeOrderCode(),
          customerId,
          currency: currency as any,
          fxRate,
          totalAmount,
          discount,
          depositAmount,
          balanceAmount,
          isLot,
          lotLabel,
          lotQuantity,
          itemType,
          category,
          fabricType,
          fabricColor,
          fabricMeters,
          description,
          measurements,
          sentToCuttingAt: now,
          status: "EN_ATTENTE" as any,
        },
        select: { id: true, code: true },
      });

      await tx.cutStep.create({
        data: { orderId: order.id, status: "EN_ATTENTE" as any },
      });

      await tx.productionStep.create({
        data: { orderId: order.id, status: "EN_ATTENTE" as any },
      });

      await tx.qualityStep.create({
        data: { orderId: order.id, status: "EN_ATTENTE" as any },
      });

      await tx.deliveryStep.create({
        data: { orderId: order.id, status: "EN_ATTENTE" as any },
      });

      const validAttachments = attachments
        .filter(
          (a) =>
            a?.url &&
            (/^https?:\/\//i.test(String(a.url)) ||
              String(a.url).startsWith("/uploads/"))
        )
        .map((a) => ({
          orderId: order.id,
          url: String(a.url),
          title: a.title ?? null,
          fileName: a.fileName ?? null,
          type: normalizeAttachmentType(a.type),
          mimeType: a.mimeType ?? null,
          fileSize: a.fileSize != null ? Number(a.fileSize) : null,
        }));

      if (validAttachments.length > 0) {
        await tx.orderAttachment.createMany({
          data: validAttachments,
        });
      }

      return order;
    });

    return NextResponse.json({
      ok: true,
      id: created.id,
      code: created.code,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}