import { prisma } from "@/lib/prisma";
import Image from "next/image";

export default async function EmployeePrintPage({
  params,
}: {
  params: { id: string };
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      department: true,
      position: true,
    },
  });

  if (!employee) {
    return <main className="p-8">Employé introuvable.</main>;
  }

  return (
    <main className="min-h-screen bg-white p-8 text-black">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fiche Employé</h1>
            <p className="mt-2 text-sm text-zinc-600">Profil RH imprimable</p>
          </div>

          <button
            onClick={() => window.print()}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Imprimer / PDF
          </button>
        </div>

        <div className="mt-8 flex items-start gap-6">
          {employee.photoUrl ? (
            <Image
              src={employee.photoUrl}
              alt={employee.fullName}
              width={112}
              height={112}
              unoptimized
              className="h-28 w-28 rounded-xl border object-cover"
            />
          ) : (
            <div className="h-28 w-28 rounded-xl border bg-zinc-100" />
          )}

          <div>
            <h2 className="text-2xl font-semibold">{employee.fullName}</h2>
            <div className="mt-2 space-y-1 text-sm">
              <div>Poste : <b>{employee.position?.name ?? "—"}</b></div>
              <div>Département : <b>{employee.department?.name ?? "—"}</b></div>
              <div>Téléphone : <b>{employee.phone ?? "—"}</b></div>
              <div>Email : <b>{employee.email ?? "—"}</b></div>
              <div>Adresse : <b>{employee.address ?? "—"}</b></div>
              <div>Statut : <b>{employee.status}</b></div>
              <div>Salaire de base : <b>{employee.currency} {employee.baseSalary}</b></div>
              <div>Date d’embauche : <b>{employee.hireDate ? new Date(employee.hireDate).toLocaleDateString("fr-FR") : "—"}</b></div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-zinc-500">
          Fiche générée depuis Smart Atelier.
        </div>
      </div>
    </main>
  );
}
