"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function currentActorId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  return session.kind === "staff" ? session.teamMemberId : null;
}

function revalidateAllCrmSurfaces(accountId: string) {
  revalidatePath(`/admin/ugyfelek/${accountId}/crm`);
  revalidatePath("/admin/crm");
  revalidatePath("/portal/crm");
  revalidatePath("/admin/sales");
}

export async function moveOpportunityStage(opportunityId: string, toStageId: string) {
  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) return;

  await prisma.opportunity.update({ where: { id: opportunityId }, data: { stageId: toStageId } });

  const stage = await prisma.stage.findUnique({ where: { id: toStageId } });
  const actorId = await currentActorId();
  await prisma.activityLogEntry.create({
    data: {
      accountId: opp.accountId,
      opportunityId,
      actorId,
      type: "MOVED_STAGE",
      message: `Áthelyezve a "${stage?.name}" szakaszba`,
    },
  });

  revalidateAllCrmSurfaces(opp.accountId);
}

export async function createOpportunityAction(accountId: string, stageId: string, formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) return;

  const opp = await prisma.opportunity.create({
    data: {
      accountId,
      stageId,
      firstName,
      lastName: String(formData.get("lastName") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      company: String(formData.get("company") ?? "") || null,
      opportunityName: String(formData.get("opportunityName") ?? "") || `${firstName} – új érdeklődés`,
      value: Number(formData.get("value") ?? 0),
      source: String(formData.get("source") ?? "manual"),
    },
  });

  const actorId = await currentActorId();
  await prisma.activityLogEntry.create({
    data: { accountId, opportunityId: opp.id, actorId, type: "CREATED", message: "Opportunity manuálisan létrehozva" },
  });

  revalidateAllCrmSurfaces(accountId);
}

export async function updateOpportunityAction(opportunityId: string, formData: FormData) {
  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) return;

  const customFields: Record<string, unknown> = JSON.parse(opp.customFields || "{}");
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("cf_")) {
      const fieldId = key.slice(3);
      customFields[fieldId] = value === "on" ? true : value;
    }
  }

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      firstName: String(formData.get("firstName") ?? opp.firstName),
      lastName: String(formData.get("lastName") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      company: String(formData.get("company") ?? "") || null,
      opportunityName: String(formData.get("opportunityName") ?? opp.opportunityName),
      status: String(formData.get("status") ?? opp.status),
      value: Number(formData.get("value") ?? opp.value),
      source: String(formData.get("source") ?? "") || null,
      customFields: JSON.stringify(customFields),
    },
  });

  revalidateAllCrmSurfaces(opp.accountId);
}

export async function addNoteAction(opportunityId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) return;
  const actorId = await currentActorId();

  await prisma.note.create({ data: { opportunityId, authorId: actorId, body } });
  await prisma.activityLogEntry.create({ data: { accountId: opp.accountId, opportunityId, actorId, type: "NOTE_ADDED", message: "Jegyzet hozzáadva" } });
  revalidateAllCrmSurfaces(opp.accountId);
}

export async function addTaskReminderAction(opportunityId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) return;

  const preset = String(formData.get("duePreset") ?? "today");
  const dueAt = new Date();
  if (preset === "tomorrow") dueAt.setDate(dueAt.getDate() + 1);
  if (preset === "week") dueAt.setDate(dueAt.getDate() + 7);
  if (preset === "month") dueAt.setMonth(dueAt.getMonth() + 1);

  await prisma.taskReminder.create({
    data: { opportunityId, title, dueAt, assigneeId: String(formData.get("assigneeId") ?? "") || null },
  });
  revalidateAllCrmSurfaces(opp.accountId);
}

export async function toggleTaskReminderAction(reminderId: string) {
  const reminder = await prisma.taskReminder.findUnique({ where: { id: reminderId }, include: { opportunity: true } });
  if (!reminder) return;
  await prisma.taskReminder.update({ where: { id: reminderId }, data: { done: !reminder.done } });
  revalidateAllCrmSurfaces(reminder.opportunity.accountId);
}

// --- Pipeline / stage / custom-field / webhook configuration --------------

