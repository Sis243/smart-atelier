type Props = {
  label: string;
  value: string | number;
  helper?: string;
  danger?: boolean;
};

export default function StatCard({ label, value, helper, danger = false }: Props) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-100">{label}</p>
          {helper ? <p className="mt-1 text-xs text-zinc-300/80">{helper}</p> : null}
        </div>

        <span
          className={[
            "rounded-full px-2.5 py-1 text-[11px] ring-1",
            danger
              ? "bg-red-500/15 text-red-200 ring-red-400/20"
              : "bg-white/10 text-zinc-200 ring-white/10",
          ].join(" ")}
        >
          KPI
        </span>
      </div>

      <div className="mt-5">
        <p className={["text-3xl font-semibold", danger ? "text-red-200" : "text-white"].join(" ")}>
          {value}
        </p>
      </div>
    </div>
  );
}