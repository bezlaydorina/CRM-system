import { Card, Badge, EmptyState } from "@/components/ui";
import { formatHUF, labelFor, PAYMENT_STATUSES } from "@/lib/enums";
import { updatePaymentStatusAction } from "@/lib/actions/finance-actions";

type PaymentRow = {
  id: string;
  amount: number;
  type: string;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
  account: { name: string };
};

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <Card className="overflow-x-auto p-0">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 text-xs text-zinc-500">
        <span>{payments.length} tétel</span>
        <span className="font-semibold text-zinc-700">Összesen: {formatHUF(total)}</span>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-2">Ügyfél</th>
            <th className="px-4 py-2">Összeg</th>
            <th className="px-4 py-2">Típus</th>
            <th className="px-4 py-2">Állapot</th>
            <th className="px-4 py-2">Dátum</th>
            <th className="px-4 py-2">Link</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-2 font-medium text-zinc-800">{p.account.name}</td>
              <td className="px-4 py-2">{formatHUF(p.amount)}</td>
              <td className="px-4 py-2 text-zinc-500">{p.type === "ONE_TIME" ? "Egyszeri" : p.type === "MONTHLY" ? "Havi" : "Előleg"}</td>
              <td className="px-4 py-2">
                <Badge color={p.status === "PAID" ? "green" : p.status === "EXPIRED" ? "red" : "amber"}>
                  {labelFor(PAYMENT_STATUSES, p.status)}
                </Badge>
              </td>
              <td className="px-4 py-2 text-zinc-500">{p.dueDate ? p.dueDate.toLocaleDateString("hu-HU") : "—"}</td>
              <td className="px-4 py-2 text-xs text-indigo-500">fizetési link</td>
              <td className="px-4 py-2">
                <div className="flex gap-1">
                  {p.status !== "PAID" ? (
                    <form action={updatePaymentStatusAction.bind(null, p.id, "PAID")}>
                      <button className="text-xs text-emerald-600 hover:underline">Fizetve</button>
                    </form>
                  ) : null}
                  {p.status === "CREATED" ? (
                    <form action={updatePaymentStatusAction.bind(null, p.id, "SENT")}>
                      <button className="text-xs text-indigo-600 hover:underline">Elküldve</button>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 ? <EmptyState text="Nincs fizetési link" /> : null}
    </Card>
  );
}
