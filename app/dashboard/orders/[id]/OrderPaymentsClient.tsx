"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  currency: "USD" | "CDF";
};

export default function OrderPaymentsClient({ orderId, currency }: Props) {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "MOBILE_MONEY" | "BANK">("CASH");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submitPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount: Number(amount),
          currency,
          method,
          note,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Paiement échoué");
      }

      setAmount("");
      setMethod("CASH");
      setNote("");
      setMsg("Paiement enregistré avec succès.");

      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="text-xs text-white/60">Ajouter un paiement</div>

      <form onSubmit={submitPayment} className="mt-3 space-y-3">
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
          <label className="text-sm text-white/80">Montant ({currency})</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            placeholder={`Montant en ${currency}`}
            required
          />
        </div>

        <div>
          <label className="text-sm text-white/80">Mode de paiement</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "CASH" | "MOBILE_MONEY" | "BANK")}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          >
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK">Banque</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-white/80">Note</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            placeholder="Référence, numéro transaction, commentaire..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {loading ? "Enregistrement..." : "Enregistrer le paiement"}
        </button>
      </form>
    </div>
  );
}