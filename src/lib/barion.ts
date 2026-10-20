import { prisma } from "@/lib/prisma";

const BARION_API = process.env.BARION_ENV === "prod" ? "https://api.barion.com" : "https://api.test.barion.com";
const POS_KEY = process.env.BARION_POS_KEY;
const PAYEE = process.env.BARION_PAYEE_EMAIL;

export function isBarionConfigured() {
  return Boolean(POS_KEY && PAYEE);
}

type StartPaymentParams = {
  paymentRequestId: string;
  amount: number;
  description: string;
  redirectUrl: string;
  callbackUrl: string;
};

type StartPaymentResult = { barionPaymentId: string; gatewayUrl: string };

/**
 * Nélküle (nincs BARION_POS_KEY/BARION_PAYEE_EMAIL) ez csak logol és null-t ad vissza,
 * hogy a hívó fél (checkout action) ez alapján tudjon demó-üzenetet mutatni.
 */
export async function startBarionPayment(params: StartPaymentParams): Promise<StartPaymentResult | null> {
  if (!isBarionConfigured()) {
    console.warn(`[barion] BARION_POS_KEY/BARION_PAYEE_EMAIL nincs beállítva – fizetés indítása kihagyva (${params.paymentRequestId})`);
    return null;
  }

  const res = await fetch(`${BARION_API}/v2/Payment/Start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      POSKey: POS_KEY,
      PaymentType: "Immediate",
      GuestCheckOut: true,
      FundingSources: ["All"],
      PaymentRequestId: params.paymentRequestId,
      RedirectUrl: params.redirectUrl,
      CallbackUrl: params.callbackUrl,
      Transactions: [
        {
          POSTransactionId: params.paymentRequestId,
          Payee: PAYEE,
          Total: params.amount,
          Comment: params.description,
        },
      ],
      Locale: "hu-HU",
      Currency: "HUF",
    }),
  });

  const data = await res.json();
  if (!res.ok || (data.Errors && data.Errors.length > 0)) {
    console.error("[barion] Payment/Start sikertelen:", data.Errors ?? data);
    return null;
  }

  return { barionPaymentId: data.PaymentId, gatewayUrl: data.GatewayUrl };
}

type BarionPaymentState = { Status: string; PaymentId: string };

export async function getBarionPaymentState(barionPaymentId: string): Promise<BarionPaymentState | null> {
  if (!isBarionConfigured()) return null;

  const url = `${BARION_API}/v2/Payment/GetPaymentState?POSKey=${encodeURIComponent(POS_KEY!)}&PaymentId=${encodeURIComponent(barionPaymentId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[barion] GetPaymentState sikertelen (${barionPaymentId}): ${res.status}`);
    return null;
  }
  return res.json();
}

/** Barion státusz -> a saját Payment.status mezőnk (lásd enums.ts PAYMENT_STATUSES). */
export function mapBarionStatusToPaymentStatus(barionStatus: string): "PAID" | "EXPIRED" | "SENT" {
  if (barionStatus === "Succeeded" || barionStatus === "PartiallySucceeded") return "PAID";
  if (barionStatus === "Canceled" || barionStatus === "Failed" || barionStatus === "Expired") return "EXPIRED";
  return "SENT";
}

/**
 * Lekérdezi a hiteles állapotot a Barion API-tól és frissíti a saját Payment rekordunkat.
 * Mind a callback webhook, mind a redirect-utáni eredmény-oldal ezt hívja, hogy bármelyik
 * érjen oda előbb, a végállapot ugyanaz legyen. Visszaadja a (lehetséges) új Payment.status-t.
 */
export async function syncPaymentFromBarion(barionPaymentId: string) {
  const payment = await prisma.payment.findFirst({ where: { barionPaymentId } });
  if (!payment) return null;

  const state = await getBarionPaymentState(barionPaymentId);
  if (!state) return payment.status;

  const status = mapBarionStatusToPaymentStatus(state.Status);
  if (status !== payment.status) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status } });
    if (status === "PAID") {
      await prisma.account.update({ where: { id: payment.accountId }, data: { lastPaymentAt: new Date() } });
      await prisma.activityLogEntry.create({
        data: { accountId: payment.accountId, type: "UPDATED", message: "Fizetés beérkezett (Barion)" },
      });
    }
  }
  return status;
}
