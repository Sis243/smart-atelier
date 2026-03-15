import "@/app/globals.css";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:gap-4 md:border-r md:border-white/10 md:bg-white/[0.03] md:p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15" />
            <div>
              <div className="text-xs text-white/60">Mwinda Industrie</div>
              <div className="text-lg font-semibold tracking-tight">
                Smart Atelier
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-1 text-sm">
            {[
              ["Dashboard", "/dashboard"],
              ["Utilisateurs", "/dashboard/users"],
              ["Clients", "/dashboard/customers"],
              ["Commandes", "/dashboard/orders"],
              ["Coupe", "/dashboard/cut"],
              ["Production", "/dashboard/production"],
              ["Qualité", "/dashboard/quality"],
              ["Livraison", "/dashboard/delivery"],
              ["Stock", "/dashboard/stock"],
              ["Journal", "/dashboard/activity"],
              ["RH", "/dashboard/hr"],
              ["Comptabilité", "/dashboard/accounting"],
              ["Messagerie", "/dashboard/chat"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <span>{label}</span>
                <span className="text-[10px] text-white/35">→</span>
              </a>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
            <div className="text-xs text-white/60">Status</div>
            <div className="mt-1 text-sm font-semibold">
              Système opérationnel ✅
            </div>
            <div className="mt-2 text-xs text-white/60">
              Accès par permissions • Logs actifs
            </div>

            {/* ✅ Bouton Déconnexion */}
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
              <div>
                <div className="text-xs text-white/60">Mwinda Industrie</div>
                <div className="text-lg font-semibold tracking-tight">
                  Dashboard
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
                  Temps réel • Atelier
                </div>
                <div className="h-9 w-9 rounded-full bg-white/10 ring-1 ring-white/15" />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
