import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900", className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  gray: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  indigo: "bg-brand-gold/15 text-brand-gold-dark",
  green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

export function Badge({ children, color = "gray" }: { children: ReactNode; color?: keyof typeof BADGE_COLORS }) {
  return <span className={clsx("badge", BADGE_COLORS[color])}>{children}</span>;
}

export function Avatar({ name, color, size = 8 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: color, width: `${size * 4}px`, height: `${size * 4}px` }}
      title={name}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function StubNotice({ feature }: { feature: string }) {
  return (
    <Card className="border-dashed bg-zinc-50 text-center">
      <p className="text-sm font-semibold text-zinc-600">🚧 {feature} – fejlesztés alatt</p>
      <p className="mt-1 text-xs text-zinc-500">
        Ez a modul valós 3rd-party integrációt (pl. AI kép/szöveggenerálás) igényelne, amihez ebben a
        demóban nincs élő API-kulcs. A funkció felülete és adatmodellje elő van készítve, hogy egy API-kulcs
        birtokában könnyen bekapcsolható legyen.
      </p>
    </Card>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">{text}</p>;
}
