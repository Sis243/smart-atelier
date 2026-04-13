"use client";

import { useMemo, useState } from "react";

type AttachmentItem = {
  id: string;
  title: string;
  fileName: string;
  type: string;
  url: string;
  createdAt: string;
};

type Props = {
  orderId: string;
  initialAttachments: AttachmentItem[];
};

function fileBadge(type: string) {
  const t = String(type || "").toUpperCase();

  if (t === "PDF") return "bg-red-500/15 text-red-200 ring-red-400/20";
  if (t === "IMAGE") return "bg-blue-500/15 text-blue-200 ring-blue-400/20";
  if (t === "WORD") return "bg-indigo-500/15 text-indigo-200 ring-indigo-400/20";
  if (t === "EXCEL") return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20";
  return "bg-white/10 text-zinc-200 ring-white/10";
}

export default function OrderFilesClient({ orderId, initialAttachments }: Props) {
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [type, setType] = useState("OTHER");
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<AttachmentItem[]>(initialAttachments ?? []);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items]);

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      if (!url.trim()) {
        throw new Error("URL du fichier obligatoire");
      }

      const payload = {
        attachments: [
          {
            title: title.trim(),
            fileName: fileName.trim(),
            type,
            url: url.trim(),
          },
        ],
      };

      const res = await fetch(`/api/orders/${orderId}/attachments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Ajout du fichier échoué");
      }

      if (data.attachment) {
        setItems((prev) => [data.attachment, ...prev]);
      }

      setTitle("");
      setFileName("");
      setType("OTHER");
      setUrl("");
      setMsg("Fichier ajouté avec succès.");
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="text-xs text-white/60">Pièces jointes</div>

      <form onSubmit={onAdd} className="mt-3 space-y-3">
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
          <label className="text-sm text-white/80">Titre</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            placeholder="Ex: Bon de commande"
          />
        </div>

        <div>
          <label className="text-sm text-white/80">Nom du fichier</label>
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            placeholder="Ex: commande_001.pdf"
          />
        </div>

        <div>
          <label className="text-sm text-white/80">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          >
            <option value="PDF">PDF</option>
            <option value="IMAGE">Image</option>
            <option value="WORD">Word</option>
            <option value="EXCEL">Excel</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-white/80">URL du fichier</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            placeholder="/uploads/fichier.pdf ou https://..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
        >
          {loading ? "Ajout..." : "Ajouter le fichier"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {sortedItems.length === 0 ? (
          <div className="rounded-xl bg-black/20 p-3 text-sm text-zinc-300/80 ring-1 ring-white/10">
            Aucun fichier joint.
          </div>
        ) : (
          sortedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-black/20 p-3 ring-1 ring-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {item.title || item.fileName || "Pièce jointe"}
                  </div>
                  <div className="mt-1 truncate text-xs text-zinc-300/70">
                    {item.fileName || "Sans nom"}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {new Date(item.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-[11px] ring-1 ${fileBadge(item.type)}`}
                >
                  {item.type}
                </span>
              </div>

              <a
                href={item.url}
                className="mt-3 inline-block text-sm font-medium text-amber-200 hover:underline"
              >
                Ouvrir le fichier
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 
