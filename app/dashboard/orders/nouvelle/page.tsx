"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();
  const search = useSearchParams();
  const preselectedId = (search.get("customerId") ?? "").trim();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ⚠️ Comme c’est une page client, on ne peut plus faire prisma.findMany ici.
  // => On va charger la liste clients via /api/customers (à créer juste après).
  const [customers, setCustomers] = useState<{ id: string; fullName: string; type: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  // charge clients une seule fois
  useMemo(() => {
    if (loaded) return;
    (async () => {
      try {
        const res = await fetch("/api/customers/list", { cache: "no-store" });
        const data = await res.json();
        if (data?.ok) setCustomers(data.customers || []);
      } finally {
        setLoaded(true);
      }
    })();
  }, [loaded]);

  const defaultCustomerId = customers.some((c) => c.id === preselectedId)
    ? preselectedId
    : (customers[0]?.id ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const payload = {
      customerId: String(form.get("customerId") || "").trim(),
      currency: String(form.get("currency") || "USD"),
      fxRate: Number(form.get("fxRate") || 1),
      totalAmount: Number(form.get("totalAmount") || 0),
      discount: Number(form.get("discount") || 0),
      depositAmount: Number(form.get("depositAmount") || 0),

      isLot: form.get("isLot") === "on",
      lotLabel: String(form.get("lotLabel") || "").trim(),
      lotQuantity: Number(form.get("lotQuantity") || 1),

      itemType: String(form.get("itemType") || "").trim(),
      category: String(form.get("category") || "").trim(),
      fabricType: String(form.get("fabricType") || "").trim(),
      fabricColor: String(form.get("fabricColor") || "").trim(),
      fabricMeters: String(form.get("fabricMeters") || "").trim(),

      description: String(form.get("description") || "").trim(),
      measurements: String(form.get("measurements") || "").trim(),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Création échouée");

      // ✅ redirection vers la commande créée
      router.push(`/dashboard/orders/${data.id}`);
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
        <h1 className="text-2xl font-semibold">Nouvelle commande</h1>
        <p className="mt-1 text-sm text-zinc-300/80">
          Création + workflow automatique (Coupe → Production → Qualité → Livraison).
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          {err && (
            <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
              {err}
            </div>
          )}

          <div>
            <label className="text-sm">Client</label>
            <select
              name="customerId"
              defaultValue={defaultCustomerId}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.type})
                </option>
              ))}
            </select>

            {loaded && customers.length === 0 && (
              <p className="mt-2 text-xs text-red-200">Aucun client. Crée d’abord un client.</p>
            )}

            {preselectedId && customers.length > 0 && (
              <p className="mt-2 text-xs text-emerald-200">✅ Client pré-sélectionné.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm">Devise</label>
              <select name="currency" className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10">
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Taux USD→CDF</label>
              <input name="fxRate" defaultValue={1} className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
            <div>
              <label className="text-sm">Total</label>
              <input name="totalAmount" defaultValue={0} className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
            <div>
              <label className="text-sm">Avance</label>
              <input name="depositAmount" defaultValue={0} className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Remise</label>
              <input name="discount" defaultValue={0} className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input id="isLot" name="isLot" type="checkbox" className="h-4 w-4" />
              <label htmlFor="isLot" className="text-sm">Commande par lot</label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Libellé lot</label>
              <input name="lotLabel" className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
            <div>
              <label className="text-sm">Quantité lot</label>
              <input name="lotQuantity" defaultValue={1} className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Type article</label>
              <input name="itemType" className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
            <div>
              <label className="text-sm">Catégorie</label>
              <input name="category" className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm">Tissu</label>
              <input name="fabricType" className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
            <div>
              <label className="text-sm">Couleur</label>
              <input name="fabricColor" className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
            <div>
              <label className="text-sm">Métrage</label>
              <input name="fabricMeters" className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
            </div>
          </div>

          <div>
            <label className="text-sm">Description</label>
            <textarea name="description" rows={3} className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </div>

          <div>
            <label className="text-sm">Mesures</label>
            <textarea name="measurements" rows={3} className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer la commande"}
          </button>

          <p className="text-xs text-zinc-300/70">
            Après création, tu seras redirigé vers la commande.
          </p>
        </form>
      </div>
    </main>
  );
}
