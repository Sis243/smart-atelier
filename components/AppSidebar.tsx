import { getAuthUser } from "@/lib/auth-helpers";
import GuardedNavLink from "@/components/GuardedNavLink";
import MwindaLogo from "@/components/MwindaLogo";

export default async function AppSidebar() {
  const auth = await getAuthUser();
  const role = auth.role || "";

  return (
    <aside className="hidden border-r border-white/10 bg-white/[0.03] md:flex md:w-72 md:flex-col md:gap-4 md:p-5">
      <div className="flex items-center gap-3">
        <MwindaLogo size={44} />
        <div>
          <div className="text-xs text-white/60">Mwinda Industrie</div>
          <div className="text-lg font-semibold tracking-tight text-white">
            Smart Atelier
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <div className="text-xs text-white/50">Utilisateur</div>
        <div className="mt-1 text-sm font-medium text-white">{auth.name || "Utilisateur"}</div>
        <div className="text-xs text-zinc-400">{role || "—"}</div>
      </div>

      <nav className="mt-2 space-y-1 text-sm">
        <GuardedNavLink role={role} moduleKey="dashboard" href="/dashboard" label="Dashboard" />
        <GuardedNavLink role={role} moduleKey="users" href="/dashboard/users" label="Utilisateurs" />
        <GuardedNavLink role={role} moduleKey="customers" href="/dashboard/customers" label="Clients" />
        <GuardedNavLink role={role} moduleKey="orders" href="/dashboard/orders" label="Commandes" />
        <GuardedNavLink role={role} moduleKey="cut" href="/dashboard/cut" label="Coupe" />
        <GuardedNavLink role={role} moduleKey="production" href="/dashboard/production" label="Production" />
        <GuardedNavLink role={role} moduleKey="quality" href="/dashboard/quality" label="Qualité" />
        <GuardedNavLink role={role} moduleKey="delivery" href="/dashboard/delivery" label="Livraison" />
        <GuardedNavLink role={role} moduleKey="stock" href="/dashboard/stock" label="Stock" />
        <GuardedNavLink role={role} moduleKey="hr" href="/dashboard/hr" label="RH" />
        <GuardedNavLink role={role} moduleKey="accounting" href="/dashboard/accounting" label="Comptabilité" />
        <GuardedNavLink role={role} moduleKey="chat" href="/dashboard/chat" label="Messagerie" />
        <GuardedNavLink role={role} moduleKey="activity" href="/dashboard/activity" label="Journal" />
      </nav>

      <div className="mt-auto rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
        <div className="text-xs text-white/60">Statut système</div>
        <div className="mt-1 text-sm font-semibold text-white">
          Permissions actives ✅
        </div>
        <div className="mt-2 text-xs text-white/60">
          Accès selon rôle utilisateur
        </div>
      </div>
    </aside>
  );
}
