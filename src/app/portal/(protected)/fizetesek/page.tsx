import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { formatHUF, labelFor, PAYMENT_STATUSES, PAYMENT_TYPES } from "@/lib/enums";
import { startPaymentCheckoutAction } from "@/lib/actions/payment-checkout-actions";

export default async function PortalPaymentsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const accountId = (await getEffectiveAccountId())!;
  const { error } = await searchParams;
  const payments = await prisma.payment.findMany({ where: { accountId }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Fizetések" subtitle="Egyszeri és havi díjak, bankkártyás fizetéssel" />

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error === "barion_not_configured"
            ? "A bankkártyás fizetés jelenleg nincs beállítva – keresd a The Code csapatát."
            : "A fizetés indítása sikertelen volt, próbáld újra."}
        </div>
      ) : null}

      <Card className="divide-y divide-zinc-100 p-0">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-800">{formatHUF(p.amount)}</p>
              <p className="text-xs text-zinc-500">
                {labelFor(PAYMENT_TYPES, p.type)} · {p.dueDate ? `Határidő: ${p.dueDate.toLocaleDateString("hu-HU")}` : "Nincs határidő"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge color={p.status === "PAID" ? "green" : p.status === "EXPIRED" ? "red" : "amber"}>{labelFor(PAYMENT_STATUSES, p.status)}</Badge>
              {p.status !== "PAID" ? (
                <form action={startPaymentCheckoutAction.bind(null, p.id)}>
                  <button className="rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-gold-dark">Fizetés</button>
                </form>
              ) : null}
            </div>
          </div>
        ))}
        {payments.length === 0 ? <EmptyState text="Nincs még fizetési tétel" /> : null}
      </Card>
    </div>
  );
}
