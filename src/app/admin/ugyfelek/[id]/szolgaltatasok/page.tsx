import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { updateFeatureFlagsAction } from "@/lib/actions/account-actions";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, labelFor } from "@/lib/enums";

export default async function AccountServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [account, projects] = await Promise.all([
    prisma.account.findUnique({ where: { id } }),
    prisma.project.findMany({ where: { accountId: id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!account) notFound();

  const flags = JSON.parse(account.featureFlags) as { crm: boolean; calendar: boolean };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Modul-kapcsolók</h2>
        <form action={updateFeatureFlagsAction.bind(null, id)} className="space-y-3">
          <Toggle name="crm" label="CRM modul aktív" defaultChecked={flags.crm} />
          <Toggle name="calendar" label="Naptár modul aktív" defaultChecked={flags.calendar} />
          <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">Mentés</button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Projektek</h2>
        </div>
        {projects.length === 0 ? (
          <EmptyState text="Nincs még projekt ehhez az ügyfélhez" />
        ) : (
          <div className="space-y-2">
            {projects.map((p) => {
              const category = PROJECT_CATEGORIES.find((c) => c.key === p.category);
              return (
                <Link
                  key={p.id}
                  href={`/admin/projektek/${category?.slug ?? ""}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  <span>
                    {p.title} <span className="text-xs text-zinc-400">· {category?.label}</span>
                  </span>
                  <Badge color="indigo">{labelFor(PROJECT_STATUSES, p.status)}</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Webhook alapú lead-befogadás</h2>
        <p className="text-sm text-zinc-600">
          A CRM &rarr; Beállítások &rarr; Webhookok alatt generált egyedi URL-re bármely külső rendszer (form-builder,
          Zapier/Make, saját weboldal kontakt űrlapja) küldhet payloadot, ami automatikusan új Opportunity-t hoz
          létre a kiválasztott pipeline-ban és szakaszban.
        </p>
      </Card>
    </div>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm">
      {label}
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
    </label>
  );
}
