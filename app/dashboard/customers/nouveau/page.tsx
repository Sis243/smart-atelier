"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Création échouée");

      router.push(`/dashboard/customers/${data.id}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Nouveau client</h1>
        <p className="mt-1 text-sm text-zinc-300/80">
          Enregistrer un client (VIP ou Standard) pour pouvoir créer des commandes.
        </p>

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
              placeholder="Ex : Jean Mukendi"
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Type</label>
              <select
                name="type"
                defaultValue="STANDARD"
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
                placeholder="Ex : +243 ..."
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Email</label>
              <input
                name="email"
                placeholder="Ex : client@email.com"
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>

            <div>
              <label className="text-sm">Adresse</label>
              <input
                name="address"
                placeholder="Ex : Gombe, Avenue..."
                className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm">Note (optionnel)</label>
            <textarea
              name="note"
              rows={3}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              placeholder="Infos utiles: préférences, mensurations, etc."
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer le client"}
          </button>

          <p className="text-xs text-zinc-300/70">
            Après création, tu seras redirigé vers la fiche client.
          </p>
        </form>
      </div>
    </main>
  );
}
