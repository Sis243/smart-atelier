"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  SectionCard,
  DataTable,
  EmptyState,
  FormField,
} from "@/components/ui";

type Supplier = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export default function StockSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadData() {
    const res = await fetch("/api/stock/suppliers", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setSuppliers(data.suppliers || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function startEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setEditName(supplier.name);
    setEditPhone(supplier.phone ?? "");
    setEditEmail(supplier.email ?? "");
    setEditAddress(supplier.address ?? "");
    setErr(null);
    setMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
    setEditEmail("");
    setEditAddress("");
  }

  async function saveEdit(id: string) {
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/stock/suppliers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Modification impossible");

      setMsg("Fournisseur modifié avec succès.");
      cancelEdit();
      await loadData();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  async function deleteSupplier(id: string) {
    const ok = window.confirm("Voulez-vous vraiment supprimer ce fournisseur ?");
    if (!ok) return;

    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/stock/suppliers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Suppression impossible");

      setMsg("Fournisseur supprimé avec succès.");
      await loadData();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/stock/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone, email, address }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Création impossible");

      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setMsg("Fournisseur ajouté avec succès.");
      await loadData();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Fournisseurs stock"
        subtitle="Créer, modifier et supprimer les fournisseurs."
        actions={[{ label: "Retour stock", href: "/dashboard/stock" }]}
      />

      <SectionCard title="Nouveau fournisseur">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <FormField label="Nom">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" required />
          </FormField>

          <FormField label="Téléphone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </FormField>

          <FormField label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </FormField>

          <FormField label="Adresse">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </FormField>

          <div className="xl:col-span-4 flex items-center gap-3">
            <button className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
              Ajouter fournisseur
            </button>
            {msg ? <span className="text-sm text-emerald-300">{msg}</span> : null}
            {err ? <span className="text-sm text-red-300">{err}</span> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Liste fournisseurs">
        <DataTable
          headers={["Nom", "Téléphone", "Email", "Adresse", "Actions"]}
          empty={<EmptyState title="Aucun fournisseur" description="Ajoute un premier fournisseur." />}
          colSpan={5}
        >
          {suppliers.length > 0
            ? suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-white/5">
                  {editingId === supplier.id ? (
                    <>
                      <td className="px-4 py-3"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveEdit(supplier.id)} className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200">Enregistrer</button>
                          <button type="button" onClick={cancelEdit} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white">Annuler</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-white">{supplier.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{supplier.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-300">{supplier.email ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-300">{supplier.address ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(supplier)} className="rounded-lg bg-cyan-500/20 px-3 py-2 text-xs text-cyan-200">Modifier</button>
                          <button type="button" onClick={() => deleteSupplier(supplier.id)} className="rounded-lg bg-red-600/20 px-3 py-2 text-xs text-red-200">Supprimer</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            : null}
        </DataTable>
      </SectionCard>
    </main>
  );
}