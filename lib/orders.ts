// lib/orders.ts
import { prisma } from "@/lib/prisma";

export async function recalcOrderAmounts(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: true,
    },
  });

  if (!order) {
    throw new Error("Commande introuvable");
  }

  const grossTotal = Number(order.totalAmount || 0);
  const discount = Number(order.discount || 0);

  const paid = order.payments.reduce((sum, p) => {
    return sum + Number(p.amount || 0);
  }, 0);

  const netTotal = Math.max(0, grossTotal - discount);
  const balanceAmount = Math.max(0, netTotal - paid);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      depositAmount: paid,
      balanceAmount,
    },
  });

  return {
    totalAmount: grossTotal,
    discount,
    paid,
    balanceAmount,
  };
}