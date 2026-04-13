import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

type Props = {
  title?: string;
  subtitle?: string;
  user?: {
    name?: string | null;
    role?: string | null;
  };
};

function roleLabel(role?: string | null) {
  if (!role) return "Utilisateur";
  const r = role.toUpperCase();
  if (r === "SUPERADMIN") return "Super Admin";
  if (r === "ADMIN") return "Admin";
  if (r === "MANAGER") return "Manager";
  if (r === "COUPE") return "Coupe";
  if (r === "PRODUCTION") return "Production";
  if (r === "QUALITE") return "Qualité";
  if (r === "LOGISTIQUE") return "Logistique";
  if (r === "CAISSIER") return "Caissier";
  if (r === "RH") return "RH";
  if (r === "COMPTABLE") return "Comptable";
  return role;
}

export default function TopBar({
  title = "Tableau de bord",
  subtitle = "Pilotage temps réel • Smart Atelier",
  user,
}: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/65 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left: Brand + Title */}
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/12">
              <Image
                src="/mwinda.jpg"
                alt="Mwinda Industrie"
                fill
                className="object-contain p-2"
                priority
                sizes="44px"
              />
            </div>

            <div className="leading-tight">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-zinc-300/70">
                  Mwinda Industrie
                </span>
                <span className="text-[11px] text-zinc-300/50">•</span>
                <span className="text-xs uppercase tracking-widest text-zinc-300/70">
                  Smart Atelier
                </span>

                {/* status */}
                <span className="ml-1 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200 ring-1 ring-emerald-400/15">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
                  En ligne
                </span>
              </div>

              <h1 className="mt-1 text-lg font-semibold tracking-tight text-zinc-50 md:text-xl">
                {title}
              </h1>
              <p className="mt-0.5 text-xs text-zinc-300/75 md:text-sm">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Actions + User chip + Logout */}
          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
            <nav className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/orders/nouvelle"
                target="_self"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
              >
                + Nouvelle commande
              </Link>

              <Link
                href="/dashboard/orders"
                target="_self"
                className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
              >
                Commandes
              </Link>
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-2xl bg-white/8 px-3 py-2 ring-1 ring-white/10">
                <div className="text-[11px] text-zinc-300/70">Connecté</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-50">
                    {user?.name || "SUPERADMIN"}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-200 ring-1 ring-white/10">
                    {roleLabel(user?.role)}
                  </span>
                </div>
              </div>

              <LogoutButton />
            </div>

            {/* Mobile: keep logout visible */}
            <div className="flex md:hidden">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
