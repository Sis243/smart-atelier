import Link from "next/link";
import { prisma } from "@/lib/db";

function typeBadge(t: string) {
  const base = "px-2 py-1 text-[11px] rounded-full ring-1";
  if (t === "VIP") return `${base} bg-amber-500/15 text-amber-200 ring-amber-400/20`;
  return `${base} bg-white/10 text-zinc-100 ring-white/10`;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q ?? "").trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { fullName: "asc" },
    take: 200,
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Ajout, recherche, profil client et historique des commandes.
            </p>
          </div>

          <Link
            href="/dashboard/customers/nouveau"
            className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            + Nouveau client
          </Link>
        </div>

        {/* Recherche */}
        <form className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher: nom, téléphone, email…"
              className="flex-1 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
            <button className="rounded-xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/10 hover:bg-white/15">
              Rechercher
            </button>
            {q && (
              <Link
                href="/dashboard/customers"
                className="rounded-xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 hover:bg-white/10 text-center"
              >
                Réinitialiser
              </Link>
            )}
          </div>
        </form>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Adresse</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="font-semibold text-amber-200 hover:underline"
                    >
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={typeBadge(c.type)}>{c.type}</span>
                  </td>
                  <td className="px-4 py-3">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300/80">{c.address ?? "—"}</td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-zinc-300/80" colSpan={5}>
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-zinc-300/70">
          Astuce : tu peux taper juste une partie du nom ou du téléphone.
        </p>
      </div>
    </main>
  );
}
