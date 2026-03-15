"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        // 1) Déconnecte côté NextAuth (supprime cookies)
        await signOut({ redirect: false });

        // 2) Force la redirection (hard refresh)
        window.location.href = "/login";
      }}
      className="w-full rounded-xl bg-white/10 px-3 py-2 text-left text-sm text-white/80 ring-1 ring-white/10 hover:bg-white/15 hover:text-white transition"
    >
      Déconnexion
    </button>
  );
}
