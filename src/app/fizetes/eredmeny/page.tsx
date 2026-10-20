import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { syncPaymentFromBarion } from "@/lib/barion";
import { formatHUF } from "@/lib/enums";

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ paymentId?: string }> }) {
  const { paymentId } = await searchParams;
  const payment = paymentId ? await prisma.payment.findUnique({ where: { id: paymentId }, include: { account: true } }) : null;

  if (payment?.barionPaymentId) {
    await syncPaymentFromBarion(payment.barionPaymentId);
  }
  const fresh = payment ? await prisma.payment.findUnique({ where: { id: payment.id } }) : null;

  const status = fresh?.status ?? null;
  const isPaid = status === "PAID";
  const isExpired = status === "EXPIRED";

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-maroon to-brand-text px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        {!payment ? (
          <>
            <p className="text-3xl">⚠️</p>
            <h1 className="mt-2 text-lg font-semibold text-brand-text">Ismeretlen fizetés</h1>
            <p className="mt-1 text-sm text-zinc-500">Nem találjuk ezt a fizetési tételt.</p>
          </>
        ) : isPaid ? (
          <>
            <p className="text-3xl">✅</p>
            <h1 className="mt-2 text-lg font-semibold text-brand-text">Sikeres fizetés!</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {payment.account.name} – {formatHUF(payment.amount)}
            </p>
          </>
        ) : isExpired ? (
          <>
            <p className="text-3xl">❌</p>
            <h1 className="mt-2 text-lg font-semibold text-brand-text">Sikertelen fizetés</h1>
            <p className="mt-1 text-sm text-zinc-500">A fizetés megszakadt vagy visszautasításra került. Próbáld újra.</p>
          </>
        ) : (
          <>
            <p className="text-3xl">⏳</p>
            <h1 className="mt-2 text-lg font-semibold text-brand-text">Fizetés feldolgozás alatt</h1>
            <p className="mt-1 text-sm text-zinc-500">Pár másodperc múlva frissül az állapot – nézd meg újra a Fizetések oldalon.</p>
          </>
        )}
        <Link href="/portal/fizetesek" className="mt-6 inline-block rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-white hover:bg-brand-gold-dark">
          Vissza a fizetésekhez
        </Link>
      </div>
    </div>
  );
}
