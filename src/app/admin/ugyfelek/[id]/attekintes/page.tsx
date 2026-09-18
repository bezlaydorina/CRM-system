import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatHUF, TEAM_ROLES } from "@/lib/enums";
import { addContactAction, addAccountNoteAction } from "@/lib/actions/account-actions";
import { TeamAssignmentRow } from "@/components/accounts/team-assignment-row";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

export default async function AccountOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [account, teamMembers, approvals, activity] = await Promise.all([
    prisma.account.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { isPrimary: "desc" } },
        assignments: { include: { teamMember: true } },
        fileAssets: true,
        reports: true,
      },
    }),
    prisma.teamMember.findMany({ orderBy: { name: "asc" } }),
    prisma.approvalItem.findMany({ where: { accountId: id } }),
    prisma.activityLogEntry.findMany({ where: { accountId: id }, orderBy: { createdAt: "desc" }, take: 15, include: { actor: true } }),
  ]);
  if (!account) notFound();

  const creativesDelivered = approvals.filter((a) => a.type === "CREATIVE" && a.status === "APPROVED").length;
  const copiesDelivered = approvals.filter((a) => a.type === "AD_COPY" && a.status === "APPROVED").length;
  const landingsDelivered = approvals.filter((a) => a.type === "LANDING" && a.status === "APPROVED").length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Kapcsolattartók</h2>
          </div>
          <div className="space-y-2">
            {account.contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {c.fullName} {c.isPrimary ? <Badge color="indigo">Elsődleges</Badge> : null}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {c.position ?? "—"} · {c.email ?? "—"} · {c.phone ?? "—"}
                  </p>
                </div>
                {c.canLoginPortal ? <Badge color="green">Portál hozzáférés</Badge> : null}
              </div>
            ))}
          </div>
          <form action={addContactAction.bind(null, id)} className="mt-3 grid grid-cols-4 gap-2">
            <input name="fullName" placeholder="Név" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
            <input name="position" placeholder="Pozíció" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
            <input name="email" placeholder="Email" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
            <button className="rounded-lg bg-zinc-900 px-2 py-1.5 text-sm font-medium text-white">+ Új</button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Mit kapott meg az ügyfél</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-semibold text-indigo-600">{creativesDelivered}</p>
              <p className="text-xs text-zinc-500">Kiadott kreatív</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-indigo-600">{copiesDelivered}</p>
              <p className="text-xs text-zinc-500">Kiadott szöveg</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-indigo-600">{landingsDelivered}</p>
              <p className="text-xs text-zinc-500">Landing oldal</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Aktivitás</h2>
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start justify-between text-sm">
                <p className="text-zinc-700">
                  {a.actor ? <span className="font-medium">{a.actor.name}: </span> : null}
                  {a.message}
                </p>
                <span className="whitespace-nowrap text-xs text-zinc-400">
                  {formatDistanceToNow(a.createdAt, { locale: hu, addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
          <form action={addAccountNoteAction.bind(null, id)} className="mt-3 flex gap-2">
            <input name="body" placeholder="Új jegyzet hozzáadása..." className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm" required />
            <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">Mentés</button>
          </form>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Kulcsadatok</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Weboldal" value={account.website ?? "—"} />
            <Row label="Havi díj" value={formatHUF(account.monthlyFee)} />
            <Row label="Hirdetési keret" value={formatHUF(account.monthlyAdBudget)} />
            <Row label="Kezdés" value={account.startDate ? account.startDate.toLocaleDateString("hu-HU") : "—"} />
            <Row label="Hirdetések indultak" value={account.adsLive ? "Igen" : "Nem"} />
            <Row label="Utolsó befizetés" value={account.lastPaymentAt ? account.lastPaymentAt.toLocaleDateString("hu-HU") : "—"} />
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Csapat</h2>
          <div className="space-y-2">
            {TEAM_ROLES.filter((r) => r !== "Admin").map((role) => {
              const current = account.assignments.find((a) => a.role === role);
              return (
                <TeamAssignmentRow key={role} accountId={id} role={role} current={current} teamMembers={teamMembers} />
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-800">{value}</dd>
    </div>
  );
}
