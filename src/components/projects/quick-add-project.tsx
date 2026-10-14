"use client";

import { useState, useTransition } from "react";
import { createProjectAction } from "@/lib/actions/project-actions";

export function QuickAddProject({
  categoryKey,
  categorySlug,
  accounts,
  teamMembers,
}: {
  categoryKey: string;
  categorySlug: string;
  accounts: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-gold px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-gold-dark"
      >
        + Új projekt
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await createProjectAction(String(fd.get("accountId")), categoryKey, categorySlug, fd);
          setOpen(false);
        })
      }
      className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-brand-gold/30 bg-brand-gold/10/50 p-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      <select name="accountId" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
        <option value="">Ügyfél...</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input name="title" placeholder="Projekt neve *" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm sm:col-span-2" />
      <input name="budget" type="number" placeholder="Büdzsé (Ft)" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
      <input name="deadline" type="date" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
      <select name="assigneeId" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
        <option value="">Felelős...</option>
        {teamMembers.map((tm) => (
          <option key={tm.id} value={tm.id}>
            {tm.name}
          </option>
        ))}
      </select>
      <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
        <button type="submit" className="rounded-lg bg-brand-gold px-3 py-1.5 text-sm font-semibold text-white">
          Létrehozás
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
          Mégse
        </button>
      </div>
    </form>
  );
}
