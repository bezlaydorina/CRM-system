"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";

function applyTheme(mode: Mode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Nézőnkénti preferencia (nem megosztott CRM-adat), ezért localStorage-ban
 * tároljuk - a FOUC elkerülésére a gyökér layout egy blokkoló inline
 * scriptje (lásd src/app/layout.tsx) már a hidratáció előtt beállítja a
 * "dark" class-t ugyanebből a kulcsból.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    let stored: Mode = "system";
    try {
      stored = (localStorage.getItem("theme") as Mode) || "system";
    } catch {
      // private böngészés / blokkolt storage - marad "system"
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- csak mount-kor, localStorage (böngésző-API) olvasásához
    setMode(stored);
  }, []);

  function choose(next: Mode) {
    setMode(next);
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // nem kritikus, ha nem perzisztálható
    }
  }

  const options: { key: Mode; label: string }[] = [
    { key: "light", label: "Világos" },
    { key: "dark", label: "Sötét" },
    { key: "system", label: "Rendszer" },
  ];

  return (
    <div className="inline-flex rounded-lg border border-zinc-300 p-0.5 text-sm dark:border-zinc-600">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => choose(o.key)}
          className={`rounded-md px-3 py-1 ${mode === o.key ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-400"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
