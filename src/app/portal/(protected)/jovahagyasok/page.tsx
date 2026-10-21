import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ApprovalQueue } from "@/components/approvals/approval-queue";
import { APPROVAL_TYPES } from "@/lib/enums";
import { resolveFileUrls } from "@/lib/storage";
import Link from "next/link";

export default async function PortalApprovalsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const accountId = (await getEffectiveAccountId())!;
  const { type = "CREATIVE" } = await searchParams;

  const items = await prisma.approvalItem.findMany({
    where: { accountId, type, status: { in: ["PENDING_CLIENT", "APPROVED", "REJECTED"] } },
    orderBy: { createdAt: "desc" },
  });
  const resolvedUrls = await resolveFileUrls(items.map((i) => i.fileUrl));

  return (
    <div>
      <PageHeader title="Jóváhagyások" subtitle="Nézd át és hagyd jóvá a hozzád kiküldött anyagokat" />
      <div className="mb-4 flex gap-2">
        {APPROVAL_TYPES.filter((t) => t.key !== "IMAGE").map((t) => (
          <Link
            key={t.key}
            href={`/portal/jovahagyasok?type=${t.key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${type === t.key ? "bg-brand-gold text-white" : "bg-zinc-100 text-zinc-600"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <ApprovalQueue
        mode="client"
        items={items.map((i) => ({ id: i.id, title: i.title, type: i.type, status: i.status, fileUrl: i.fileUrl ? resolvedUrls[i.fileUrl] ?? i.fileUrl : null, createdAt: i.createdAt.toISOString() }))}
      />
    </div>
  );
}
