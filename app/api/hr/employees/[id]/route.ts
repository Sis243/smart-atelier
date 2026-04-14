import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        attendances: {
          orderBy: { date: "desc" },
          take: 20,
        },
        leaves: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        payslips: {
          orderBy: { generatedAt: "desc" },
          take: 20,
        },
        productionAssignments: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        cutAssignments: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { ok: false, error: "EmployÃ© introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, employee });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const body = await req.json();

    const fullName = toStr(body.fullName);
    const phone = toStr(body.phone) || null;
    const email = toStr(body.email) || null;
    const address = toStr(body.address) || null;
    const hireDate = body.hireDate ? new Date(body.hireDate) : body.hireDate === null ? null : undefined;
    const status = body.status != null ? toStr(body.status) : undefined;
    const baseSalary = body.baseSalary != null ? toNum(body.baseSalary, 0) : undefined;
    const currency = body.currency != null ? (toStr(body.currency) === "CDF" ? "CDF" : "USD") : undefined;
    const departmentId = body.departmentId != null ? (toStr(body.departmentId) || null) : undefined;
    const positionId = body.positionId != null ? (toStr(body.positionId) || null) : undefined;
    const documentUrl = body.documentUrl != null ? (toStr(body.documentUrl) || null) : undefined;

    if (body.fullName != null && !fullName) {
      return NextResponse.json(
        { ok: false, error: "Nom complet requis" },
        { status: 400 }
      );
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        fullName: body.fullName != null ? fullName : undefined,
        phone,
        email,
        address,
        hireDate,
        status,
        baseSalary,
        currency: currency as any,
        departmentId,
        positionId,
        documentUrl,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Suppression impossible" },
      { status: 500 }
    );
  }
}