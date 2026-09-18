"use server";

import { revalidatePath } from "next/cache";
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

export async function createApprovalItemAction(accountId: string, formData: FormData) {
  const session = await requireStaffSession();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.approvalItem.create({
    data: {
      accountId,
      title,
      type: String(formData.get("type") ?? "CREATIVE"),
      status: "PENDING_INTERNAL",
      fileUrl: String(formData.get("fileUrl") ?? "") || "/mock-assets/creative-placeholder.svg",
      createdById: session.teamMemberId,
    },
  });
  revalidateApprovalSurfaces();
}
