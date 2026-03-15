"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Customer = {
  id: string;
  fullName: string;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
};

export default function EditCustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") || "").trim(),
      type: String(form.get("type") || "STANDARD"),
      phone: String(form.get("phone") || "").trim(),
      email: String(form.get("email") || "").trim(),
      address: String(form.get("address") || "").trim(),
      note: String(form.get("note") || "").trim(),
    };

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Modification échouée");

      router.push(`/dashboard/customers/${customer.id}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    const ok = confirm("Supprimer ce client ? (possible seulement s'il n'a pas de commandes)");
    if (!ok) return;

    setErr(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Suppression échouée");

      router.push("/dashboard/customers");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Modifier client</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Met à jour les informations du client.
            </p>
          </div>

          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-xl bg-red-500/15 px-4 py-2 text-sm ring-1 ring-red-400/20 hover:bg-red-500/20 disabled:opacity-60"
            title="Supprimer (si aucune commande)"
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          {err && (
            <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
              {err}
            </div>
          )}

          <div>
            <label className="text-sm">Nom complet *</label>
            <input
              name="fullName"
              defaultValue={customer.fullName}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Type</label>
              <select
                name="type"
                defaultValue={customer.type}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              >
                <option value="STANDARD">STANDARD</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            <div>
              <label className="text-sm">Téléphone</label>
              <input
                name="phone"
                defaultValue={customer.phone ?? ""}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Email</label>
              <input
                name="email"
                defaultValue={customer.email ?? ""}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>

            <div>
              <label className="text-sm">Adresse</label>
              <input
                name="address"
                defaultValue={customer.address ?? ""}
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm">Note</label>
            <textarea
              name="note"
              rows={3}
              defaultValue={customer.note ?? ""}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>

          <p className="text-xs text-zinc-300/70">
            La suppression est bloquée si le client a déjà des commandes (sécurité).
          </p>
        </form>
      </div>
    </main>
  );
}
