import { prisma } from "@/lib/db";

export function computeBalance(args: {
  totalAmount: number;
  discount: number;
  depositAmount: number;
}) {
  const total = Number(args.totalAmount || 0);
  const discount = Number(args.discount || 0);
  const deposit = Number(args.depositAmount || 0);
  const balance = total - discount - deposit;
  return Number.isFinite(balance) ? Math.max(balance, 0) : 0;
}

export async function recalcOrderAmounts(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  const payments = await prisma.payment.aggregate({
    where: { orderId },
    _sum: { amount: true },
  });

  const depositAmount = Number(payments._sum.amount ?? 0);
  const balanceAmount = computeBalance({
    totalAmount: order.totalAmount,
    discount: order.discount,
    depositAmount,
  });

  return prisma.order.update({
    where: { id: orderId },
    data: { depositAmount, balanceAmount },
  });
}

export async function generateOrderCode() {
  // format: SA-YYYYMMDD-XXXX
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `SA-${y}${m}${d}`;

  const countToday = await prisma.order.count({
    where: { code: { startsWith: prefix } },
  });

  const seq = String(countToday + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}