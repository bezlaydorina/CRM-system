"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NavLink } from "./nav-link";
import { impersonateAction, logoutAction } from "@/lib/actions/auth-actions";

type Member = {
  id: string;
  name: string;
  email: string;
  jobRole: string;
  avatarColor: string;
  systemRole: string;
};

type AccountLite = { id: string; name: string; status: string } | null;

export function AdminShell({
  member,
  accounts,
  impersonatedAccount,
  children,
}: {
  member: Member;
  accounts: { id: string; name: string; status: string }[];
  impersonatedAccount: AccountLite;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSales = pathname.startsWith("/admin/sales");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => accounts.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
    [accounts, query]
  );

  return (
    <div className="flex min-h-screen w-full bg-zinc-100">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-indigo-950 text-white">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold">S</div>
          <div>
            <p className="text-sm font-semibold leading-tight">Synk AI</p>
            <p className="text-[11px] text-indigo-300 leading-tight">Admin felület</p>
          </div>
        </div>

        <div className="mx-3 mb-3 flex rounded-lg bg-white/5 p-1 text-xs font-semibold">
          <Link
            href="/admin"
            className={`flex-1 rounded-md px-2 py-1.5 text-center ${!isSales ? "bg-indigo-500 text-white" : "text-indigo-300 hover:text-white"}`}
          >
            Service
          </Link>
          <Link
            href="/admin/sales"
            className={`flex-1 rounded-md px-2 py-1.5 text-center ${isSales ? "bg-indigo-500 text-white" : "text-indigo-300 hover:text-white"}`}
          >
            Sales
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {!isSales ? (
            <>
              <NavLink href="/admin" exact>
                Dashboard
              </NavLink>
              <NavLink href="/admin/uzenetek">Üzenetek</NavLink>
              <NavLink href="/admin/feladatok">Feladatok</NavLink>
              <NavLink href="/admin/jovahagyas">CSM Jóváhagyás</NavLink>
              <NavLink href="/admin/naptar">Naptár</NavLink>
              <NavLink href="/admin/ugyfelek">Ügyfelek</NavLink>
              <NavLink href="/admin/crm">CRM</NavLink>
              <NavLink href="/admin/fizetesek">Fizetések</NavLink>
              <NavLink href="/admin/szerzodesek">Szerződések</NavLink>
              <div className="my-2 border-t border-white/10" />
              <NavLink href="/admin/elakadt-kreativok">Elakadt kreatívok</NavLink>
              <NavLink href="/admin/winner-ads">Winner Ads</NavLink>
              <NavLink href="/admin/kreativ-sablonok">Kreatív sablonok</NavLink>
              <NavLink href="/admin/ai-creative">AI Creative</NavLink>
              <div className="my-2 border-t border-white/10" />
              <NavLink href="/admin/csapat">Csapat</NavLink>
              <NavLink href="/admin/uj-ugyfelek">Új ügyfelek</NavLink>
              <NavLink href="/admin/beallitasok">Beállítások</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/admin/sales" exact>
                Sales dashboard
              </NavLink>
              <NavLink href="/admin/sales/fizetesek">Payments</NavLink>
              <NavLink href="/admin/sales/szerzodesek">Szerződések</NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-2">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: member.avatarColor }}
            >
              {member.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{member.name}</p>
              <p className="truncate text-[11px] text-indigo-300">{member.jobRole}</p>
            </div>
            <form action={logoutAction}>
              <button title="Kijelentkezés" className="text-indigo-300 hover:text-white">
                ⏻
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
          <div className="relative w-80">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Admin nézet – keress ügyfelet..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            {open && query && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-zinc-400">Nincs találat</p>
                ) : (
                  filtered.map((a) => (
                    <form action={impersonateAction} key={a.id}>
                      <input type="hidden" name="accountId" value={a.id} />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                      >
                        <span>{a.name}</span>
                        <span className="text-[10px] text-zinc-400">{a.status === "ACTIVE" ? "Aktív" : "Archív"}</span>
                      </button>
                    </form>
                  ))
                )}
              </div>
            )}
          </div>

          {impersonatedAccount ? (
            <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
              👁 Nézet: {impersonatedAccount.name}
              <Link href="/portal" className="underline">
                Megnyitás
              </Link>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Bejelentkezve mint {member.systemRole === "ADMIN" ? "Admin" : member.jobRole}</p>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
