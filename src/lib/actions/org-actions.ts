"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function updateOrganizationBrandingAction(formData: FormData) {
  const session = await requireStaffSession();

  const primaryColorRaw = String(formData.get("primaryColor") ?? "").trim();
  const primaryColor = HEX_COLOR.test(primaryColorRaw) ? primaryColorRaw : null;
  const customDomain = String(formData.get("customDomain") ?? "").trim() || null;

  let logoUrl: string | undefined;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "org", session.organizationId);
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, fileName), buffer);
    logoUrl = `/uploads/org/${session.organizationId}/${fileName}`;
  }

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: { primaryColor, customDomain, ...(logoUrl ? { logoUrl } : {}) },
  });

  revalidatePath("/admin/beallitasok");
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
}
