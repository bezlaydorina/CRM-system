import { NextRequest, NextResponse } from "next/server";
import { syncPaymentFromBarion } from "@/lib/barion";

/**
 * Barion POST-ol ide egy puszta { "PaymentId": "..." } payloadot minden
 * állapotváltáskor - ez önmagában nem megbízható (bárki küldhetne hamisat),
 * ezért a tényleges állapotot mindig visszakérdezzük a Barion API-tól
 * a saját, titkos POSKey-ünkkel (lásd syncPaymentFromBarion).
 */
export async function POST(request: NextRequest) {
  let payload: { PaymentId?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.PaymentId) {
    return NextResponse.json({ error: "Missing PaymentId" }, { status: 400 });
  }

  const status = await syncPaymentFromBarion(payload.PaymentId);
  if (status === null) {
    return NextResponse.json({ error: "Unknown PaymentId" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
