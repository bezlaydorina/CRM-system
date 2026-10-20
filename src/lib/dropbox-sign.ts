import api from "@dropbox/sign";
import { createHmac } from "crypto";
import { writeFile, unlink, mkdir } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import os from "os";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.DROPBOX_SIGN_API_KEY;
const TEST_MODE = process.env.DROPBOX_SIGN_TEST_MODE !== "false"; // alapértelmezetten teszt-mód, nehogy véletlenül éles (jogilag kötelező érvényű) kérés menjen ki

export function isDropboxSignConfigured() {
  return Boolean(API_KEY);
}

function client() {
  const c = new api.SignatureRequestApi();
  c.username = API_KEY!;
  return c;
}

type SendForSignatureParams = {
  pdf: Buffer;
  title: string;
  subject: string;
  message: string;
  signerEmail: string;
  signerName: string;
};

/**
 * Nélküle (nincs DROPBOX_SIGN_API_KEY) null-t ad vissza és csak logol - a hívó fél
 * ez alapján tud hibaüzenetet mutatni, a szerződés kézi állapotkövetése eközben
 * változatlanul elérhető marad.
 */
export async function sendContractForSignature({ pdf, title, subject, message, signerEmail, signerName }: SendForSignatureParams): Promise<{ signatureRequestId: string } | null> {
  if (!isDropboxSignConfigured()) {
    console.warn("[dropbox-sign] DROPBOX_SIGN_API_KEY nincs beállítva - e-aláírásra küldés kihagyva.");
    return null;
  }

  const tmpPath = path.join(os.tmpdir(), `contract-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  await writeFile(tmpPath, pdf);

  try {
    const response = await client().signatureRequestSend({
      title,
      subject,
      message,
      testMode: TEST_MODE,
      useTextTags: true,
      files: [createReadStream(tmpPath)],
      signers: [{ name: signerName, emailAddress: signerEmail, order: 0 }],
    });

    const signatureRequestId = response.body?.signatureRequest?.signatureRequestId;
    if (!signatureRequestId) {
      console.error("[dropbox-sign] Küldés sikertelen - nincs signatureRequestId a válaszban:", response.body);
      return null;
    }
    return { signatureRequestId };
  } catch (error) {
    console.error("[dropbox-sign] Küldés sikertelen:", error);
    return null;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

export type SignatureRequestState = {
  isComplete: boolean;
  isDeclined: boolean;
  signedAt: number | null;
  viewed: boolean;
};

/**
 * A szerződés állapotát mindig innen, a Dropbox Sign saját API-jából (a saját
 * API-kulcsunkkal lekérdezve) olvassuk vissza, sosem a nyers webhook body-ból -
 * ugyanaz az elv, mint a Barion fizetési callback-nél.
 */
export async function getSignatureRequestState(signatureRequestId: string): Promise<SignatureRequestState | null> {
  if (!isDropboxSignConfigured()) return null;
  try {
    const response = await client().signatureRequestGet(signatureRequestId);
    const sr = response.body?.signatureRequest;
    if (!sr) return null;
    const signatures = sr.signatures ?? [];
    return {
      isComplete: Boolean(sr.isComplete),
      isDeclined: Boolean(sr.isDeclined),
      signedAt: signatures.find((s) => s.signedAt)?.signedAt ?? null,
      viewed: signatures.some((s) => s.statusCode !== "awaiting_signature"),
    };
  } catch (error) {
    console.error(`[dropbox-sign] Állapot-lekérdezés sikertelen (${signatureRequestId}):`, error);
    return null;
  }
}

export async function downloadSignedPdf(signatureRequestId: string): Promise<Buffer | null> {
  if (!isDropboxSignConfigured()) return null;
  try {
    const response = await client().signatureRequestFiles(signatureRequestId, "pdf");
    return Buffer.isBuffer(response.body) ? response.body : null;
  } catch (error) {
    console.error(`[dropbox-sign] Aláírt PDF letöltése sikertelen (${signatureRequestId}):`, error);
    return null;
  }
}

/**
 * A webhook hitelességét ellenőrzi: HMAC-SHA256(saját API-kulcs, event_time + event_type)
 * kell egyezzen az esemény event_hash mezőjével - lásd Dropbox Sign "Events & Callbacks".
 */
export function verifyEventHash({ eventTime, eventType, eventHash }: { eventTime: string; eventType: string; eventHash: string }): boolean {
  if (!API_KEY) return false;
  const computed = createHmac("sha256", API_KEY).update(`${eventTime}${eventType}`).digest("hex");
  return computed === eventHash;
}

/**
 * A webhook hívja meg a signature_request_id alapján - a Contract-ot sosem a
 * webhook body-ban kapott állapot alapján frissítjük, hanem mindig a Dropbox
 * Sign API-tól frissen visszakérdezett, hiteles állapot alapján.
 */
export async function syncContractFromDropboxSign(signatureRequestId: string): Promise<void> {
  const contract = await prisma.contract.findFirst({ where: { dropboxSignRequestId: signatureRequestId } });
  if (!contract) return; // ismeretlen kérés (pl. másik rendszerből) - nincs teendő

  const state = await getSignatureRequestState(signatureRequestId);
  if (!state) return;

  const newStatus = state.isDeclined ? "DECLINED" : state.isComplete ? "SIGNED" : state.viewed ? "VIEWED" : "SENT";
  if (newStatus === contract.status) return;

  let documentUrl = contract.documentUrl;
  if (newStatus === "SIGNED") {
    const signedPdf = await downloadSignedPdf(signatureRequestId);
    if (signedPdf) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", contract.accountId, "contracts");
      await mkdir(uploadDir, { recursive: true });
      const fileName = `${contract.id}-signed-${Date.now()}.pdf`;
      await writeFile(path.join(uploadDir, fileName), signedPdf);
      documentUrl = `/uploads/${contract.accountId}/contracts/${fileName}`;
    }
  }

  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: newStatus,
      documentUrl,
      signedAt: newStatus === "SIGNED" ? new Date((state.signedAt ?? Date.now() / 1000) * 1000) : contract.signedAt,
    },
  });
}
