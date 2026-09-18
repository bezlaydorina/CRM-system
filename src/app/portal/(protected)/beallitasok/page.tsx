import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId, getSession } from "@/lib/auth";
import { PageHeader, Card, Badge } from "@/components/ui";
import {
  updateOwnProfileAction,
  invitePortalTeammateAction,
  removePortalTeammateAction,
} from "@/lib/actions/portal-settings-actions";

export default async function PortalSettingsPage() {
  const accountId = (await getEffectiveAccountId())!;
  const session = await getSession();
  const [account, contacts, me] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId } }),
    prisma.contact.findMany({ where: { accountId, canLoginPortal: true }, orderBy: { isPrimary: "desc" } }),
    session?.kind === "client" ? prisma.contact.findUnique({ where: { id: session.contactId } }) : null,
  ]);

  return (
    <div>
      <PageHeader title="Beállítások" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Saját profil</h2>
          {me ? (
            <form action={updateOwnProfileAction} className="space-y-2 text-sm">
              <label className="block">
                <span className="text-xs text-zinc-500">Név</span>
                <input name="fullName" defaultValue={me.fullName} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5" />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-500">Telefon</span>
                <input name="phone" defaultValue={me.phone ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5" />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-500">Email (nem módosítható)</span>
                <input disabled value={me.email ?? ""} className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-zinc-400" />
              </label>
              <button className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white">Mentés</button>
            </form>
          ) : (
            <p className="text-sm text-zinc-400">Admin nézetben nincs szerkeszthető profil.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Csapattagok</h2>
          <div className="space-y-1.5">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-1.5 text-sm">
                <span>
                  {c.fullName} <span className="text-xs text-zinc-400">· {c.email}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Badge color={c.accessLevel === "FULL" ? "green" : "gray"}>{c.accessLevel === "FULL" ? "Teljes hozzáférés" : "Korlátozott"}</Badge>
                  {!c.isPrimary ? (
                    <form action={removePortalTeammateAction.bind(null, c.id)}>
                      <button className="text-xs text-red-600 hover:underline">Törlés</button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <form action={invitePortalTeammateAction} className="mt-3 grid grid-cols-2 gap-2">
            <input name="fullName" placeholder="Név" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
            <input name="email" type="email" placeholder="Email" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
            <select name="accessLevel" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
              <option value="LIMITED">Korlátozott</option>
              <option value="FULL">Teljes hozzáférés</option>
            </select>
            <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">+ Meghívás</button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Megjelenés</h2>
          <p className="text-sm text-zinc-500">Világos / Sötét / Rendszer téma váltó – ebben az MVP-ben csak a felület van előkészítve, a sötét téma stílusai még nincsenek kidolgozva.</p>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Telepítsd appként</h2>
          <p className="text-sm text-zinc-500">
            Az ügyfélportál Progressive Web App (PWA) telepítést ebben az MVP-ben a manifest/service worker
            hiányában még nem támogatja – ez a következő fejlesztési kör (12.2/7. fázis) része.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Meta hirdetési fiók</h2>
          {account?.adsLive ? <Badge color="green">Csatlakoztatva (demó adat)</Badge> : <Badge color="gray">Nincs csatlakoztatva</Badge>}
        </Card>
      </div>
    </div>
  );
}