export async function createPipelineAction(accountId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const existingDefault = await prisma.pipeline.findFirst({ where: { accountId, isDefault: true } });

  await prisma.pipeline.create({
    data: {
      accountId,
      name,
      isDefault: !existingDefault,
      stages: {
        create: [
          { name: "Új lead", color: "#6366f1", order: 0 },
          { name: "Folyamatban", color: "#3b82f6", order: 1 },
          { name: "Lezárva", color: "#22c55e", order: 2 },
        ],
      },
    },
  });
  revalidateAllCrmSurfaces(accountId);
}

export async function setDefaultPipelineAction(accountId: string, pipelineId: string) {
  await prisma.pipeline.updateMany({ where: { accountId }, data: { isDefault: false } });
  await prisma.pipeline.update({ where: { id: pipelineId }, data: { isDefault: true } });
  revalidateAllCrmSurfaces(accountId);
}

export async function addStageAction(pipelineId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId }, include: { stages: true } });
  if (!pipeline) return;
  await prisma.stage.create({
    data: { pipelineId, name, color: String(formData.get("color") ?? "#6366f1"), order: pipeline.stages.length },
  });
  revalidateAllCrmSurfaces(pipeline.accountId);
}

export async function deleteStageAction(stageId: string, moveToStageId: string | null) {
  const stage = await prisma.stage.findUnique({ where: { id: stageId }, include: { pipeline: true } });
  if (!stage) return;

  if (moveToStageId) {
    await prisma.opportunity.updateMany({ where: { stageId }, data: { stageId: moveToStageId } });
  } else {
    await prisma.opportunity.deleteMany({ where: { stageId } });
  }
  await prisma.stage.delete({ where: { id: stageId } });
  revalidateAllCrmSurfaces(stage.pipeline.accountId);
}

export async function addCustomFieldAction(pipelineId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId }, include: { customFieldDefs: true } });
  if (!pipeline) return;

  const optionsRaw = String(formData.get("options") ?? "");
  await prisma.customFieldDefinition.create({
    data: {
      pipelineId,
      name,
      type: String(formData.get("type") ?? "TEXT"),
      section: String(formData.get("section") ?? "Általános") || "Általános",
      options: JSON.stringify(optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)),
      order: pipeline.customFieldDefs.length,
    },
  });
  revalidateAllCrmSurfaces(pipeline.accountId);
}

export async function deleteCustomFieldAction(fieldId: string) {
  const field = await prisma.customFieldDefinition.findUnique({ where: { id: fieldId }, include: { pipeline: true } });
  if (!field) return;
  await prisma.customFieldDefinition.delete({ where: { id: fieldId } });
  revalidateAllCrmSurfaces(field.pipeline.accountId);
}

export async function createWebhookAction(accountId: string, formData: FormData) {
  const pipelineId = String(formData.get("pipelineId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const name = String(formData.get("name") ?? "Új webhook");
  if (!pipelineId || !stageId) return;

  await prisma.webhook.create({ data: { accountId, pipelineId, stageId, name } });
  revalidateAllCrmSurfaces(accountId);
}

export async function deleteWebhookAction(webhookId: string) {
  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook) return;
  await prisma.webhook.delete({ where: { id: webhookId } });
  revalidateAllCrmSurfaces(webhook.accountId);
}

export async function regenerateWebhookAction(webhookId: string) {
  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook) return;
  await prisma.webhook.update({ where: { id: webhookId }, data: { token: cryptoRandomToken() } });
  revalidateAllCrmSurfaces(webhook.accountId);
}

function cryptoRandomToken() {
  return `wh_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function getOpportunityDetail(opportunityId: string) {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      stage: { include: { pipeline: { include: { stages: { orderBy: { order: "asc" } }, customFieldDefs: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
      taskReminders: { orderBy: { dueAt: "asc" } },
      activityEntries: { orderBy: { createdAt: "desc" }, take: 30, include: { actor: true } },
    },
  });
  if (!opp) return null;

  const teamMembers = await prisma.teamMember.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  return {
    ...opp,
    customFieldsParsed: JSON.parse(opp.customFields || "{}") as Record<string, unknown>,
    teamMembers,
  };
}

export type OpportunityDetail = NonNullable<Awaited<ReturnType<typeof getOpportunityDetail>>>;
