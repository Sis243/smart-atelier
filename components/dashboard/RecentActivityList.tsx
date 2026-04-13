type ActivityItem = {
  id: string;
  action: string;
  entity?: string | null;
  createdAt: string;
};

type Props = {
  items: ActivityItem[];
};

export default function RecentActivityList({ items }: Props) {
  if (!items.length) {
    return <div className="text-sm text-zinc-400">Aucune activité récente.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-sm font-medium text-white">{item.action}</div>
          <div className="mt-1 text-xs text-zinc-400">
            {item.entity ?? "Système"} • {new Date(item.createdAt).toLocaleString("fr-FR")}
          </div>
        </div>
      ))}
    </div>
  );
}