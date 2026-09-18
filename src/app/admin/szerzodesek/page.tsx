import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { ContractsTable } from "@/components/finance/contracts-table";
import { createContractAction } from "@/lib/actions/finance-actions";

export default async function ContractsPage() {
  const [contracts, accounts] = await Promise.all([
    prisma.contract.findMany({ where: { account: { isInternalSales: false } }, include: { account: true }, orderBy: { createdAt: "desc" } }),
    prisma.account.findMany({ where: { isInternalSales: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Szerződések" subtitle="E-aláírás követés – sablon, kiküldés, aláírás" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ContractsTable contracts={contracts} />
        </div>
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">+ Új szerződés</h3>
          <form action={createContractAction} className="flex flex-col gap-2 text-sm">
            <select name="accountId" required className="rounded-lg border border-zinc-300 px-2 py-1.5">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input name="amount" type="number" placeholder="Összeg (Ft)" required className="rounded-lg border border-zinc-300 px-2 py-1.5" />
            <input name="templateName" placeholder="Sablon neve" defaultValue="Alap szolgáltatási szerződés" className="rounded-lg border border-zinc-300 px-2 py-1.5" />
            <button className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white">Létrehozás (Konfigurátor)</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
