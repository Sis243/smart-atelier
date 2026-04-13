import ModuleGuard from "@/components/ModuleGuard";
import NewOrderClient from "./NewOrderClient";
import type { CustomerLite, StockPresetLite } from "./NewOrderClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getCustomers(): Promise<CustomerLite[]> {
  try {
    return await prisma.customer.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
      },
    });
  } catch {
    return [];
  }
}

async function getStockPresets(): Promise<StockPresetLite[]> {
  try {
    return await prisma.stockPreset.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function NouvelleCommandePage({
  searchParams,
}: {
  searchParams?: { customerId?: string };
}) {
  const customers = await getCustomers();
  const stockPresets = await getStockPresets();
  const selectedCustomerId = String(searchParams?.customerId ?? "");

  return (
    <ModuleGuard moduleKey="orders">
      <NewOrderClient
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        stockPresets={stockPresets}
      />
    </ModuleGuard>
  );
}
