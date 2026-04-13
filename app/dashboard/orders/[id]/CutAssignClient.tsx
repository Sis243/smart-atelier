"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Props = {
  orderId: string;
  currentAssignedToId: string | null;
  users: UserOption[];
};

export default function CutAssignClient({
  orderId,
  currentAssignedToId,
  users,
}: Props) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState(currentAssignedToId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) ?? null;
  }, [users, selectedUserId]);

  async function handleAssign() {
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/cut-assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedToId: selectedUserId || null,
        }),
      });

      const rawText = await res.text();
      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = { rawText };
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            data?.rawText ||
            `Erreur HTTP ${res.status}`
        );
      }

      setMessage(data?.message || "Assignation mise à jour avec succès.");

      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">Affectation de la coupe</h3>
        <p className="mt-1 text-sm text-neutral-400">
          Choisis l’agent responsable de l’étape de coupe pour cette commande.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <label
            htmlFor="cut-assigned-user"
            className="mb-2 block text-sm font-medium text-neutral-300"
          >
            Responsable coupe
          </label>

          <select
            id="cut-assigned-user"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            disabled={loading || isPending}
          >
            <option value="">-- Aucun responsable --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} {user.role ? `(${user.role})` : ""}
              </option>
            ))}
          </select>

          {selectedUser ? (
            <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-sm text-cyan-100">
              <p className="font-medium">{selectedUser.name}</p>
              <p className="text-cyan-200/80">{selectedUser.email}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-cyan-300/80">
                {selectedUser.role}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading || isPending}
            className="w-full rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {loading || isPending ? "Mise à jour..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}