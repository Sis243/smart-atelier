type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
};

type Props = {
  items: LowStockItem[];
};

export default function LowStockList({ items }: Props) {
  if (!items.length) {
    return <div className="text-sm text-zinc-400">Aucun article en seuil critique.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-sm font-medium text-white">{item.name}</div>
          <div className="mt-1 text-xs text-zinc-400">
            Quantité : {item.quantity} • Minimum : {item.minQuantity}
          </div>
        </div>
      ))}
    </div>
  );
}