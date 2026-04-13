"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MetaItem = {
  id: string;
  name: string;
};

async function uploadPhoto(employeeId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/hr/employees/${employeeId}/photo`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Upload photo impossible");
  }

  return data;
}

async function uploadDocuments(employeeId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`/api/hr/employees/${employeeId}/documents`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Upload documents impossible");
  }

  return data;
}

export default function NewEmployeePage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<MetaItem[]>([]);
  const [positions, setPositions] = useState<MetaItem[]>([]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [baseSalary, setBaseSalary] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMeta() {
      try {
        const res = await fetch("/api/hr/meta", { cache: "no-store", credentials: "include" });
        const data = await res.json();

        if (!mounted || !data?.ok) return;

        setDepartments(data.departments || []);
        setPositions(data.positions || []);

        if (data.departments?.length) setDepartmentId(data.departments[0].id);
        if (data.positions?.length) setPositionId(data.positions[0].id);
      } catch {}
    }

    loadMeta();

    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return !!fullName.trim() && !loading;
  }, [fullName, loading]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          hireDate: hireDate || null,
          status,
          baseSalary: Number(baseSalary || 0),
          currency,
          departmentId: departmentId || null,
          positionId: positionId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Création échouée");
      }

      const employeeId = data.id as string;

      if (photoFile) {
        await uploadPhoto(employeeId, photoFile);
      }

      if (documentFiles.length > 0) {
        await uploadDocuments(employeeId, documentFiles);
      }

      setMsg("Employé créé avec succès.");
      router.push(`/dashboard/hr/employees/${employeeId}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold">Nouvel employé</h1>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
        >
          {err && (
            <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
              {err}
            </div>
          )}

          {msg && (
            <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
              {msg}
            </div>
          )}

          <div>
            <label className="text-sm">Nom complet</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Téléphone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>

            <div>
              <label className="text-sm">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm">Adresse</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm">Date d’embauche</label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>

            <div>
              <label className="text-sm">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div>
              <label className="text-sm">Salaire de base</label>
              <input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>

            <div>
              <label className="text-sm">Devise</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              >
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Département</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              >
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm">Poste</label>
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              >
                <option value="">—</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <label className="text-sm">Photo de profil</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="mt-3 block w-full text-sm text-zinc-300"
              />
              <p className="mt-2 text-xs text-zinc-400">
                Facultatif. JPG, PNG ou WEBP.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <label className="text-sm">Documents</label>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
                onChange={(e) => setDocumentFiles(Array.from(e.target.files ?? []))}
                className="mt-3 block w-full text-sm text-zinc-300"
              />
              <p className="mt-2 text-xs text-zinc-400">
                Facultatif. Tu peux mettre 2 ou 3 documents.
              </p>

              {documentFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {documentFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-300 ring-1 ring-white/10"
                    >
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            disabled={!canSubmit}
            className="w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer l’employé"}
          </button>
        </form>
      </div>
    </main>
  );
}
