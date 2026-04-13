"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          window.localStorage.removeItem("smart-atelier-theme");
          window.sessionStorage.clear();
          await signOut({ callbackUrl: "/login", redirect: false });
        } finally {
          window.location.replace("/login");
        }
      }}
      className="w-full rounded-xl bg-white/10 px-3 py-2 text-left text-sm text-white/80 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "Déconnexion..." : "Déconnexion"}
    </button>
  );
}
