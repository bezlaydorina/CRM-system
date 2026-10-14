"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Card, Badge } from "@/components/ui";
import { quickSaveAccountAction, createFullAccountAction } from "@/lib/actions/account-actions";
import { ACCOUNT_PACKAGES, INDUSTRIES, formatHUF } from "@/lib/enums";

export function NewAccountForm() {
  const [packageKey, setPackageKey] = useState<string>("GROWTH");
  const [customMonthlyFee, setCustomMonthlyFee] = useState(0);
  const [customSetupFee, setCustomSetupFee] = useState(0);
  const [wantsPassword, setWantsPassword] = useState(false);

  const pkg = ACCOUNT_PACKAGES.find((p) => p.key === packageKey) ?? null;

  const { monthlyFee, setupFee } = useMemo(() => {
    if (pkg?.custom) return { monthlyFee: customMonthlyFee, setupFee: customSetupFee };
    return { monthlyFee: pkg?.monthlyFee ?? 0, setupFee: pkg?.setupFee ?? 0 };
  }, [pkg, customMonthlyFee, customSetupFee]);

  return (
    <form action={createFullAccountAction} className="space-y-6">
      <input type="hidden" name="package" value={packageKey} />

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">🏢 Ügyfél adatok</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cégnév *" name="name" placeholder="Pl. Példa Kft." required className="sm:col-span-2" />
          <label className="text-sm font-medium text-zinc-700">
            Iparág *
            <select name="industry" required defaultValue="" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none">
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
          <input name="password" type="password" placeholder="Jelszó (min. 4 karakter)" minLength={4} className="mt-2 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none" />
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
                packageKey === p.key ? "border-brand-gold bg-brand-gold/10" : "border-zinc-200 hover:border-zinc-300"
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-base font-bold uppercase text-brand-text">{p.label}</span>
                {packageKey === p.key ? <Badge color="indigo">Kiválasztva</Badge> : null}
              </span>
              <p className="mt-2 text-xs text-zinc-500">{p.description}</p>
              {p.custom ? (
                <span className="mt-3 text-sm font-semibold text-zinc-700">Egyedi ajánlat</span>
              ) : (
                <>
                  <span className="mt-3 text-xs font-medium uppercase text-zinc-400">Havidíj</span>
                  <span className="text-lg font-bold text-brand-text">{formatHUF(p.monthlyFee)}</span>
                  <span className="mt-1 text-xs font-medium uppercase text-zinc-400">Setup</span>
                  <span className="text-sm font-semibold text-zinc-700">{formatHUF(p.setupFee)}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {pkg?.custom ? (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">
            <label className="text-sm font-medium text-zinc-700">
              Egyedi havidíj (Ft)
              <input
                name="customMonthlyFee"
                type="number"
                min={0}
                value={customMonthlyFee}
                onChange={(e) => setCustomMonthlyFee(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Egyedi setup díj (Ft)
              <input
                name="customSetupFee"
                type="number"
                min={0}
                value={customSetupFee}
                onChange={(e) => setCustomSetupFee(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
              />
            </label>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">⚡ Lezárás</h2>
        <label className="block text-sm font-medium text-zinc-700">
          Szerződés aláírva
          <input name="contractSignedAt" type="date" className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none" />
        </label>
        <p className="mt-1 text-xs text-zinc-500">A befizetési rekord automatikusan létrejön a megadott dátummal, holnaptól lejártnak jelenik meg a dashboard-on, míg be nem pipálod.</p>

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Belső megjegyzés (opcionális)
          <textarea name="internalNote" rows={2} placeholder="Meeting összefoglaló, speciális kérések, stb." className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none" />
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Projekt leírás
          <textarea name="projectNote" rows={2} placeholder="Milyen projektet kell fejleszteni? (rövid leírás)" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none" />
        </label>
      </Card>

      <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="text-sm text-zinc-600">
          Összesen: <span className="font-semibold text-brand-text">{formatHUF(monthlyFee)} / hó</span> + <span className="font-semibold text-brand-text">{formatHUF(setupFee)} setup</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/ugyfelek" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Mégse
          </Link>
          <button type="submit" className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-white hover:bg-brand-gold-dark">
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
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
      />
    </label>
  );
}
