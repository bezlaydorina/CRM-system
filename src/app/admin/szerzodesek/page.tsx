import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { ContractsTable } from "@/components/finance/contracts-table";
import { createContractAction } from "@/lib/actions/finance-actions";
import { resolveFileUrls } from "@/lib/storage";

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [contracts, accounts] = await Promise.all([
    prisma.contract.findMany({ where: { account: { isInternalSales: false } }, include: { account: true }, orderBy: { createdAt: "desc" } }),
    prisma.account.findMany({ where: { isInternalSales: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const resolvedUrls = await resolveFileUrls(contracts.map((c) => c.documentUrl));
  const resolvedContracts = contracts.map((c) => ({ ...c, documentUrl: c.documentUrl ? resolvedUrls[c.documentUrl] ?? c.documentUrl : null }));

  return (
    <div>
      <PageHeader title="Szerződések" subtitle="E-aláírás követés – sablon, kiküldés, aláírás" />
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error === "dropbox_sign_not_configured"
            ? "Az e-aláírás (Dropbox Sign) nincs beállítva – lásd a README-t a DROPBOX_SIGN_API_KEY env változóról."
            : error === "dropbox_sign_no_signer"
              ? "Az ügyfélnek nincs elsődleges kapcsolattartója email címmel – add meg előbb az Ügyfelek oldalon."
              : "Az e-aláírásra küldés sikertelen volt, próbáld újra."}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ContractsTable contracts={resolvedContracts} />
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
            <button className="rounded-lg bg-brand-gold px-3 py-1.5 font-semibold text-white">Létrehozás (Konfigurátor)</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
