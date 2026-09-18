"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";

export async function uploadFileAction(formData: FormData) {
  const accountId = await getEffectiveAccountId();
  if (!accountId) return;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const folder = String(formData.get("folder") ?? "IMAGES");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", accountId);
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  await prisma.fileAsset.create({
    data: {
      accountId,
      folder,
      fileName: file.name,
      fileUrl: `/uploads/${accountId}/${fileName}`,
      fileType: file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "image" : "other",
    },
  });

  revalidatePath("/portal/fajlok");
  revalidatePath(`/admin/ugyfelek/${accountId}`);
}
