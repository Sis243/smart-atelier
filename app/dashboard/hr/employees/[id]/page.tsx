import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

type Props = {
  params: {
    id: string;
  };
};

export default async function EmployeeProfilePage({ params }: Props) {
  const prismaAny = prisma as any;
  const id = params.id;

  const employee = await prismaAny.employee.findUnique({
    where: { id },
    include: {
      department: true,
      position: true,
      attendances: {
        orderBy: { date: "desc" },
        take: 10,
      },
      leaves: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      payslips: {
        orderBy: { generatedAt: "desc" },
        take: 10,
      },
      productionAssignments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      cutAssignments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!employee) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="mx-auto max-w-5xl text-zinc-400">Employé introuvable.</div>
      </main>
    );
  }

  const documents = employee.documentUrl
    ? [
        {
          id: "legacy",
          name: "Document",
          url: employee.documentUrl,
          mimeType: null,
          size: null,
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                alt={employee.fullName}
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-full object-cover ring-1 ring-white/15"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-zinc-300 ring-1 ring-white/15">
                {employee.fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((x: string) => x[0]?.toUpperCase())
                  .join("") || "—"}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold">{employee.fullName}</h1>
              <p className="mt-1 text-sm text-zinc-300/80">
                {employee.position?.name ?? "—"} • {employee.department?.name ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/dashboard/hr/employees/${employee.id}/edit`}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            >
              Modifier
            </Link>
            <Link
              href={`/dashboard/hr/employees/${employee.id}/print`}
              className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
            >
              Imprimer
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 lg:col-span-1">
            <h2 className="text-lg font-semibold">Informations</h2>
            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              <div>Téléphone : {employee.phone ?? "—"}</div>
              <div>Email : {employee.email ?? "—"}</div>
              <div>Adresse : {employee.address ?? "—"}</div>
              <div>Statut : {employee.status ?? "—"}</div>
              <div>
                Embauche :{" "}
                {employee.hireDate
                  ? new Date(employee.hireDate).toLocaleDateString("fr-FR")
                  : "—"}
              </div>
              <div>Salaire : {employee.baseSalary ?? employee.salary ?? 0}</div>
              <div>Devise : {employee.currency ?? "USD"}</div>
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Documents</h2>
              <Link
                href={`/dashboard/hr/employees/${employee.id}/edit`}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/15"
              >
                Gérer
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {doc.name ?? "Document"}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {doc.mimeType ?? "Fichier"} {doc.size ? `• ${doc.size} octets` : ""}
                    </div>
                  </div>

                  <a
                    href={doc.url}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/15"
                  >
                    Ouvrir
                  </a>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-sm text-zinc-400">Aucun document.</div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Présences récentes</h2>
            <div className="mt-4 space-y-2">
              {employee.attendances?.length ? (
                employee.attendances.map((row: any) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                  >
                    <div className="text-sm">
                      {new Date(row.date).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="text-sm text-zinc-300">{row.status}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-400">Aucune présence récente.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Congés récents</h2>
            <div className="mt-4 space-y-2">
              {employee.leaves?.length ? (
                employee.leaves.map((row: any) => (
                  <div
                    key={row.id}
                    className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm">
                        {new Date(row.startDate).toLocaleDateString("fr-FR")} →{" "}
                        {new Date(row.endDate).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="text-sm text-zinc-300">{row.status}</div>
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {row.reason ?? "—"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-400">Aucun congé récent.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
