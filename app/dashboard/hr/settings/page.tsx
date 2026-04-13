"use client";

import { useEffect, useState } from "react";

type DepartmentItem = {
  id: string;
  name: string;
  _count?: { employees: number };
};

type PositionItem = {
  id: string;
  name: string;
  _count?: { employees: number };
};

export default function HrSettingsPage() {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [positionName, setPositionName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadAll() {
    const [depRes, posRes] = await Promise.all([
      fetch("/api/hr/departments", { cache: "no-store" }),
      fetch("/api/hr/positions", { cache: "no-store" }),
    ]);

    const depData = await depRes.json().catch(() => ({}));
    const posData = await posRes.json().catch(() => ({}));

    if (depData?.ok) setDepartments(depData.departments || []);
    if (posData?.ok) setPositions(posData.positions || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createDepartment(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/hr/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: departmentName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Création impossible");
      }

      setDepartmentName("");
      setMsg("Département créé.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  async function createPosition(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/hr/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: positionName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Création impossible");
      }

      setPositionName("");
      setMsg("Poste créé.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  async function deleteDepartment(id: string) {
    setErr(null);
    setMsg(null);
    setBusyId(id);

    try {
      const res = await fetch(`/api/hr/departments/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Suppression impossible");
      }

      setMsg("Département supprimé.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setBusyId(null);
    }
  }

  async function deletePosition(id: string) {
    setErr(null);
    setMsg(null);
    setBusyId(id);

    try {
      const res = await fetch(`/api/hr/positions/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Suppression impossible");
      }

      setMsg("Poste supprimé.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">Paramètres RH</h1>
        <p className="mt-1 text-sm text-zinc-300/80">
          Départements et postes.
        </p>

        {err && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
            {err}
          </div>
        )}

        {msg && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
            {msg}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Départements</h2>

            <form onSubmit={createDepartment} className="mt-4 flex gap-2">
              <input
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Nouveau département"
                className="flex-1 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
              <button className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
                Ajouter
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                >
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-zinc-400">
                      Employés : {d._count?.employees ?? 0}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busyId === d.id || (d._count?.employees ?? 0) > 0}
                    onClick={() => deleteDepartment(d.id)}
                    className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-400/20 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              ))}

              {departments.length === 0 && (
                <div className="text-sm text-zinc-400">Aucun département.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Postes</h2>

            <form onSubmit={createPosition} className="mt-4 flex gap-2">
              <input
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                placeholder="Nouveau poste"
                className="flex-1 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
              <button className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
                Ajouter
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {positions.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-zinc-400">
                      Employés : {p._count?.employees ?? 0}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busyId === p.id || (p._count?.employees ?? 0) > 0}
                    onClick={() => deletePosition(p.id)}
                    className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-400/20 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              ))}

              {positions.length === 0 && (
                <div className="text-sm text-zinc-400">Aucun poste.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}