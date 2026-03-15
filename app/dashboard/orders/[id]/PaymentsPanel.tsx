"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Currency = "USD" | "CDF";
type PaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK";

type Payment = {
  id: string;
  orderId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod | null;
  note: string | null;
  paidAt: string; // ISO string
};

type PaymentsPanelProps = {
  orderId: string;
  defaultCurrency: Currency;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asCurrency(v: any): Currency {
  return v === "CDF" ? "CDF" : "USD";
}

function asMethod(v: any): PaymentMethod {
  if (v === "MOBILE_MONEY") return "MOBILE_MONEY";
  if (v === "BANK") return "BANK";
  return "CASH";
}

export default function PaymentsPanel({ orderId, defaultCurrency }: PaymentsPanelProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState<string>("");

  const totalPaid = useMemo(() => {
    return payments
      .filter((p) => p.currency === currency)
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments, currency]);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Erreur chargement paiements (${res.status})`);
      const data = (await res.json()) as { payments: any[] };

      const list = Array.isArray(data?.payments) ? data.payments : [];
      const normalized: Payment[] = list.map((p) => ({
        id: String(p.id),
        orderId: String(p.orderId),
        amount: Number(p.amount || 0),
        currency: asCurrency(p.currency),
        method: p.method ? asMethod(p.method) : null,
        note: p.note ? String(p.note) : null,
        paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : new Date().toISOString(),
      }));

      setPayments(normalized);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrency(defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    if (!orderId) return;
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function addPayment() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        amount: toNumber(amount),
        currency,
        method,
        note: note || null,
      };

      if (payload.amount <= 0) throw new Error("Le montant doit être > 0");

      const res = await fetch(`/api/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Erreur ajout paiement (${res.status}) ${txt}`);
      }

      setAmount("");
      setNote("");

      await loadPayments();
      router.refresh(); // met à jour Avance/Solde + statut
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function deletePayment(paymentId: string) {
    const ok = window.confirm("Supprimer ce paiement ?");
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Erreur suppression (${res.status}) ${txt}`);
      }

      await loadPayments();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function openReceipt(paymentId: string) {
    const url = `/api/orders/${orderId}/payments/${paymentId}/receipt`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 text-zinc-50">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Paiements</h3>
          <p className="text-sm text-zinc-300/80">
            Commande: <span className="font-mono">{orderId}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayments}
          disabled={loading}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-50"
        >
          Rafraîchir
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Montant</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputMode="decimal"
            className="w-full rounded-xl bg-zinc-950/40 px-3 py-2 ring-1 ring-white/10"
            placeholder="Ex: 50"
          />
        </div>

        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium">Devise</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-full rounded-xl bg-zinc-950/40 px-3 py-2 ring-1 ring-white/10"
          >
            <option value="USD">USD</option>
            <option value="CDF">CDF</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium">Méthode</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-xl bg-zinc-950/40 px-3 py-2 ring-1 ring-white/10"
          >
            <option value="CASH">CASH</option>
            <option value="MOBILE_MONEY">MOBILE_MONEY</option>
            <option value="BANK">BANK</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Note (optionnel)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl bg-zinc-950/40 px-3 py-2 ring-1 ring-white/10"
            placeholder="Ex: acompte, reste, etc."
          />
        </div>

        <div className="md:col-span-6 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
          <div className="text-sm">
            Total payé (en {currency}) :{" "}
            <span className="font-semibold">{totalPaid.toLocaleString("fr-FR")}</span>
          </div>

          <button
            type="button"
            onClick={addPayment}
            disabled={loading}
            className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200">
          <div className="col-span-3">Date</div>
          <div className="col-span-3">Montant</div>
          <div className="col-span-2">Devise</div>
          <div className="col-span-2">Méthode</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && payments.length === 0 ? (
          <div className="p-4 text-sm text-zinc-300/80">Chargement…</div>
        ) : null}

        {!loading && payments.length === 0 ? (
          <div className="p-4 text-sm text-zinc-300/80">Aucun paiement enregistré.</div>
        ) : null}

        {payments.map((p) => (
          <div key={p.id} className="grid grid-cols-12 items-center gap-2 border-t border-white/10 px-3 py-2 text-sm">
            <div className="col-span-3 text-zinc-300/80">{formatDate(p.paidAt)}</div>
            <div className="col-span-3 font-semibold">{p.amount.toLocaleString("fr-FR")}</div>
            <div className="col-span-2">{p.currency}</div>
            <div className="col-span-2">{p.method ?? "—"}</div>

            <div className="col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => openReceipt(p.id)}
                disabled={loading}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-50"
              >
                Reçu
              </button>

              <button
                type="button"
                onClick={() => deletePayment(p.id)}
                disabled={loading}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>

            {p.note ? (
              <div className="col-span-12 -mt-1 text-xs text-zinc-300/70">Note: {p.note}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
