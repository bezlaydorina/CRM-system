"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, requireStaffSession } from "@/lib/auth";
import { createSignedUploadUrl, objectExists, isStorageConfigured } from "@/lib/storage";

const MAX_SIZE = 50 * 1024 * 1024; // a Supabase "uploads" bucket 50 MB-os korlátja

function revalidateApprovalSurfaces() {
  revalidatePath("/admin/jovahagyas");
  revalidatePath("/portal/jovahagyasok");
}

export type ApprovalDecision = "SEND_TO_CLIENT" | "REQUEST_CHANGES" | "RESUBMIT" | "CLIENT_APPROVE" | "CLIENT_REJECT";

export async function decideApprovalAction(approvalId: string, decision: ApprovalDecision, note?: string) {
  const session = await getSession();
  if (!session) return;

  const data: { status: string; decidedAt?: Date; clientNote?: string | null } = { status: "PENDING_INTERNAL" };
  if (decision === "SEND_TO_CLIENT") data.status = "PENDING_CLIENT";
  if (decision === "REQUEST_CHANGES") data.status = "DRAFT";
  if (decision === "RESUBMIT") data.status = "PENDING_INTERNAL";
  if (decision === "CLIENT_APPROVE") {
    data.status = "APPROVED";
    data.decidedAt = new Date();
  }
  if (decision === "CLIENT_REJECT") {
    data.status = "REJECTED";
    data.decidedAt = new Date();
    data.clientNote = note ?? null;
  }

  await prisma.approvalItem.update({ where: { id: approvalId }, data });
  revalidateApprovalSurfaces();
}

export async function bulkDecideApprovalsAction(approvalIds: string[], decision: ApprovalDecision) {
  await Promise.all(approvalIds.map((id) => decideApprovalAction(id, decision)));
}

/**
 * 1/2. lépés: aláírt feltöltési URL-t ad a kliensnek (lásd file-actions.ts
 * ugyanerről az elvről).
 */
export async function startApprovalUploadAction({
  accountId,
  fileName,
  size,
}: {
  accountId: string;
  fileName: string;
  size: number;
}): Promise<{ error: string } | { path: string; uploadUrl: string }> {
  await requireStaffSession();
  if (!accountId) return { error: "Hiányzó ügyfél." } as const;
  if (!isStorageConfigured()) return { error: "A fájltárolás (Supabase Storage) nincs beállítva." } as const;
  if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) return { error: "A fájl mérete nem megfelelő (max. 50 MB)." } as const;

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${accountId}/approvals/${Date.now()}-${safeName}`;
  const signed = await createSignedUploadUrl(objectPath);
  if (!signed) return { error: "A feltöltési link generálása sikertelen." } as const;
  return { path: signed.path, uploadUrl: signed.url } as const;
}

/**
 * 2/2. lépés: a kliens feltöltése után ellenőrzi az útvonalat és hogy a
 * fájl ténylegesen megérkezett, csak utána hozza létre a jóváhagyási tételt.
 */
export async function finishApprovalUploadAction({
  accountId,
  path: objectPath,
  title,
  type,
}: {
  accountId: string;
  path: string;
  title: string;
  type: string;
}): Promise<{ error: string } | { ok: true }> {
  const session = await requireStaffSession();
  if (!accountId || !title.trim()) return { error: "Hiányzó adat." } as const;
  if (!objectPath.startsWith(`${accountId}/approvals/`) || objectPath.includes("..")) return { error: "Érvénytelen fájl-útvonal." } as const;
  if (!(await objectExists(objectPath))) return { error: "A fájl nem található a tárolóban - a feltöltés nem sikerült." } as const;

  await prisma.approvalItem.create({
    data: {
      accountId,
      title: title.trim(),
      type,
      status: "PENDING_INTERNAL",
      fileUrl: objectPath,
      createdById: session.teamMemberId,
    },
  });
  revalidateApprovalSurfaces();
  return { ok: true } as const;
}
