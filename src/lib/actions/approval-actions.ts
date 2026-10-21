"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession, requireStaffSession } from "@/lib/auth";

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

export async function createApprovalItemAction(formData: FormData) {
  const session = await requireStaffSession();
  const accountId = String(formData.get("accountId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");
  if (!accountId || !title || !(file instanceof File) || file.size === 0) return;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", accountId, "approvals");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  await prisma.approvalItem.create({
    data: {
      accountId,
      title,
      type: String(formData.get("type") ?? "CREATIVE"),
      status: "PENDING_INTERNAL",
      fileUrl: `/uploads/${accountId}/approvals/${fileName}`,
      createdById: session.teamMemberId,
    },
  });
  revalidateApprovalSurfaces();
}
