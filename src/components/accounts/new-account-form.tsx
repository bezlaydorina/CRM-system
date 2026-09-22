"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Card, Badge } from "@/components/ui";
import { quickSaveAccountAction, createFullAccountAction } from "@/lib/actions/account-actions";
import {
  ACCOUNT_PACKAGES,
  AI_MODULES,
  HARDWARE_COMPUTERS,
  HARDWARE_MONITORS,
  HARDWARE_SETUP_FEE,
  ONBOARDING_ADDONS,
  INDUSTRIES,
  formatHUF,
} from "@/lib/enums";

export function NewAccountForm() {
  const [packageKey, setPackageKey] = useState<string>("AGENCY");
  const [aiModule, setAiModule] = useState<string>("");
  const [computer, setComputer] = useState<string>("");
  const [monitor, setMonitor] = useState<string>("");
  const [addons, setAddons] = useState<string[]>([]);
  const [wantsPassword, setWantsPassword] = useState(false);

  const pkg = ACCOUNT_PACKAGES.find((p) => p.key === packageKey) ?? null;

  const { monthlyFee, setupFee } = useMemo(() => {
    let monthly = pkg?.monthlyFee ?? 0;
    let setup = pkg?.setupFee ?? 0;
    if (computer || monitor) setup += HARDWARE_SETUP_FEE;
    for (const key of addons) {
      const addon = ONBOARDING_ADDONS.find((a) => a.key === key);
      if (!addon) continue;
      if (addon.billing === "MONTHLY") monthly += addon.price;
      else setup += addon.price;
    }
    return { monthlyFee: monthly, setupFee: setup };
  }, [pkg, computer, monitor, addons]);

  function toggleAddon(key: string) {
    setAddons((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <form action={createFullAccountAction} className="space-y-6">
      <input type="hidden" name="package" value={packageKey} />
      <input type="hidden" name="aiModule" value={aiModule} />
      <input type="hidden" name="computer" value={computer} />
      <input type="hidden" name="monitor" value={monitor} />

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">🏢 Ügyfél adatok</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cégnév *" name="name" placeholder="Pl. Példa Kft." required className="sm:col-span-2" />
          <label className="text-sm font-medium text-zinc-700">
            Iparág *
            <select name="industry" required defaultValue="" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="" disabled>
                Válassz iparágat
              </option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <Field label="Weboldal" name="website" placeholder="example.com" />
          <Field label="Vezetéknév *" name="contactLastName" placeholder="Kiss" required />
          <Field label="Keresztnév *" name="contactFirstName" placeholder="János" required />
          <Field label="Telefonszám" name="phone" placeholder="+36 30 123 4567" />
          <Field label="E-mail cím *" name="email" type="email" placeholder="ugyfel@ceg.hu" required />
        </div>

        <label className="mt-4 flex items-start gap-2 border-t border-zinc-100 pt-4 text-sm">
          <input type="checkbox" name="setPassword" checked={wantsPassword} onChange={(e) => setWantsPassword(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>
            <span className="font-medium text-zinc-700">Jelszó megadása</span>
            <p className="text-xs text-zinc-500">Alapértelmezetten az ügyfél maga állítja be a jelszavát – a portál jelszót az ügyfél adatlapján bármikor pótolhatod.</p>
          </span>
        </label>
        {wantsPassword ? (
          <input name="password" type="password" placeholder="Jelszó (min. 4 karakter)" minLength={4} className="mt-2 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
        ) : null}

        <div className="mt-4 border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-500">
            <span className="font-medium text-zinc-600">Gyorsmentés:</span> a fenti adatokkal létrehozza a fiókot. A csomagot és a pénzügyi részt bármikor pótolhatod.
          </p>
          <button formAction={quickSaveAccountAction} className="mt-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            💾 Gyorsmentés
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">✨ Csomag</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ACCOUNT_PACKAGES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPackageKey(p.key)}
              className={clsx(
                "flex flex-col rounded-xl border-2 p-4 text-left transition",
                packageKey === p.key ? "border-indigo-600 bg-indigo-50" : "border-zinc-200 hover:border-zinc-300"
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-base font-bold uppercase text-zinc-900">{p.label}</span>
                {packageKey === p.key ? <Badge color="indigo">Kiválasztva</Badge> : null}
              </span>
              <p className="mt-2 text-xs text-zinc-500">{p.description}</p>
              <span className="mt-3 text-xs font-medium uppercase text-zinc-400">Havidíj</span>
              <span className="text-lg font-bold text-zinc-900">{formatHUF(p.monthlyFee)}</span>
              <span className="mt-1 text-xs font-medium uppercase text-zinc-400">Setup</span>
              <span className="text-sm font-semibold text-zinc-700">{formatHUF(p.setupFee)}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
          ⚙️ AI modul <span className="text-xs font-normal text-zinc-400">(opcionális)</span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AI_MODULES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setAiModule((prev) => (prev === m.key ? "" : m.key))}
              className={clsx(
                "rounded-xl border-2 p-3 text-center transition",
                aiModule === m.key ? "border-indigo-600 bg-indigo-50" : "border-zinc-200 hover:border-zinc-300"
              )}
            >
              <p className="text-sm font-semibold text-zinc-900">{m.label}</p>
              <p className="text-xs text-zinc-400">{m.vendor}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
          🖥️ Ajándék hardver <span className="text-xs font-normal text-zinc-400">(opcionális +{formatHUF(HARDWARE_SETUP_FEE)} setup)</span>
        </h2>
        <p className="mb-2 text-xs font-semibold uppercase text-zinc-400">Számítógép</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {HARDWARE_COMPUTERS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setComputer((prev) => (prev === c.key ? "" : c.key))}
              className={clsx(
                "rounded-lg border-2 px-3 py-2 text-left text-sm transition",
                computer === c.key ? "border-indigo-600 bg-indigo-50 font-medium text-zinc-900" : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mb-2 mt-4 text-xs font-semibold uppercase text-zinc-400">Monitor</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {HARDWARE_MONITORS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMonitor((prev) => (prev === m.key ? "" : m.key))}
              className={clsx(
                "rounded-lg border-2 px-3 py-2 text-left text-sm transition",
                monitor === m.key ? "border-indigo-600 bg-indigo-50 font-medium text-zinc-900" : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">+ Extra bővítmények</h2>
        <div className="space-y-2">
          {ONBOARDING_ADDONS.map((a) => (
            <label
              key={a.key}
              className={clsx(
                "flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition",
                addons.includes(a.key) ? "border-indigo-300 bg-indigo-50/60" : "border-zinc-100 hover:bg-zinc-50"
              )}
            >
              <span className="flex items-start gap-2">
                <input type="checkbox" name="addons" value={a.key} checked={addons.includes(a.key)} onChange={() => toggleAddon(a.key)} className="mt-0.5 h-4 w-4" />
                <span>
                  <span className="font-medium text-zinc-800">{a.label}</span>
                  <p className="text-xs text-zinc-500">{a.description}</p>
                </span>
              </span>
              <Badge color="gray">
                +{formatHUF(a.price)} {a.billing === "MONTHLY" ? "/ hó" : "(egyszeri)"}
              </Badge>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">⚡ Lezárás</h2>
        <label className="block text-sm font-medium text-zinc-700">
          Szerződés aláírva
          <input name="contractSignedAt" type="date" className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
        </label>
        <p className="mt-1 text-xs text-zinc-500">A befizetési rekord automatikusan létrejön a megadott dátummal, holnaptól lejártnak jelenik meg a dashboard-on, míg be nem pipálod.</p>

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Belső megjegyzés (opcionális)
          <textarea name="internalNote" rows={2} placeholder="Meeting összefoglaló, speciális kérések, stb." className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Projekt leírás
          <textarea name="projectNote" rows={2} placeholder="Milyen projektet kell fejleszteni? (rövid leírás)" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
        </label>
      </Card>

      <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="text-sm text-zinc-600">
          Összesen: <span className="font-semibold text-zinc-900">{formatHUF(monthlyFee)} / hó</span> + <span className="font-semibold text-zinc-900">{formatHUF(setupFee)} setup</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/ugyfelek" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Mégse
          </Link>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            ✓ Teljes létrehozás
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={clsx("text-sm font-medium text-zinc-700", className)}>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
    </label>
  );
}
