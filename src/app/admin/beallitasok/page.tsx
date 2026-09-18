import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { getCurrentTeamMember } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const member = await getCurrentTeamMember();
  const org = member ? await prisma.organization.findUnique({ where: { id: member.organizationId } }) : null;

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
      </div>
    </div>
  );
}
