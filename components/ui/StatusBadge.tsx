type Props = {
  status: string;
};

export default function StatusBadge({ status }: Props) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1";

  const normalized = String(status ?? "").trim().toUpperCase();

  if (normalized === "EN_ATTENTE") {
    return (
      <span className={`${base} bg-yellow-500/15 text-yellow-200 ring-yellow-400/20`}>
        {status}
      </span>
    );
  }

  if (
    normalized === "EN_COURS" ||
    normalized === "SENT" ||
    normalized === "DELIVERED"
  ) {
    return (
      <span className={`${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`}>
        {status}
      </span>
    );
  }

  if (
    normalized === "TERMINE" ||
    normalized === "PAID" ||
    normalized === "ISSUED" ||
    normalized === "APPROUVE" ||
    normalized === "READ" ||
    normalized === "ONLINE"
  ) {
    return (
      <span className={`${base} bg-green-500/15 text-green-200 ring-green-400/20`}>
        {status}
      </span>
    );
  }

  if (
    normalized === "REJETE" ||
    normalized === "ANNULE" ||
    normalized === "CANCELED" ||
    normalized === "BLOQUE" ||
    normalized === "ABSENT" ||
    normalized === "OFFLINE"
  ) {
    return (
      <span className={`${base} bg-red-500/15 text-red-200 ring-red-400/20`}>
        {status}
      </span>
    );
  }

  return (
    <span className={`${base} bg-white/10 text-zinc-200 ring-white/10`}>
      {status}
    </span>
  );
}