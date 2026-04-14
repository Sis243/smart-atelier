import { prisma } from "@/lib/prisma";
import {
  DataTable,
  EmptyState,
  PageHeader,
  SectionCard,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Répertoire clients Smart Atelier"
        actions={[
          { label: "Nouveau client", href: "/dashboard/customers/nouveau", variant: "primary" },
        ]}
      />

      <SectionCard>
        <DataTable
          headers={["Nom", "Type", "Téléphone", "Email", "Adresse"]}
          empty={
            <EmptyState
              title="Aucun client"
              description="Commence par enregistrer un premier client."
            />
          }
          colSpan={5}
        >
          {customers.length > 0
            ? customers.map((c) => (
                <tr key={c.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{c.fullName}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.type}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.address ?? "—"}</td>
                </tr>
              ))
            : null}
        </DataTable>
      </SectionCard>
    </main>
  );
}
