import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { sendClientMessageAction } from "@/lib/actions/message-actions";

export default async function PortalMessagesPage() {
  const accountId = (await getEffectiveAccountId())!;
  const conversation = await prisma.conversation.findUnique({
    where: { accountId },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { staff: true, clientContact: true } } },
  });

  return (
    <div>
      <PageHeader title="Üzenetek" subtitle="Synk AI csapat · online" />
      <Card className="flex h-[65vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-2">
          {conversation?.messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderType === "CLIENT" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-sm rounded-2xl px-3 py-2 text-sm ${m.senderType === "CLIENT" ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                <p>{m.body}</p>
                <p className={`mt-1 text-[10px] ${m.senderType === "CLIENT" ? "text-emerald-100" : "text-zinc-400"}`}>
                  {m.senderType === "CLIENT" ? m.clientContact?.fullName : m.staff?.name ?? "Synk AI csapat"} ·{" "}
                  {m.createdAt.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {!conversation?.messages.length ? <p className="text-sm text-zinc-400">Még nincs üzenet – írj a csapatnak!</p> : null}
        </div>
        <form action={sendClientMessageAction} className="mt-2 flex gap-2 border-t border-zinc-100 pt-2">
          <input name="body" placeholder="Üzenet írása..." required className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Küldés</button>
        </form>
      </Card>
    </div>
  );
}
