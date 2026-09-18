import { Card, Badge, EmptyState } from "@/components/ui";
import { formatHUF, labelFor, CONTRACT_STATUSES } from "@/lib/enums";
import { updateContractStatusAction } from "@/lib/actions/finance-actions";

type ContractRow = {
  id: string;
  amount: number;
  status: string;
  templateName: string;
  createdAt: Date;
  signedAt: Date | null;
  account: { name: string };
};

export function ContractsTable({ contracts }: { contracts: ContractRow[] }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-2">Ügyfél</th>
            <th className="px-4 py-2">Összeg</th>
            <th className="px-4 py-2">Sablon</th>
            <th className="px-4 py-2">Állapot</th>
            <th className="px-4 py-2">Dátum</th>
            <th className="px-4 py-2">Akciók</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {contracts.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-2 font-medium text-zinc-800">{c.account.name}</td>
              <td className="px-4 py-2">{formatHUF(c.amount)}</td>
              <td className="px-4 py-2 text-zinc-500">{c.templateName}</td>
              <td className="px-4 py-2">
                <Badge color={c.status === "SIGNED" ? "green" : c.status === "VIEWED" ? "amber" : "gray"}>
                  {labelFor(CONTRACT_STATUSES, c.status)}
                </Badge>
              </td>
              <td className="px-4 py-2 text-zinc-500">{(c.signedAt ?? c.createdAt).toLocaleDateString("hu-HU")}</td>
              <td className="px-4 py-2">
                <div className="flex gap-2 text-xs">
                  <span className="text-zinc-400">Konfigurátor</span>
                  <span className="text-zinc-400">Letöltés</span>
                  {c.status === "DRAFT" ? (
                    <form action={updateContractStatusAction.bind(null, c.id, "SENT")}>
                      <button className="text-indigo-600 hover:underline">Elküldés</button>
                    </form>
                  ) : null}
                  {c.status === "SENT" ? (
                    <form action={updateContractStatusAction.bind(null, c.id, "VIEWED")}>
                      <button className="text-indigo-600 hover:underline">Megtekintve</button>
                    </form>
                  ) : null}
                  {c.status === "VIEWED" ? (
                    <form action={updateContractStatusAction.bind(null, c.id, "SIGNED")}>
                      <button className="text-emerald-600 hover:underline">Aláírva</button>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {contracts.length === 0 ? <EmptyState text="Nincs szerződés" /> : null}
    </Card>
  );
}
