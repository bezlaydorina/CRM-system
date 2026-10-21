import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ContractsTable } from "@/components/finance/contracts-table";
import { resolveFileUrls } from "@/lib/storage";

export default async function SalesContractsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const contracts = await prisma.contract.findMany({
    where: { account: { isInternalSales: true } },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });
  const resolvedUrls = await resolveFileUrls(contracts.map((c) => c.documentUrl));
  const resolvedContracts = contracts.map((c) => ({ ...c, documentUrl: c.documentUrl ? resolvedUrls[c.documentUrl] ?? c.documentUrl : null }));

  return (
    <div>
      <PageHeader title="Sales · Szerződések" subtitle="The Code Zrt. saját aláírt szerződései" />
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error === "dropbox_sign_not_configured"
            ? "Az e-aláírás (Dropbox Sign) nincs beállítva – lásd a README-t a DROPBOX_SIGN_API_KEY env változóról."
            : error === "dropbox_sign_no_signer"
              ? "Az ügyfélnek nincs elsődleges kapcsolattartója email címmel."
              : "Az e-aláírásra küldés sikertelen volt, próbáld újra."}
        </div>
      ) : null}
      <ContractsTable contracts={resolvedContracts} />
    </div>
  );
}
