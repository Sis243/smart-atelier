import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      absentToday,
      lateToday,
      leavePending,
      leaveApproved,
      payrollCount,
      productionAssignments,
      cutAssignments,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.attendance.count({
        where: {
          date: { gte: start, lt: end },
          status: "PRESENT",
        },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: start, lt: end },
          status: "ABSENT",
        },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: start, lt: end },
          status: "RETARD",
        },
      }),
      prisma.leaveRequest.count({ where: { status: "EN_ATTENTE" } }),
      prisma.leaveRequest.count({ where: { status: "APPROUVE" } }),
      prisma.payslip.count(),
      prisma.productionAssignment.count(),
      prisma.cutAssignment.count(),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        totalEmployees,
        activeEmployees,
        presentToday,
        absentToday,
        lateToday,
        leavePending,
        leaveApproved,
        payrollCount,
        productionAssignments,
        cutAssignments,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}