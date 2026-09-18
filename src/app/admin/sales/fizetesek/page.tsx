import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { PaymentsTable } from "@/components/finance/payments-table";

export default async function SalesPaymentsPage() {
  const payments = await prisma.payment.findMany({
    where: { account: { isInternalSales: true } },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Sales · Payments" subtitle="Synk AI Zrt. saját fizetési linkjei a prospektek felé" />
      <PaymentsTable payments={payments} />
    </div>
  );
}
