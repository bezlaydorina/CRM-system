import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ContractsTable } from "@/components/finance/contracts-table";

export default async function SalesContractsPage() {
  const contracts = await prisma.contract.findMany({
    where: { account: { isInternalSales: true } },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Sales · Szerződések" subtitle="Synk AI Zrt. saját aláírt szerződései" />
      <ContractsTable contracts={contracts} />
    </div>
  );
}
