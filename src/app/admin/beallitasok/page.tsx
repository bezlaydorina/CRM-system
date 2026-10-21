import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui";
import { getCurrentTeamMember } from "@/lib/auth";
import { CUSTOM_FIELD_TYPES } from "@/lib/enums";
import { addIntakeFieldAction, deleteIntakeFieldAction } from "@/lib/actions/intake-actions";

export default async function AdminSettingsPage() {
  const member = await getCurrentTeamMember();
  const [org, salesFields, onboardingFields] = await Promise.all([
    member ? prisma.organization.findUnique({ where: { id: member.organizationId } }) : null,
    member ? prisma.intakeFormFieldDefinition.findMany({ where: { organizationId: member.organizationId, formKey: "SALES_INTAKE" }, orderBy: { order: "asc" } }) : [],
    member ? prisma.intakeFormFieldDefinition.findMany({ where: { organizationId: member.organizationId, formKey: "ONBOARDING" }, orderBy: { order: "asc" } }) : [],
  ]);

  return (
    <div>
      <PageHeader title="Beállítások" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Ügynökség</h2>
          <p className="text-sm text-zinc-600">Név: {org?.name}</p>
          <p className="mt-1 text-xs text-zinc-400">Az ügynökség szintű brand/logó/domain testreszabás ebben az MVP-ben nincs implementálva.</p>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Saját profil</h2>
          <p className="text-sm text-zinc-600">{member?.name}</p>
          <p className="text-xs text-zinc-400">{member?.email} · {member?.jobRole}</p>
        </Card>
        <IntakeFieldManager formKey="SALES_INTAKE" title="Értékesítési felvétel mezői" fields={salesFields} />
        <IntakeFieldManager formKey="ONBOARDING" title="Onboarding kérdőív mezői" fields={onboardingFields} />
      </div>
    </div>
  );
}

function IntakeFieldManager({ formKey, title, fields }: { formKey: string; title: string; fields: { id: string; name: string; type: string; section: string }[] }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h2>
      <div className="space-y-1.5">
        {fields.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-1.5 text-sm">
            <span>
              {f.name} <span className="text-xs text-zinc-400">· {f.section}</span>
            </span>
            <div className="flex items-center gap-2">
              <Badge color="gray">{CUSTOM_FIELD_TYPES.find((t) => t.key === f.type)?.label}</Badge>
              <form action={deleteIntakeFieldAction.bind(null, f.id)}>
                <button className="text-xs text-red-600 hover:underline">Törlés</button>
              </form>
            </div>
          </div>
        ))}
        {fields.length === 0 ? <p className="text-xs text-zinc-400">Még nincs mező – add hozzá az elsőt lent.</p> : null}
      </div>
      <form action={addIntakeFieldAction.bind(null, formKey)} className="mt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input name="name" placeholder="Mező neve..." className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
          <select name="type" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
            {CUSTOM_FIELD_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="section" placeholder="Szakasz (form-szekció)" defaultValue="Általános" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
          <input name="options" placeholder="Opciók (vesszővel, SELECT-hez)" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
        </div>
        <button className="w-full rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">+ Mező hozzáadása</button>
      </form>
    </Card>
  );
}
