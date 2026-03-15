"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";

function SafeImg({
  src,
  alt,
  className,
  style,
  fallbackText,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackText?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div
        aria-label={alt}
        className={className}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
          {fallbackText ?? "IMG"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setBroken(true)}
    />
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 4 && !busy;
  }, [email, password, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;

    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!res || res.error) {
        setError("Email ou mot de passe incorrect.");
        setBusy(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Erreur réseau. Réessaie.");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <SafeImg
          src="/atelier.jpg"
          alt="Atelier couture"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          fallbackText=""
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_20%,rgba(255,215,0,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_80%,rgba(0,200,255,0.16),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%220.4%22/></svg>')]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15">
            <SafeImg
              src="/mwinda.jpg"
              alt="Mwinda Industrie"
              className="h-full w-full object-contain p-1.5"
              fallbackText="MW"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm text-white/70">Mwinda Industrie</div>
            <div className="text-lg font-semibold tracking-tight">Smart Atelier</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15">
            ERP Atelier de couture
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15">
            Sécurisé • Temps réel
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-6 pb-14 pt-2 md:grid-cols-2 md:items-center">
        <section className="md:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.65)]" />
            Système prêt pour production
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
            Pilote ton atelier <span className="text-white/80">comme une entreprise.</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 md:text-base">
            Suivi complet des commandes, workflow Coupe → Production → Qualité → Livraison, caisse,
            stock, RH, comptabilité et messagerie interne.
          </p>
        </section>

        <section className="md:pl-6">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[radial-gradient(400px_circle_at_30%_20%,rgba(255,215,0,0.18),transparent_60%),radial-gradient(420px_circle_at_80%_75%,rgba(0,200,255,0.14),transparent_60%)] blur-xl" />

            <div className="relative rounded-[28px] bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur-xl md:p-8">
              <div>
                <div className="text-lg font-semibold tracking-tight">Connexion</div>
                <div className="mt-1 text-xs text-white/65">Accès sécurisé • Mwinda Industrie</div>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs text-white/70">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="ex: admin@mwinda.cd"
                    className="mt-2 w-full rounded-2xl bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 ring-1 ring-white/12 outline-none transition focus:ring-white/25"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70">Mot de passe</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="mt-2 w-full rounded-2xl bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 ring-1 ring-white/12 outline-none transition focus:ring-white/25"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-xs text-red-200 ring-1 ring-red-400/20">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15">
                  <SafeImg
                    src="/mwinda.jpg"
                    alt="Mwinda"
                    className="h-full w-full object-contain p-1.5"
                    fallbackText="MW"
                  />
                </div>
                <div className="text-xs text-white/65">
                  <div className="font-semibold text-white/85">Mwinda Industrie</div>
                  <div>Plateforme Smart Atelier • Accès par permissions</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-white/50">
            © {new Date().getFullYear()} Smart IT Solutions • Mwinda Industrie
          </div>
        </section>
      </main>
    </div>
  );
}
