import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ApprovalQueue } from "@/components/approvals/approval-queue";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { APPROVAL_TYPES } from "@/lib/enums";

export default async function CsmApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; state?: string; accountId?: string }>;
}) {
  const { type = "CREATIVE", state = "internal", accountId = "" } = await searchParams;

  const [items, accounts] = await Promise.all([
    prisma.approvalItem.findMany({
      where: {
        type,
        accountId: accountId || undefined,
        status: state === "internal" ? { in: ["PENDING_INTERNAL", "DRAFT"] } : "PENDING_CLIENT",
      },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.account.findMany({ where: { isInternalSales: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="CSM Jóváhagyás" subtitle="Belső minőségkapu az ügyfélnek kiküldött tartalmakhoz" />

      <div className="mb-3 flex flex-wrap gap-2">
        {APPROVAL_TYPES.map((t) => (
          <Link
            key={t.key}
            href={`/admin/jovahagyas?type=${t.key}&state=${state}&accountId=${accountId}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              type === t.key ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex rounded-lg border border-zinc-300 p-0.5 text-sm">
          <Link href={`/admin/jovahagyas?type=${type}&state=internal&accountId=${accountId}`} className={`rounded-md px-3 py-1 ${state === "internal" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>
            Nálam áll
          </Link>
          <Link href={`/admin/jovahagyas?type=${type}&state=client&accountId=${accountId}`} className={`rounded-md px-3 py-1 ${state === "client" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}>
            Ügyfélnél áll
          </Link>
        </div>
        <form>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="state" value={state} />
          <AutoSubmitSelect name="accountId" defaultValue={accountId} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
            <option value="">Összes ügyfél</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </form>
      </div>

      <ApprovalQueue
        mode="staff"
        items={items.map((i) => ({
          id: i.id,
          title: i.title,
          type: i.type,
          status: i.status,
          fileUrl: i.fileUrl,
          accountName: i.account.name,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
