type TimelineItem = {
  label: string;
  value?: string | null;
  status?: "done" | "pending" | "warning";
  note?: string | null;
};

type Props = {
  items: TimelineItem[];
};

export default function OrderTimeline({ items }: Props) {
  function dotClass(status?: "done" | "pending" | "warning") {
    if (status === "done") return "bg-green-500";
    if (status === "warning") return "bg-yellow-500";
    return "bg-zinc-500";
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`h-3.5 w-3.5 rounded-full ${dotClass(item.status)}`} />
            {index < items.length - 1 ? (
              <div className="mt-1 h-full w-px bg-white/10" />
            ) : null}
          </div>

          <div className="pb-4">
            <div className="text-sm font-medium text-white">{item.label}</div>
            <div className="mt-1 text-sm text-zinc-300">{item.value || "—"}</div>
            {item.note ? <div className="mt-1 text-xs text-zinc-400">{item.note}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}