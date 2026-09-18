import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Avatar } from "@/components/ui";
import { createCalendarEventAction } from "@/lib/actions/calendar-actions";
import { hoursAgo } from "@/lib/date-helpers";

const EVENT_TYPE_LABELS: Record<string, string> = {
  STRATEGY_CALL: "Stratégiai hívás",
  ONBOARDING: "Onboarding",
  CONVERSATION: "Beszélgetés",
};

export default async function CalendarPage() {
  const [events, teamMembers, accounts] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { startAt: { gte: hoursAgo(24) } },
      orderBy: { startAt: "asc" },
      take: 40,
      include: { teamMember: true, account: true },
    }),
    prisma.teamMember.findMany({ orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { isInternalSales: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const notConnected = teamMembers.filter((m) => !m.googleCalendarConnected);
  const affectedEvents = events.filter((e) => e.teamMember && !e.teamMember.googleCalendarConnected);

  const grouped = events.reduce<Record<string, typeof events>>((acc, e) => {
    const key = e.startAt.toLocaleDateString("hu-HU", { weekday: "short", month: "short", day: "numeric" });
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Naptár" subtitle="Közös csapat-naptár – sales és service csapat egyben" />

      {notConnected.length > 0 && affectedEvents.length > 0 ? (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">⚠ Nincs Google Calendar összekapcsolva:</p>
          <p className="mt-1 text-xs text-amber-700">
            {notConnected.map((m) => m.name).join(", ")} – ezeknél a foglalásoknál nem generálódik valódi Meet-link.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-700">
            {affectedEvents.map((e) => (
              <li key={e.id}>
                {e.title} · {e.teamMember?.name} · {e.startAt.toLocaleString("hu-HU")}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Object.entries(grouped).map(([day, dayEvents]) => (
            <Card key={day}>
              <h3 className="mb-2 text-sm font-semibold text-zinc-700">{day}</h3>
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      {e.teamMember ? <Avatar name={e.teamMember.name} color={e.teamMember.avatarColor} size={6} /> : null}
                      <div>
                        <p className="font-medium text-zinc-800">{e.title}</p>
                        <p className="text-xs text-zinc-500">
                          {e.startAt.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                          {e.account?.name ?? "Belső"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color="indigo">{EVENT_TYPE_LABELS[e.type] ?? e.type}</Badge>
                      {e.meetLink ? (
                        <a href={e.meetLink} className="text-xs text-emerald-600 hover:underline">
                          Meet link
                        </a>
                      ) : (
                        <Badge color="red">Nincs Meet</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {events.length === 0 ? <Card>Nincs közelgő időpont.</Card> : null}
        </div>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">Új időpont</h3>
          <form action={createCalendarEventAction} className="flex flex-col gap-2 text-sm">
            <input name="title" placeholder="Esemény címe" required className="rounded-lg border border-zinc-300 px-2 py-1.5" />
            <select name="type" className="rounded-lg border border-zinc-300 px-2 py-1.5">
              <option value="CONVERSATION">Beszélgetés</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="STRATEGY_CALL">Stratégiai hívás</option>
            </select>
            <select name="teamMemberId" className="rounded-lg border border-zinc-300 px-2 py-1.5">
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select name="accountId" className="rounded-lg border border-zinc-300 px-2 py-1.5">
              <option value="">Nincs kapcsolódó ügyfél</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input name="startAt" type="datetime-local" required className="rounded-lg border border-zinc-300 px-2 py-1.5" />
            <button className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white">Foglalás létrehozása</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
