import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}
function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET() {
  try {
    const payslips = await prisma.payslip.findMany({
      orderBy: { generatedAt: "desc" },
      include: {
        employee: true,
        payrollRun: true,
      },
      take: 100,
    });

    return NextResponse.json({ ok: true, payslips });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const employeeId = toStr(body.employeeId);
    const periodLabel = toStr(body.periodLabel) || "PÃ©riode";
    const currency = toStr(body.currency) === "CDF" ? "CDF" : "USD";
    const baseSalary = toNum(body.baseSalary, 0);
    const bonus = toNum(body.bonus, 0);
    const deductions = toNum(body.deductions, 0);
    const note = toStr(body.note) || null;

    if (!employeeId) {
      return NextResponse.json(
        { ok: false, error: "employeeId requis" },
        { status: 400 }
      );
    }

    const netSalary = baseSalary + bonus - deductions;

    const run = await prisma.payrollRun.create({
      data: {
        periodLabel,
        currency: currency as any,
      },
    });

    const payslip = await prisma.payslip.create({
      data: {
        payrollRunId: run.id,
        employeeId,
        baseSalary,
        bonus,
        deductions,
        netSalary,
        note,
      },
    });

    return NextResponse.json({ ok: true, id: payslip.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}