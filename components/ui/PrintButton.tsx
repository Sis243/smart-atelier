"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/15"
    >
      Imprimer
    </button>
  );
}