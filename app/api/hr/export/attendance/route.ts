import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/export-csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const items = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: true,
      },
      take: 5000,
    });

    const csv = toCsv(
      ["EmployÃ©", "Date", "Statut", "Note"],
      items.map((a) => [
        a.employee.fullName,
        new Date(a.date).toLocaleDateString("fr-FR"),
        a.status,
        a.note ?? "",
      ])
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="presences-rh.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Export prÃ©sences impossible" },
      { status: 500 }
    );
  }
}