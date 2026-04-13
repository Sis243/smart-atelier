"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  employeeId: string;
  currentPhotoUrl?: string | null;
  employeeName: string;
};

export default function EmployeePhotoUpload({
  employeeId,
  currentPhotoUrl,
  employeeName,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function handleFileChange(file: File | null) {
    setMessage(null);
    setError(null);

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Format non supporté. Utilise JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde. Maximum 5 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/hr/employees/${employeeId}/photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Échec de l’envoi de la photo.");
      }

      setPreview(data?.photoUrl || localPreview);
      setMessage("Photo de profil enregistrée avec succès.");

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
    <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/40 p-4 ring-1 ring-white/10">
      <h3 className="text-sm font-semibold text-white">Photo de profil</h3>
      <p className="mt-1 text-xs text-zinc-400">
        Charge une photo depuis ton ordinateur.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-white/5">
          {preview ? (
            <Image
              src={preview}
              alt={employeeName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
              N/A
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="inline-flex rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Téléchargement..." : "Choisir une photo"}
          </button>

          <span className="text-xs text-zinc-500">
            JPG, PNG ou WEBP • 5 MB maximum
          </span>
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
