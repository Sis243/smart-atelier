"use client";

import { useState } from "react";

type Attachment = {
  id: string;
  title: string;
  fileName: string;
  type: string;
  url: string;
  createdAt: string;
};

export default function OrderFilesClient({
  orderId,
  initialAttachments,
}: {
  orderId: string;
  initialAttachments: Attachment[];
}) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments ?? []);

  async function upload() {
    if (!file) return alert("Choisis un fichier (PDF/JPG/PNG/WORD/EXCEL)");

    try {
      setBusy(true);

      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());

      const res = await fetch(`/api/orders/${orderId}/attachments/upload`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Erreur (${res.status})`);

      if (json.attachment) {
        setAttachments((prev) => [json.attachment as Attachment, ...prev]);
      }

      setTitle("");
      setFile(null);
      alert("Fichier ajouté ✅");
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="text-xs text-white/60">Pièces jointes (PDF / JPG / PNG / Word / Excel)</div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre (optionnel)"
          className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10 outline-none"
        />

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10 outline-none"
        />

        <button
          disabled={busy}
          onClick={upload}
          className="rounded-xl bg-amber-400/90 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          + Upload
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {attachments.length === 0 ? (
          <div className="text-sm text-white/60">—</div>
        ) : (
          attachments.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              className="block rounded-xl bg-white/10 px-3 py-2 text-sm text-white/85 hover:bg-white/15 ring-1 ring-white/10"
            >
              {a.fileName || a.title || "Fichier"}{" "}
              <span className="text-white/40">({a.type})</span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
