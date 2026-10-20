import { NextRequest, NextResponse } from "next/server";
import { verifyEventHash, syncContractFromDropboxSign } from "@/lib/dropbox-sign";

type DropboxSignEvent = {
  event: { event_type: string; event_time: string; event_hash: string };
  signature_request?: { signature_request_id: string };
};

/**
 * Dropbox Sign ide POST-ol multipart/form-data-ként, egy "json" mezőben a
 * tényleges eseménnyel. A válasznak mindig HTTP 200-nak kell lennie, a body-ban
 * az "Hello API Event Received" szöveggel, különben Dropbox Sign ismétli a
 * hívást, és túl sok sikertelen próbálkozás után deaktiválja a callback URL-t.
 */
export async function POST(request: NextRequest) {
  const ACK = new NextResponse("Hello API Event Received", { status: 200 });

  let payload: DropboxSignEvent;
  try {
    const form = await request.formData();
    const raw = form.get("json");
    if (typeof raw !== "string") return ACK;
    payload = JSON.parse(raw);
  } catch {
    return ACK;
  }

  const { event_type: eventType, event_time: eventTime, event_hash: eventHash } = payload.event ?? {};
  if (!eventType || !eventTime || !eventHash) return ACK;
  if (eventType === "callback_test") return ACK;

  if (!verifyEventHash({ eventTime, eventType, eventHash })) {
    console.warn("[dropbox-sign] Érvénytelen event_hash - esemény figyelmen kívül hagyva.");
    return ACK;
  }

  const signatureRequestId = payload.signature_request?.signature_request_id;
  if (signatureRequestId) {
    await syncContractFromDropboxSign(signatureRequestId);
  }

  return ACK;
}
