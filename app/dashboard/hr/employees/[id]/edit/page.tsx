"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MetaItem = {
  id: string;
  name: string;
};

type EmployeeDoc = {
  id: string;
  name: string;
  url: string;
  mimeType?: string | null;
  size?: number | null;
};

type EmployeePayload = {
  employee: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    hireDate: string | null;
    status: string;
    baseSalary?: number | null;
    salary?: number | null;
    currency: string | null;
    departmentId: string | null;
    positionId: string | null;
    photoUrl: string | null;
    documentUrl: string | null;
  };
};

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;

  const [departments, setDepartments] = useState<MetaItem[]>([]);
  const [positions, setPositions] = useState<MetaItem[]>([]);
  const [documents, setDocuments] = useState<EmployeeDoc[]>([]);

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [busyDelete, setBusyDelete] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [metaRes, empRes, docsRes] = await Promise.all([
      fetch("/api/hr/meta", { cache: "no-store", credentials: "include" }),
      fetch(`/api/hr/employees/${id}`, { cache: "no-store", credentials: "include" }),
      fetch(`/api/hr/employees/${id}/documents`, { cache: "no-store", credentials: "include" }),
    ]);

    const metaData = await metaRes.json().catch(() => ({}));
    const empData = (await empRes.json().catch(() => ({}))) as EmployeePayload & { ok?: boolean };
    const docsData = await docsRes.json().catch(() => ({}));

    if (metaData?.ok) {
      setDepartments(metaData.departments || []);
      setPositions(metaData.positions || []);
    }

    if (empData?.ok && empData.employee) {
      const e = empData.employee;
      setFullName(e.fullName || "");
      setPhone(e.phone || "");
      setEmail(e.email || "");
      setAddress(e.address || "");
      setHireDate(e.hireDate ? new Date(e.hireDate).toISOString().slice(0, 10) : "");
      setStatus(e.status || "ACTIVE");
      setBaseSalary(String(e.baseSalary ?? e.salary ?? 0));
      setCurrency(e.currency || "USD");
      setDepartmentId(e.departmentId || "");
      setPositionId(e.positionId || "");
      setPhotoUrl(e.photoUrl || null);
      setPhotoPreviewUrl(e.photoUrl || null);
    }

    if (docsData?.ok) {
      setDocuments(docsData.documents || []);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          address,
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
        throw new Error(data?.error || "Mise à jour impossible");
      }

      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);

        const photoRes = await fetch(`/api/hr/employees/${id}/photo`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });

        const photoData = await photoRes.json().catch(() => ({}));
        if (!photoRes.ok || !photoData?.ok) {
          throw new Error(photoData?.error || "Upload photo impossible");
        }

        setPhotoUrl(photoData.photoUrl || null);
        setPhotoPreviewUrl(photoData.photoUrl || null);
      }

      if (documentFiles.length > 0) {
        const fd = new FormData();
        documentFiles.forEach((file) => fd.append("files", file));

        const docRes = await fetch(`/api/hr/employees/${id}/documents`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });

        const docData = await docRes.json().catch(() => ({}));
        if (!docRes.ok || !docData?.ok) {
          throw new Error(docData?.error || "Upload documents impossible");
        }
      }

      setMsg("Employé mis à jour.");
      setPhotoFile(null);
      setDocumentFiles([]);
      await loadAll();
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function deleteDocument(docId: string) {
    setBusyDelete(docId);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/hr/employees/${id}/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Suppression impossible");
      }

      setMsg("Document supprimé.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setBusyDelete(null);
    }
  }

  function onPhotoChange(file: File | null) {
    setPhotoFile(file);

    if (!file) {
      setPhotoPreviewUrl(photoUrl);
      return;
    }

    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold">Modifier l’employé</h1>

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

        <form
          onSubmit={save}
          className="mt-6 space-y-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
        >
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
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone"
              className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </div>

          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse"
            className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
            <input
              type="number"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              placeholder="Salaire"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="">— Département —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="">— Poste —</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <div className="text-sm">Photo de profil</div>
              <div className="mt-3 flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15">
                  {photoPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreviewUrl}
                      alt={fullName || "Photo employé"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                      N/A
                    </div>
                  )}
                </div>
                <div className="text-xs text-zinc-400">
                  JPG, PNG ou WEBP. Maximum 5 MB.
                </div>
              </div>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/*"
                onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
                className="mt-3 block w-full text-sm text-zinc-300"
              />
            </div>

            <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <div className="text-sm">Ajouter des documents</div>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
                onChange={(e) => setDocumentFiles(Array.from(e.target.files ?? []))}
                className="mt-3 block w-full text-sm text-zinc-300"
              />
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
            <div className="text-sm font-medium">Documents enregistrés</div>
            <div className="mt-3 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{doc.name}</div>
                    <div className="text-xs text-zinc-400">
                      {doc.mimeType ?? "Fichier"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={doc.url}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/15"
                    >
                      Ouvrir
                    </a>
                    <button
                      type="button"
                      disabled={busyDelete === doc.id}
                      onClick={() => deleteDocument(doc.id)}
                      className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-400/20 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-sm text-zinc-400">Aucun document.</div>
              )}
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </main>
  );
}
