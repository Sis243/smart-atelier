"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type Permission = { id: string; key: string; label: string };

const ROLES = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGER",
  "COUPE",
  "PRODUCTION",
  "QUALITE",
  "LOGISTIQUE",
  "CAISSIER",
  "RH",
  "COMPTABLE",
];

function roleBadge(role: string) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1";
  const r = role?.toUpperCase?.() ?? "";
  if (r === "SUPERADMIN") return `${base} bg-purple-500/15 text-purple-200 ring-purple-400/20`;
  if (r === "ADMIN") return `${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`;
  if (r === "MANAGER") return `${base} bg-emerald-500/15 text-emerald-200 ring-emerald-400/20`;
  if (["COUPE", "PRODUCTION", "QUALITE", "LOGISTIQUE"].includes(r))
    return `${base} bg-amber-500/15 text-amber-200 ring-amber-400/20`;
  if (["CAISSIER", "COMPTABLE"].includes(r))
    return `${base} bg-cyan-500/15 text-cyan-200 ring-cyan-400/20`;
  if (r === "RH") return `${base} bg-pink-500/15 text-pink-200 ring-pink-400/20`;
  return `${base} bg-white/10 text-white/75 ring-white/10`;
}

function statusBadge(active: boolean) {
  return active
    ? "inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-400/20"
    : "inline-flex items-center rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-200 ring-1 ring-rose-400/20";
}

/** ------------- Permissions grouping helpers ------------- */
function permissionGroup(key: string) {
  const k = (key ?? "").toUpperCase();
  if (k.startsWith("DASHBOARD_")) return { id: "dashboard", label: "Dashboard" };
  if (k.startsWith("USERS_")) return { id: "users", label: "Utilisateurs" };
  if (k.startsWith("CUSTOMERS_")) return { id: "customers", label: "Clients" };
  if (k.startsWith("ORDERS_")) return { id: "orders", label: "Commandes" };
  if (k.startsWith("CUT_")) return { id: "cut", label: "Coupe" };
  if (k.startsWith("PRODUCTION_")) return { id: "production", label: "Production" };
  if (k.startsWith("QUALITY_")) return { id: "quality", label: "Qualité" };
  if (k.startsWith("DELIVERY_")) return { id: "delivery", label: "Livraison" };
  if (k.startsWith("STOCK_")) return { id: "stock", label: "Stock" };
  if (k.startsWith("ACTIVITY_")) return { id: "activity", label: "Journal" };
  if (k.startsWith("ACCOUNTING_")) return { id: "accounting", label: "Comptabilité" };
  if (k.startsWith("HR_")) return { id: "hr", label: "RH" };
  if (k.startsWith("CHAT_")) return { id: "chat", label: "Messagerie" };
  if (k.startsWith("PRESENCE_")) return { id: "presence", label: "Présence" };
  if (k.startsWith("NOTIFICATIONS_")) return { id: "notifications", label: "Notifications" };
  return { id: "other", label: "Autres" };
}

function groupPermissions(perms: Permission[]) {
  const map = new Map<string, { label: string; items: Permission[] }>();

  for (const p of perms) {
    const g = permissionGroup(p.key);
    if (!map.has(g.id)) map.set(g.id, { label: g.label, items: [] });
    map.get(g.id)!.items.push(p);
  }

  const order = [
    "dashboard",
    "users",
    "customers",
    "orders",
    "cut",
    "production",
    "quality",
    "delivery",
    "stock",
    "activity",
    "accounting",
    "hr",
    "chat",
    "presence",
    "notifications",
    "other",
  ];

  const out = order
    .filter((id) => map.has(id))
    .map((id) => {
      const g = map.get(id)!;
      g.items.sort((a, b) => a.key.localeCompare(b.key));
      return { id, label: g.label, items: g.items };
    });

  return out;
}

