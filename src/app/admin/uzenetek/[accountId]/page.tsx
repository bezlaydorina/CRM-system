import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { sendStaffMessageAction } from "@/lib/actions/message-actions";

export default async function StaffMessageThreadPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) notFound();

  const conversation = await prisma.conversation.findUnique({
    where: { accountId },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { staff: true, clientContact: true } } },
  });

  return (
    <div>
      <PageHeader title={`Üzenetek – ${account.name}`} />
      <Card className="flex h-[60vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-2">
          {conversation?.messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderType === "STAFF" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-sm rounded-2xl px-3 py-2 text-sm ${m.senderType === "STAFF" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                <p>{m.body}</p>
                <p className={`mt-1 text-[10px] ${m.senderType === "STAFF" ? "text-indigo-200" : "text-zinc-400"}`}>
                  {m.senderType === "STAFF" ? m.staff?.name : m.clientContact?.fullName} ·{" "}
                  {m.createdAt.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {!conversation?.messages.length ? <p className="text-sm text-zinc-400">Még nincs üzenet.</p> : null}
        </div>
        <form action={sendStaffMessageAction.bind(null, accountId)} className="mt-2 flex gap-2 border-t border-zinc-100 pt-2">
          <input name="body" placeholder="Üzenet küldése..." required className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Küldés</button>
        </form>
      </Card>
    </div>
  );
}
