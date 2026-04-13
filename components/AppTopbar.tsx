import NotificationBell from "@/components/notifications/NotificationBell";
import MwindaLogo from "@/components/MwindaLogo";

type Props = {
  title?: string;
  subtitle?: string;
};

export default function AppTopbar({
  title = "Dashboard",
  subtitle = "Pilotage temps réel",
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <div>
          <div className="text-xs text-white/60">Mwinda Industrie</div>
          <div className="text-lg font-semibold tracking-tight text-white">{title}</div>
          <div className="text-xs text-zinc-400">{subtitle}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10 sm:block">
            Smart Atelier • Premium
          </div>
          <NotificationBell />
          <MwindaLogo size={36} rounded="rounded-full" />
        </div>
      </div>
    </header>
  );
}
