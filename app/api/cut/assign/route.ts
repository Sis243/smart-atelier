import { NextResponse } from "next/server";
import { CutPriority, CutAssignmentStatus, StepStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function parsePriority(value: unknown): CutPriority {
  const v = toStr(value).toUpperCase();

  if (v === "BASSE") return CutPriority.BASSE;
  if (v === "HAUTE") return CutPriority.HAUTE;
  if (v === "URGENTE") return CutPriority.URGENTE;

  return CutPriority.NORMALE;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = toStr(body.orderId);
    const employeeId = toStr(body.employeeId);
    const roleLabel = toStr(body.roleLabel) || null;
    const assignedQuantity = Math.max(0, Math.floor(toNum(body.assignedQuantity, 0)));
    const priority = parsePriority(body.priority);
    const note = toStr(body.note) || null;
    const dueAt = body.dueAt ? new Date(body.dueAt) : null;

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "orderId requis" },
        { status: 400 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { ok: false, error: "employeeId requis" },
        { status: 400 }
      );
    }

    const cut = await prisma.cutStep.findUnique({
      where: { orderId },
      select: { id: true, orderId: true },
    });

    if (!cut) {
      return NextResponse.json(
        { ok: false, error: "Étape coupe introuvable" },
        { status: 404 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, fullName: true },
    });

    if (!employee) {
      return NextResponse.json(
        { ok: false, error: "Agent introuvable" },
        { status: 404 }
      );
    }

    const created = await prisma.cutAssignment.create({
      data: {
        cutStepId: cut.id,
        employeeId,
        roleLabel,
        assignedQuantity,
        completedQuantity: 0,
        status: CutAssignmentStatus.EN_ATTENTE,
        priority,
        dueAt,
        note,
      },
      select: { id: true },
    });

    await prisma.cutStep.update({
      where: { orderId },
      data: {
        status: StepStatus.EN_COURS,
      },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Erreur serveur";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}