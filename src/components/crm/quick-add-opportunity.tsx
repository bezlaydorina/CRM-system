"use client";

import { useState, useTransition } from "react";
import { createOpportunityAction } from "@/lib/actions/crm-actions";

export function QuickAddOpportunity({ accountId, stageId }: { accountId: string; stageId: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-zinc-300 px-2 py-1.5 text-xs font-medium text-zinc-500 hover:border-indigo-400 hover:text-indigo-600"
      >
        + Új opportunity
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await createOpportunityAction(accountId, stageId, fd);
          setOpen(false);
        })
      }
      className="space-y-1 rounded-lg border border-indigo-200 bg-white p-2 shadow-sm"
    >
      <input name="firstName" placeholder="Keresztnév *" required className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs" />
      <input name="phone" placeholder="Telefon" className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs" />
      <div className="flex gap-1">
        <button type="submit" className="flex-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
          Mentés
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-zinc-300 px-2 py-1 text-xs">
          ✕
        </button>
      </div>
    </form>
  );
}
