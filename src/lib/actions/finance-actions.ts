"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";

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
      paymentLink: `https://pay.synkai.hu/${accountId.slice(0, 8)}-${Date.now().toString(36)}`,
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
