type Props = {
  alerts: string[];
};

export default function AlertList({ alerts }: Props) {
  if (!alerts.length) {
    return (
      <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
        Aucune alerte critique pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div
          key={`${alert}-${index}`}
          className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-200 ring-1 ring-red-400/20"
        >
          ⚠️ {alert}
        </div>
      ))}
    </div>
  );
}