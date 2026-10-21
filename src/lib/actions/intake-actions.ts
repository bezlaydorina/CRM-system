"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";

export async function addIntakeFieldAction(formKey: string, formData: FormData) {
  const session = await requireStaffSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const existing = await prisma.intakeFormFieldDefinition.findMany({
    where: { organizationId: session.organizationId, formKey },
  });

  const optionsRaw = String(formData.get("options") ?? "");
  await prisma.intakeFormFieldDefinition.create({
    data: {
      organizationId: session.organizationId,
      formKey,
      name,
      type: String(formData.get("type") ?? "TEXT"),
      section: String(formData.get("section") ?? "Általános") || "Általános",
      options: JSON.stringify(optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)),
      order: existing.length,
    },
  });
  revalidatePath("/admin/beallitasok");
}

export async function deleteIntakeFieldAction(fieldId: string) {
  await requireStaffSession();
  await prisma.intakeFormFieldDefinition.delete({ where: { id: fieldId } });
  revalidatePath("/admin/beallitasok");
}

export async function saveIntakeResponseAction(accountId: string, formKey: string, formData: FormData) {
  await requireStaffSession();
  const fields = await prisma.intakeFormFieldDefinition.findMany({ where: { formKey } });

  const answers: Record<string, string | boolean> = {};
  for (const field of fields) {
    const key = `cf_${field.id}`;
    answers[field.id] = field.type === "CHECKBOX" ? formData.get(key) === "on" : String(formData.get(key) ?? "");
  }

  await prisma.intakeFormResponse.upsert({
    where: { accountId_formKey: { accountId, formKey } },
    create: { accountId, formKey, answers: JSON.stringify(answers) },
    update: { answers: JSON.stringify(answers) },
  });
  revalidatePath(`/admin/ugyfelek/${accountId}/adatok`);
}
