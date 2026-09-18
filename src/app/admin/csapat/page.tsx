import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Avatar } from "@/components/ui";
import { TEAM_ROLES } from "@/lib/enums";
import { createTeamMemberAction } from "@/lib/actions/team-actions";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const members = await prisma.teamMember.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { jobRole: { contains: q } }] }
      : undefined,
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Csapat" subtitle={`${members.length} csapattag`} />

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Keresés név vagy szerepkör szerint..."
          className="w-72 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        />
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {members.map((m) => (
          <Card key={m.id} className="text-center">
            <div className="mx-auto mb-2">
              <Avatar name={m.name} color={m.avatarColor} size={14} />
            </div>
            <p className="text-sm font-semibold text-zinc-800">{m.name}</p>
            <p className="text-xs text-indigo-600">{m.jobRole}</p>
            <p className="mt-1 text-[11px] text-zinc-400">{m.email}</p>
            <p className="text-[11px] text-zinc-400">{m.phone ?? "—"}</p>
          </Card>
        ))}

        <Card className="flex items-center justify-center border-dashed">
          <details className="w-full text-center">
            <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Új csapattag</summary>
            <form action={createTeamMemberAction} className="mt-3 flex flex-col gap-2 text-left">
              <input name="name" placeholder="Név" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
              <input name="email" type="email" placeholder="Email" required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
              <input name="phone" placeholder="Telefon" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
              <select name="jobRole" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
                {TEAM_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Létrehozás</button>
            </form>
          </details>
        </Card>
      </div>
    </div>
  );
}
