"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { createSignedUploadUrl, objectExists, isStorageConfigured } from "@/lib/storage";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const MAX_SIZE = 50 * 1024 * 1024; // a Supabase "uploads" bucket 50 MB-os korlátja

function revalidateBrandingSurfaces() {
  revalidatePath("/admin/beallitasok");
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
}

export async function updateOrganizationBrandingAction(formData: FormData) {
  const session = await requireStaffSession();

  const primaryColorRaw = String(formData.get("primaryColor") ?? "").trim();
  const primaryColor = HEX_COLOR.test(primaryColorRaw) ? primaryColorRaw : null;
  const customDomain = String(formData.get("customDomain") ?? "").trim() || null;

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: { primaryColor, customDomain },
  });

  revalidateBrandingSurfaces();
}

/**
 * 1/2. lépés a logó-feltöltéshez: aláírt feltöltési URL-t ad a kliensnek
 * (lásd file-actions.ts ugyanerről az elvről).
 */
export async function startLogoUploadAction({
  fileName,
  size,
}: {
  fileName: string;
  size: number;
}): Promise<{ error: string } | { path: string; uploadUrl: string }> {
  const session = await requireStaffSession();
  if (!isStorageConfigured()) return { error: "A fájltárolás (Supabase Storage) nincs beállítva." } as const;
  if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) return { error: "A fájl mérete nem megfelelő (max. 50 MB)." } as const;

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `org/${session.organizationId}/${Date.now()}-${safeName}`;
  const signed = await createSignedUploadUrl(objectPath);
  if (!signed) return { error: "A feltöltési link generálása sikertelen." } as const;
  return { path: signed.path, uploadUrl: signed.url } as const;
}

/**
 * 2/2. lépés: a kliens feltöltése után ellenőrzi az útvonalat és hogy a
 * fájl ténylegesen megérkezett, csak utána menti a logoUrl-t.
 */
export async function finishLogoUploadAction({ path: objectPath }: { path: string }): Promise<{ error: string } | { ok: true }> {
  const session = await requireStaffSession();
  if (!objectPath.startsWith(`org/${session.organizationId}/`) || objectPath.includes("..")) return { error: "Érvénytelen fájl-útvonal." } as const;
  if (!(await objectExists(objectPath))) return { error: "A fájl nem található a tárolóban - a feltöltés nem sikerült." } as const;

  await prisma.organization.update({ where: { id: session.organizationId }, data: { logoUrl: objectPath } });
  revalidateBrandingSurfaces();
  return { ok: true } as const;
}
