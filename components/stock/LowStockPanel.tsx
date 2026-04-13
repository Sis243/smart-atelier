type Item = {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
};

type Props = {
  items: Item[];
};

export default function LowStockPanel({ items }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
        Aucun article en stock faible.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-red-500/10 p-4 ring-1 ring-red-400/20">
          <div className="text-sm font-medium text-red-100">{item.name}</div>
          <div className="mt-1 text-xs text-red-200/80">
            Quantité actuelle : {item.quantity} • Minimum : {item.minQuantity}
          </div>
        </div>
      ))}
    </div>
  );
}