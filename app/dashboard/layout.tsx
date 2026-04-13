import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import MwindaLogo from "@/components/MwindaLogo";
import { canAccessModuleWithPermissions, type ModuleKey } from "@/lib/access";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

type NavItem = {
  label: string;
  href: string;
  moduleKey: ModuleKey;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", moduleKey: "dashboard" },
  { label: "Utilisateurs", href: "/dashboard/users", moduleKey: "users" },
  { label: "Clients", href: "/dashboard/customers", moduleKey: "customers" },
  { label: "Commandes", href: "/dashboard/orders", moduleKey: "orders" },
  { label: "Coupe", href: "/dashboard/cut", moduleKey: "cut" },
  { label: "Production", href: "/dashboard/production", moduleKey: "production" },
  { label: "Qualite", href: "/dashboard/quality", moduleKey: "quality" },
  { label: "Livraison", href: "/dashboard/delivery", moduleKey: "delivery" },
  { label: "Stock", href: "/dashboard/stock", moduleKey: "stock" },
  { label: "Journal", href: "/dashboard/activity", moduleKey: "activity" },
  { label: "RH", href: "/dashboard/hr", moduleKey: "hr" },
  { label: "Comptabilite", href: "/dashboard/accounting", moduleKey: "accounting" },
  { label: "Messagerie", href: "/dashboard/chat", moduleKey: "chat" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthUser();
  const userPermissions = auth.userId
    ? await prisma.userPermission.findMany({
        where: { userId: auth.userId },
        select: { permission: { select: { key: true } } },
      })
    : [];

  const permissionKeys = userPermissions.map((row) => row.permission.key);
  const visibleItems = navItems.filter((item) =>
    canAccessModuleWithPermissions(auth.role, permissionKeys, item.moduleKey)
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="flex">
        <aside className="hidden md:flex md:w-72 md:flex-col md:gap-4 md:border-r md:border-white/10 md:bg-white/[0.03] md:p-5">
          <div className="flex items-center gap-3">
            <MwindaLogo size={42} rounded="rounded-xl" />
            <div>
              <div className="text-xs text-white/60">Mwinda Industrie</div>
              <div className="text-lg font-semibold tracking-tight">Smart Atelier</div>
            </div>
          </div>

          <nav className="mt-5 space-y-1 text-sm">
            {visibleItems.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                target="_self"
                className="flex items-center justify-between rounded-xl px-3 py-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <span>{label}</span>
                <span className="text-[10px] text-white/35">-&gt;</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
            <div className="text-xs text-white/60">Status</div>
            <div className="mt-1 text-sm font-semibold">Systeme operationnel OK</div>
            <div className="mt-2 text-xs text-white/60">
              Acces par permissions - Logs actifs
            </div>

            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <MwindaLogo size={36} rounded="rounded-full" />
                <div>
                  <div className="text-xs text-white/60">Mwinda Industrie</div>
                  <div className="text-lg font-semibold tracking-tight">Dashboard</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10 sm:block">
                  Temps reel - Atelier
                </div>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
