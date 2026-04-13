import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

type EmployeeCard = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  status: string;
  photoUrl: string | null;
  documentUrl: string | null;
  department?: { name: string } | null;
  position?: { name: string } | null;
  documentsCount?: number;
};

export default async function EmployeesPage() {
  const prismaAny = prisma as any;

  let employees: EmployeeCard[] = [];

  try {
    const rows = await prismaAny.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        position: true,
      },
    });

    employees = rows.map((e: any) => ({
      id: e.id,
      fullName: e.fullName ?? "—",
      phone: e.phone ?? null,
      email: e.email ?? null,
      status: e.status ?? "ACTIVE",
      photoUrl: e.photoUrl ?? null,
      documentUrl: e.documentUrl ?? null,
      department: e.department ?? null,
      position: e.position ?? null,
      documentsCount: e.documentUrl ? 1 : 0,
    }));
  } catch {
    const rows = await prismaAny.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        position: true,
      },
    });

    employees = rows.map((e: any) => ({
      id: e.id,
      fullName: e.fullName ?? "—",
      phone: e.phone ?? null,
      email: e.email ?? null,
      status: e.status ?? "ACTIVE",
      photoUrl: e.photoUrl ?? null,
      documentUrl: e.documentUrl ?? null,
      department: e.department ?? null,
      position: e.position ?? null,
      documentsCount: e.documentUrl ? 1 : 0,
    }));
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Employés</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Répertoire complet des personnels.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/hr/settings"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            >
              Paramètres RH
            </Link>
            <Link
              href="/dashboard/hr/reports"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            >
              Rapports RH
            </Link>
            <Link
              href="/dashboard/hr/employees/new"
              className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
            >
              + Ajouter un employé
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((e) => {
            const avatar = e.photoUrl || null;

            return (
              <div
                key={e.id}
                className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10"
              >
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={e.fullName}
                      width={56}
                      height={56}
                      unoptimized
                      className="h-14 w-14 rounded-full object-cover ring-1 ring-white/15"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-zinc-300 ring-1 ring-white/15">
                      {e.fullName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((x) => x[0]?.toUpperCase())
                        .join("") || "—"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="truncate font-semibold">{e.fullName}</div>
                    <div className="text-sm text-zinc-400">
                      {e.position?.name ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm text-zinc-300">
                  <div>Département : {e.department?.name ?? "—"}</div>
                  <div>Téléphone : {e.phone ?? "—"}</div>
                  <div>Email : {e.email ?? "—"}</div>
                  <div>Statut : {e.status}</div>
                  <div>Documents : {e.documentsCount ?? 0}</div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    href={`/dashboard/hr/employees/${e.id}`}
                    className="text-sm text-amber-300 hover:underline"
                  >
                    Ouvrir le profil →
                  </Link>

                  <Link
                    href={`/dashboard/hr/employees/${e.id}/edit`}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/15"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            );
          })}

          {employees.length === 0 && (
            <div className="text-sm text-zinc-400">Aucun employé.</div>
          )}
        </div>
      </div>
    </main>
  );
}
