import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";

type OrderItem = {
  id: string;
  code: string;
  customer: string;
  status: string;
  createdAt: string;
};

type Props = {
  items: OrderItem[];
};

export default function ExecutiveRecentOrders({ items }: Props) {
  if (!items.length) {
    return <div className="text-sm text-zinc-400">Aucune commande récente.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/dashboard/orders/${item.id}`}
              className="text-sm font-semibold text-amber-300 hover:underline"
            >
              {item.code}
            </Link>
            <StatusBadge status={item.status} />
          </div>

          <div className="mt-1 text-sm text-zinc-300">{item.customer}</div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {new Date(item.createdAt).toLocaleString("fr-FR")}
          </div>
        </div>
      ))}
    </div>
  );
}