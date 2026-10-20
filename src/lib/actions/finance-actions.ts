"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { generateContractPdf } from "@/lib/contract-pdf";
import { isDropboxSignConfigured, sendContractForSignature } from "@/lib/dropbox-sign";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function revalidateFinanceSurfaces() {
  revalidatePath("/admin/fizetesek");
  revalidatePath("/admin/szerzodesek");
  revalidatePath("/admin/sales/fizetesek");
  revalidatePath("/admin/sales/szerzodesek");
}

export async function createPaymentAction(formData: FormData) {
  await requireStaffSession();
  const accountId = String(formData.get("accountId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (!accountId || !amount) return;

  await prisma.payment.create({
    data: {
      accountId,
      amount,
      type: String(formData.get("type") ?? "ONE_TIME"),
      status: "CREATED",
      dueDate: formData.get("dueDate") ? new Date(String(formData.get("dueDate"))) : null,
    },
  });
  revalidateFinanceSurfaces();
}

export async function updatePaymentStatusAction(paymentId: string, status: string) {
  await requireStaffSession();
  await prisma.payment.update({ where: { id: paymentId }, data: { status, dueDate: status === "PAID" ? new Date() : undefined } });
  revalidateFinanceSurfaces();
}

export async function createContractAction(formData: FormData) {
  await requireStaffSession();
  const accountId = String(formData.get("accountId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (!accountId) return;

  await prisma.contract.create({
    data: {
      accountId,
      amount,
      templateName: String(formData.get("templateName") ?? "Alap szolgáltatási szerződés"),
      status: "DRAFT",
    },
  });
  revalidateFinanceSurfaces();
}

export async function updateContractStatusAction(contractId: string, status: string) {
  await requireStaffSession();
  await prisma.contract.update({
    where: { id: contractId },
    data: { status, signedAt: status === "SIGNED" ? new Date() : undefined },
  });
  revalidateFinanceSurfaces();
}

/**
 * Valódi e-aláírásra küldés Dropbox Sign-on keresztül: a szerződésből generált
 * PDF-et elküldi az account elsődleges kapcsolattartójának aláírásra. Innentől
 * az állapotot (SENT → VIEWED → SIGNED/DECLINED) a Dropbox Sign webhook
 * (/api/dropbox-sign/callback) vezérli automatikusan, nem kézi gombok.
 */
export async function sendContractForSignatureAction(contractId: string) {
  await requireStaffSession();

  const contract = await prisma.contract.findUnique({ where: { id: contractId }, include: { account: true } });
  if (!contract) return;
  const returnPath = contract.account.isInternalSales ? "/admin/sales/szerzodesek" : "/admin/szerzodesek";

  if (!isDropboxSignConfigured()) {
    redirect(`${returnPath}?error=dropbox_sign_not_configured`);
  }

  const signer = await prisma.contact.findFirst({ where: { accountId: contract.accountId, isPrimary: true } });
  if (!signer?.email) {
    redirect(`${returnPath}?error=dropbox_sign_no_signer`);
  }

  const pdf = await generateContractPdf({
    accountName: contract.account.name,
    templateName: contract.templateName,
    amount: contract.amount,
    contractId: contract.id,
  });

  const uploadDir = path.join(process.cwd(), "public", "uploads", contract.accountId, "contracts");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${contract.id}-${Date.now()}.pdf`;
  await writeFile(path.join(uploadDir, fileName), pdf);

  const result = await sendContractForSignature({
    pdf,
    title: `${contract.templateName} - ${contract.account.name}`,
    subject: `Aláírásra vár: ${contract.templateName}`,
    message: `Kérjük, tekintsd át és írd alá a(z) ${contract.account.name} részére készült szerződést.`,
    signerEmail: signer!.email!,
    signerName: signer!.fullName,
  });

  if (!result) {
    redirect(`${returnPath}?error=dropbox_sign_failed`);
  }

  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: "SENT",
      documentUrl: `/uploads/${contract.accountId}/contracts/${fileName}`,
      dropboxSignRequestId: result.signatureRequestId,
    },
  });
  revalidateFinanceSurfaces();
}
