"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { createSignedUploadUrl, objectExists, isStorageConfigured } from "@/lib/storage";

const MAX_SIZE = 50 * 1024 * 1024; // a Supabase "uploads" bucket 50 MB-os korlátja

/**
 * 1/2. lépés: a fájl maga NEM megy át ezen a server action-ön (a Vercel
 * ~4.5 MB-os body-limitje és a Next.js ~1 MB-os server action limitje
 * megfogná) - csak egy aláírt feltöltési URL-t ad, amire a kliens
 * közvetlenül PUT-olja a fájlt a Supabase Storage-ba.
 */
export async function startFileUploadAction({
  fileName,
  size,
}: {
  fileName: string;
  size: number;
}): Promise<{ error: string } | { path: string; uploadUrl: string }> {
  const accountId = await getEffectiveAccountId();
  if (!accountId) return { error: "Nincs bejelentkezve ügyfél kontextus." } as const;
  if (!isStorageConfigured()) return { error: "A fájltárolás (Supabase Storage) nincs beállítva." } as const;
  if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) return { error: "A fájl mérete nem megfelelő (max. 50 MB)." } as const;

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${accountId}/${Date.now()}-${safeName}`;
  const signed = await createSignedUploadUrl(objectPath);
  if (!signed) return { error: "A feltöltési link generálása sikertelen." } as const;
  return { path: signed.path, uploadUrl: signed.url } as const;
}

/**
 * 2/2. lépés: miután a kliens feltöltötte a fájlt a signed URL-re, ez
 * ellenőrzi, hogy a path valóban a hívó saját account-jához tartozik-e,
 * és hogy a fájl ténylegesen megérkezett-e a tárolóba, csak utána rögzíti
 * az adatbázisban.
 */
export async function finishFileUploadAction({
  path: objectPath,
  fileName,
  folder,
  contentType,
}: {
  path: string;
  fileName: string;
  folder: string;
  contentType: string;
}): Promise<{ error: string } | { ok: true }> {
  const accountId = await getEffectiveAccountId();
  if (!accountId) return { error: "Nincs bejelentkezve ügyfél kontextus." } as const;
  if (!objectPath.startsWith(`${accountId}/`) || objectPath.includes("..")) return { error: "Érvénytelen fájl-útvonal." } as const;
  if (!(await objectExists(objectPath))) return { error: "A fájl nem található a tárolóban - a feltöltés nem sikerült." } as const;

  await prisma.fileAsset.create({
    data: {
      accountId,
      folder,
      fileName,
      fileUrl: objectPath,
      fileType: contentType.startsWith("video") ? "video" : contentType.startsWith("image") ? "image" : "other",
    },
  });

  revalidatePath("/portal/fajlok");
  revalidatePath(`/admin/ugyfelek/${accountId}`);
  return { ok: true } as const;
}
