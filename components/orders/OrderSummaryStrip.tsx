type Props = {
  code: string;
  status: string;
  customer: string;
  createdAt: string;
  itemType?: string | null;
  category?: string | null;
  isLot?: boolean;
  lotQuantity?: number;
};

export default function OrderSummaryStrip({
  code,
  status,
  customer,
  createdAt,
  itemType,
  category,
  isLot,
  lotQuantity,
}: Props) {
  const items = [
    { label: "Commande", value: code },
    { label: "Statut", value: status },
    { label: "Client", value: customer },
    { label: "Créée", value: createdAt },
    { label: "Type", value: itemType || "—" },
    { label: "Catégorie", value: category || "—" },
    { label: "Lot", value: isLot ? `Oui (${lotQuantity ?? 1})` : "Non" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-xs text-zinc-400">{item.label}</div>
          <div className="mt-1 text-sm font-semibold text-white">{item.value}</div>
        </div>
      ))}
    </div>
  );
}