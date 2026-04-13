"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { value: "dark", label: "Sombre" },
  { value: "light", label: "Clair" },
  { value: "atelier", label: "Atelier" },
] as const;

type ThemeValue = (typeof THEMES)[number]["value"];

function isTheme(value: string | null): value is ThemeValue {
  return value === "dark" || value === "light" || value === "atelier";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeValue>("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("smart-atelier-theme");
    const initial = isTheme(saved) ? saved : "dark";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function changeTheme(nextTheme: ThemeValue) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("smart-atelier-theme", nextTheme);
  }

  return (
    <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">
      <span>Thème</span>
      <select
        value={theme}
        onChange={(e) => changeTheme(e.target.value as ThemeValue)}
        className="bg-transparent text-xs font-semibold text-white outline-none"
      >
        {THEMES.map((item) => (
          <option key={item.value} value={item.value} className="bg-zinc-950 text-white">
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
