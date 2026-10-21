import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui";
import { getCurrentTeamMember } from "@/lib/auth";
import { CUSTOM_FIELD_TYPES } from "@/lib/enums";
import { addIntakeFieldAction, deleteIntakeFieldAction } from "@/lib/actions/intake-actions";
import { updateOrganizationBrandingAction } from "@/lib/actions/org-actions";
import { ThemeToggle } from "@/components/theme-toggle";

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
          <form action={updateOrganizationBrandingAction} className="mt-3 space-y-3 border-t border-zinc-100 pt-3">
            <div className="flex items-center gap-3">
              {org?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- felhasználó által feltöltött, nem build-időben ismert méretű logó
                <img src={org.logoUrl} alt="Logó" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold text-sm font-bold text-white">{org?.name?.slice(0, 1) ?? "T"}</div>
              )}
              <label className="text-xs font-medium text-zinc-600">
                Logó csere
                <input name="logo" type="file" accept="image/*" className="mt-1 block text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs" />
              </label>
            </div>
            <label className="block text-xs font-medium text-zinc-600">
              Elsődleges márkaszín
              <div className="mt-1 flex items-center gap-2">
                <input name="primaryColor" type="color" defaultValue={org?.primaryColor ?? "#4a102a"} className="h-8 w-12 rounded border border-zinc-300" />
                <span className="font-mono text-xs text-zinc-500">{org?.primaryColor ?? "#4a102a (alapértelmezett)"}</span>
              </div>
            </label>
            <label className="block text-xs font-medium text-zinc-600">
              Egyedi domain
              <input name="customDomain" defaultValue={org?.customDomain ?? ""} placeholder="crm.ugynokseged.hu" className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
            </label>
            <p className="text-xs text-zinc-400">
              A domain itt csak rögzítésre kerül - a tényleges DNS-kötéshez add hozzá ugyanezt a domaint a Vercel
              projekt &quot;Domains&quot; beállításainál, és állítsd be a kért DNS rekordot a domain-szolgáltatódnál.
            </p>
            <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">Mentés</button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Saját profil</h2>
          <p className="text-sm text-zinc-600">{member?.name}</p>
          <p className="text-xs text-zinc-400">{member?.email} · {member?.jobRole}</p>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Megjelenés</h2>
          <ThemeToggle />
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
