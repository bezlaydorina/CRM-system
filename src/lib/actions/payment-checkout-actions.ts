"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/email";
import { startBarionPayment, isBarionConfigured } from "@/lib/barion";
import { PAYMENT_TYPES, labelFor } from "@/lib/enums";

/**
 * Staff bármelyik fizetéshez indíthat/megnyithat checkoutot; ügyfél csak a saját account-jához
 * tartozóhoz. A Barion gateway linkek kb. 30 percig érvényesek, ezért itt mindig friss
 * Payment/Start hívás történik ahelyett, hogy a létrehozáskor generált linket újrahasználnánk.
 */
export async function startPaymentCheckoutAction(paymentId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { account: true } });
  if (!payment) redirect("/portal");
  if (session.kind === "client" && session.accountId !== payment.accountId) redirect("/portal");

  const returnPath = session.kind === "client" ? "/portal/fizetesek" : `/admin/ugyfelek/${payment.accountId}/penzugy`;
  if (payment.status === "PAID") redirect(returnPath);

  if (!isBarionConfigured()) {
    redirect(`${returnPath}?error=barion_not_configured`);
  }

  const paymentRequestId = `${payment.id}-${Date.now().toString(36)}`;
  const result = await startBarionPayment({
    paymentRequestId,
    amount: payment.amount,
    description: `${payment.account.name} – ${labelFor(PAYMENT_TYPES, payment.type)}`,
    redirectUrl: `${getAppUrl()}/fizetes/eredmeny?paymentId=${payment.id}`,
    callbackUrl: `${getAppUrl()}/api/barion/callback`,
  });

  if (!result) redirect(`${returnPath}?error=barion_failed`);

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      barionPaymentId: result.barionPaymentId,
      paymentLink: result.gatewayUrl,
      status: payment.status === "CREATED" ? "SENT" : payment.status,
    },
  });

  redirect(result.gatewayUrl);
}
