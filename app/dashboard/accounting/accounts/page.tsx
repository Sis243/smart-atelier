import Link from "next/link";
import ModuleGuard from "@/components/ModuleGuard";

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
};

async function getAccounts(): Promise<Account[]> {
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/accounting/accounts`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data?.accounts) ? data.accounts : [];
  } catch {
    return [];
  }
}

export default async function AccountingAccountsPage() {
  const accounts = await getAccounts();

  return (
    <ModuleGuard moduleKey="accounting">
      <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
                Smart Atelier
              </p>
              <h1 className="text-3xl font-extrabold">Plan comptable</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Liste des comptes comptables enregistrés dans le système.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard/accounting"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Retour comptabilité
              </Link>
            </div>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-neutral-400">
                Aucun compte comptable disponible.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-neutral-400">
                      <th className="px-3 py-3">Code</th>
                      <th className="px-3 py-3">Nom</th>
                      <th className="px-3 py-3">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-b border-white/5">
                        <td className="px-3 py-3 font-medium text-cyan-200">
                          {account.code}
                        </td>
                        <td className="px-3 py-3 text-white">{account.name}</td>
                        <td className="px-3 py-3 text-neutral-300">
                          {account.type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </ModuleGuard>
  );
}