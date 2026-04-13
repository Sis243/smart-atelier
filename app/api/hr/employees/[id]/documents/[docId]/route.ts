import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string; docId: string }> }
) {

  try {
    const { id, docId } = await context.params;
    const prismaAny = prisma as any;

    if (prismaAny.employeeDocument && docId !== "legacy") {
      const doc = await prismaAny.employeeDocument.findFirst({
        where: {
          id: docId,
          employeeId: id,
        },
      });

      if (!doc) {
        return NextResponse.json(
          { ok: false, error: "Document introuvable" },
          { status: 404 }
        );
      }

      try {
        const filePath = path.join(process.cwd(), "public", doc.url);
        await unlink(filePath);
      } catch {}

      await prismaAny.employeeDocument.delete({
        where: { id: docId },
      });

      return NextResponse.json({ ok: true });
    }

    const employee = await prismaAny.employee.findUnique({
      where: { id },
      select: { id: true, documentUrl: true },
    });

    if (!employee?.documentUrl) {
      return NextResponse.json(
        { ok: false, error: "Document introuvable" },
        { status: 404 }
      );
    }

    try {
      const filePath = path.join(process.cwd(), "public", employee.documentUrl);
      await unlink(filePath);
    } catch {}

    await prismaAny.employee.update({
      where: { id },
      data: {
        documentUrl: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Suppression impossible" },
      { status: 500 }
    );
  }
}