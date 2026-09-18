"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  archiveAccountAction,
  changePortalPasswordAction,
  deleteAccountAction,
} from "@/lib/actions/account-actions";

export function AccountActionsMenu({ accountId, primaryContactId }: { accountId: string; primaryContactId?: string }) {
  const [open, setOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
      >
        ⋯
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
          {!showPasswordForm ? (
            <>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-50"
                disabled={!primaryContactId}
              >
                Jelszó módosítása
              </button>
              <form action={() => { setOpen(false); return archiveAccountAction(accountId); }}>
                <button className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-50">Archiválás</button>
              </form>
              <form
                action={() => {
                  if (confirm("Biztosan véglegesen törlöd ezt az ügyfelet? Ez nem visszavonható.")) {
                    return deleteAccountAction(accountId);
                  }
                  router.refresh();
                }}
              >
                <button className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50">
                  Végleges törlés
                </button>
              </form>
            </>
          ) : (
            <form action={changePortalPasswordAction.bind(null, accountId)} className="flex flex-col gap-2 p-1">
              <input type="hidden" name="contactId" value={primaryContactId} />
              <label className="text-xs font-medium text-zinc-600">
                Új portál jelszó
                <input
                  name="newPassword"
                  type="text"
                  minLength={4}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
                />
              </label>
              <button
                type="submit"
                onClick={() => {
                  setOpen(false);
                  setShowPasswordForm(false);
                }}
                className="rounded-md bg-indigo-600 px-2 py-1 text-sm font-medium text-white"
              >
                Mentés
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
