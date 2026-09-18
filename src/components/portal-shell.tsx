import type { Account, Contact } from "@prisma/client";
import { NavLink } from "./nav-link";
import { logoutAction, stopImpersonationAction } from "@/lib/actions/auth-actions";

export function PortalShell({
  account,
  contact,
  isImpersonating,
  children,
}: {
  account: Account;
  contact: Contact | null;
  isImpersonating: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-zinc-100">
      <aside className="flex w-60 flex-shrink-0 flex-col bg-emerald-950 text-white">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold">
            {account.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="truncate text-sm font-semibold leading-tight">{account.name}</p>
            <p className="text-[11px] text-emerald-300 leading-tight">Ügyfélportál</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          <NavLink href="/portal" exact>
            Kezdőlap
          </NavLink>
          <NavLink href="/portal/asszisztens">Synk AI asszisztens</NavLink>
          <NavLink href="/portal/riportok">Riportok</NavLink>
          <NavLink href="/portal/jovahagyasok">Jóváhagyások</NavLink>
          <NavLink href="/portal/uzenetek">Üzenetek</NavLink>
          <NavLink href="/portal/fajlok">Képek feltöltése</NavLink>
          <NavLink href="/portal/crm">CRM</NavLink>
          <NavLink href="/portal/affiliate">Affiliate</NavLink>
          <NavLink href="/portal/beallitasok">Beállítások</NavLink>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{contact?.fullName ?? "Admin nézet"}</p>
              <p className="truncate text-[11px] text-emerald-300">{contact?.email ?? "impersonáció"}</p>
            </div>
            {!isImpersonating ? (
              <form action={logoutAction}>
                <button title="Kijelentkezés" className="text-emerald-300 hover:text-white">
                  ⏻
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {isImpersonating ? (
          <div className="flex items-center justify-between bg-amber-100 px-6 py-2 text-sm text-amber-800">
            <span>👁 Admin nézetben vagy – ezt látja: {account.name}</span>
            <form action={stopImpersonationAction}>
              <button className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                Vissza a saját főoldalra
              </button>
            </form>
          </div>
        ) : null}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