/** ✅ Modal Permissions (avec timeout + fetch safe + groupes) */
function UserPermissionsModal({
  open,
  onClose,
  userId,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userEmail: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [all, setAll] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");

  async function fetchJsonSafe(url: string, signal: AbortSignal) {
    const res = await fetch(url, { signal });
    const text = await res.text();

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const preview = text?.slice(0, 160)?.replace(/\s+/g, " ");
      throw new Error(`${url} -> HTTP ${res.status}. Body: ${preview || "vide"}`);
    }

    if (json === null) {
      throw new Error(`${url} -> Réponse non JSON (probablement HTML/404).`);
    }

    return json;
  }

  useEffect(() => {
    if (!open || !userId) return;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);

    (async () => {
      setErrMsg(null);
      setLoading(true);

      try {
        const [p1, p2] = await Promise.all([
          fetchJsonSafe("/api/permissions", controller.signal),
          fetchJsonSafe(`/api/users/${userId}/permissions`, controller.signal),
        ]);

        const allPerms: Permission[] = Array.isArray(p1) ? p1 : [];
        const userPerms: Permission[] = Array.isArray(p2) ? p2 : [];

        setAll(allPerms);

        const map: Record<string, boolean> = {};
        for (const p of allPerms) map[p.id] = false;
        for (const p of userPerms) map[p.id] = true;
        setSelected(map);

        if (allPerms.length === 0) {
          setErrMsg(
            "Aucune permission trouvée. Il faut remplir la table Permission (seed) ou créer des permissions."
          );
        }
      } catch (e: any) {
        const msg =
          e?.name === "AbortError"
            ? "Chargement trop long (timeout 10s). Vérifie l’API."
            : String(e?.message || e);
        setErrMsg(msg);
      } finally {
        setLoading(false);
        clearTimeout(t);
      }
    })();

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [open, userId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((p) => `${p.key} ${p.label}`.toLowerCase().includes(s));
  }, [q, all]);

  const grouped = useMemo(() => groupPermissions(filtered), [filtered]);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAll() {
    const map: Record<string, boolean> = {};
    for (const p of all) map[p.id] = true;
    setSelected(map);
  }

  function clearAll() {
    const map: Record<string, boolean> = {};
    for (const p of all) map[p.id] = false;
    setSelected(map);
  }

  function selectGroup(ids: string[]) {
    setSelected((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = true;
      return next;
    });
  }

  function clearGroup(ids: string[]) {
    setSelected((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = false;
      return next;
    });
  }

  async function save() {
    if (!userId) return;
    setLoading(true);

    const permissionIds = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);

    const res = await fetch(`/api/users/${userId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionIds }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Erreur lors de l’enregistrement des permissions");
      return;
    }

    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-950 p-4 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white/60">Permissions</div>
            <div className="text-lg font-semibold">{userEmail ?? "Utilisateur"}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Fermer
          </button>
        </div>

        {errMsg && (
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {errMsg}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une permission…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
          />

          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Tout
            </button>
            <button
              onClick={clearAll}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Rien
            </button>
          </div>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-auto rounded-2xl border border-white/10">
          {loading ? (
            <div className="p-4 text-sm text-white/70">Chargement…</div>
          ) : grouped.length === 0 ? (
            <div className="p-4 text-sm text-white/70">Aucune permission.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {grouped.map((g) => {
                const ids = g.items.map((x) => x.id);
                const checkedCount = g.items.filter((x) => selected[x.id]).length;

                return (
                  <div key={g.id} className="p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{g.label}</div>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60 ring-1 ring-white/10">
                          {checkedCount}/{g.items.length}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => selectGroup(ids)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          Tout
                        </button>
                        <button
                          onClick={() => clearGroup(ids)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          Rien
                        </button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <div className="divide-y divide-white/10">
                        {g.items.map((p) => (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-start justify-between gap-3 p-3 hover:bg-white/5"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">{p.label}</div>
                              <div className="truncate text-xs text-white/55">{p.key}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={!!selected[p.id]}
                              onChange={() => toggle(p.id)}
                              className="mt-1 h-4 w-4"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            Annuler
          </button>
          <button
            disabled={loading}
            onClick={save}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:opacity-90 disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/** ✅ Modal Create User (au lieu du formulaire à gauche) */
function CreateUserModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MANAGER");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setFullName("");
    setEmail("");
    setRole("MANAGER");
    setPassword("");
  }, [open]);

  async function save() {
    setSaving(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, role, password }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      alert(data?.error ?? "Erreur création");
      return;
    }

    await onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950 p-4 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white/60">Créer</div>
            <div className="text-lg font-semibold">Nouveau utilisateur</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Fermer
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-xs text-white/60">Nom complet</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Ex: Flory Bokako"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
              placeholder="ex: admin@mwinda.cd"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/60">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-neutral-950 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60">Mot de passe</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                placeholder="min 6 caractères"
                type="password"
              />
            </div>
          </div>

          <div className="text-xs text-white/50">
            Utilise le rôle (COUPE, PRODUCTION, QUALITE…) + permissions pour affiner l’accès.
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            Annuler
          </button>
          <button
            disabled={saving}
            onClick={save}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ✅ Modal Edit User */
function EditUserModal({
  open,
  onClose,
  user,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    setFullName(user.fullName);
    setEmail(user.email);
  }, [open, user]);

  async function save() {
    if (!user) return;
    setSaving(true);

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      alert(data?.error ?? "Erreur mise à jour");
      return;
    }

    await onSaved();
    onClose();
  }

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950 p-4 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white/60">Modifier</div>
            <div className="text-lg font-semibold">{user.email}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Fermer
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-xs text-white/60">Nom complet</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Nom complet"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Email"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            Annuler
          </button>
          <button
            disabled={saving}
            onClick={save}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");

  // Permissions modal
  const [permOpen, setPermOpen] = useState(false);
  const [permUserId, setPermUserId] = useState<string | null>(null);
  const [permEmail, setPermEmail] = useState<string | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json().catch(() => []);
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => {
      const blob = `${u.fullName} ${u.email} ${u.role}`.toLowerCase();
      return blob.includes(s);
    });
  }, [q, users]);

  async function toggleActive(u: User) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (!res.ok) alert("Erreur");
    await load();
  }

  // ✅ ICI : ta fonction demandée (PATCH role + POST apply-role-permissions)
  async function changeRole(u: User, role: string) {
    // 1) change role
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      alert("Erreur");
      return;
    }

    // 2) apply default permissions for that role
    const res2 = await fetch(`/api/users/${u.id}/apply-role-permissions`, { method: "POST" });
    if (!res2.ok) {
      // pas bloquant, mais on te prévient
      alert("Rôle changé, mais application des permissions par défaut a échoué.");
    }

    await load();
  }

  async function resetPassword(u: User) {
    const password = prompt(`Nouveau mot de passe pour ${u.email} (min 6 caractères) :`);
    if (!password) return;

    const res = await fetch(`/api/users/${u.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data?.error ?? "Erreur reset");
    else alert("Mot de passe réinitialisé ✅");
  }

  async function remove(u: User) {
    if (!confirm(`Supprimer ${u.email} ?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (!res.ok) alert("Erreur suppression");
    await load();
  }

  function openPermissions(u: User) {
    setPermUserId(u.id);
    setPermEmail(u.email);
    setPermOpen(true);
  }

  function openEdit(u: User) {
    setEditUser(u);
    setEditOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-1">
        <div className="text-xs text-white/60">Administration</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Utilisateurs</h1>
            <div className="text-sm text-white/60">Gestion des comptes, rôles et permissions.</div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60 ring-1 ring-white/10">
              {users.length} comptes
            </span>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:opacity-90"
            >
              + Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, rôle)…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
          />

          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
            {filtered.length} résultat(s)
          </div>
        </div>

        <div className="mt-4 max-h-[72vh] overflow-auto rounded-2xl border border-white/10">
          {loading ? (
            <div className="p-4 text-sm text-white/70">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-white/70">Aucun utilisateur.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 p-3 hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold">{u.fullName}</div>
                      <span className={roleBadge(u.role)}>{u.role}</span>
                      <span className={statusBadge(u.isActive)}>
                        {u.isActive ? "Actif" : "Désactivé"}
                      </span>
                    </div>

                    <div className="truncate text-xs text-white/60">{u.email}</div>

                    <div className="mt-1 text-[11px] text-white/45">
                      Créé le {new Date(u.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className="rounded-xl border border-white/10 bg-neutral-950 text-white px-3 py-2 text-xs outline-none hover:bg-white/10 focus:ring-2 focus:ring-white/20"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-neutral-950 text-white">
                          {r}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      title="Modifier nom + email"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => openPermissions(u)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      title="Gérer les permissions"
                    >
                      Permissions
                    </button>

                    <button
                      onClick={() => toggleActive(u)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      title="Activer / Désactiver"
                    >
                      {u.isActive ? "Désactiver" : "Activer"}
                    </button>

                    <button
                      onClick={() => resetPassword(u)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      title="Réinitialiser le mot de passe"
                    >
                      Reset MDP
                    </button>

                    <button
                      onClick={() => remove(u)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/15"
                      title="Supprimer"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={load} />

      <UserPermissionsModal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        userId={permUserId}
        userEmail={permEmail}
      />

      <EditUserModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={editUser}
        onSaved={load}
      />
    </div>
  );
}
