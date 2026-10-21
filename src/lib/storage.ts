const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "uploads";

export function isStorageConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

function authHeaders(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    apikey: SERVICE_ROLE_KEY!,
    ...extra,
  };
}

/**
 * Szerveroldali, közvetlen feltöltés a service role key-jel - rendszer
 * által generált fájlokhoz (szerződés PDF, aláírt PDF), ahol nincs
 * böngészős kliens. Nélküle (nincs SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)
 * csak logol és false-t ad vissza, sosem dob hibát.
 */
export async function uploadObject(path: string, body: Buffer, contentType: string): Promise<boolean> {
  if (!isStorageConfigured()) {
    console.warn(`[storage] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY nincs beállítva - feltöltés kihagyva (${path}).`);
    return false;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": contentType, "x-upsert": "true" }),
      body: body as unknown as BodyInit,
    });
    if (!res.ok) {
      console.error(`[storage] Feltöltés sikertelen (${path}): ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[storage] Feltöltés sikertelen (${path}):`, error);
    return false;
  }
}

/**
 * Böngészős feltöltésekhez: egy ideiglenes, aláírt URL-t ad, amire a
 * kliens közvetlenül PUT-olhatja a fájlt (a service role key sosem kerül
 * a böngészőbe). A válasz "url" mezője relatív, ezért elé illesztjük a
 * "{SUPABASE_URL}/storage/v1" részt.
 */
export async function createSignedUploadUrl(path: string): Promise<{ path: string; url: string } | null> {
  if (!isStorageConfigured()) {
    console.warn("[storage] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY nincs beállítva - feltöltési link generálás kihagyva.");
    return null;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      console.error(`[storage] Feltöltési link generálás sikertelen (${path}): ${res.status} ${await res.text()}`);
      return null;
    }
    const data = (await res.json()) as { url?: string };
    if (!data.url) return null;
    const url = data.url.startsWith("http") ? data.url : `${SUPABASE_URL}/storage/v1${data.url}`;
    return { path, url };
  } catch (error) {
    console.error(`[storage] Feltöltési link generálás sikertelen (${path}):`, error);
    return null;
  }
}

/**
 * A "finish" action-ök ezzel ellenőrzik, hogy a kliens valóban feltöltötte
 * a fájlt a signed URL-re, mielőtt az adatbázisba mentenénk a hivatkozást.
 */
export async function objectExists(path: string): Promise<boolean> {
  if (!isStorageConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/info/${BUCKET}/${path}`, {
      headers: authHeaders(),
    });
    return res.ok;
  } catch (error) {
    console.error(`[storage] Létezés-ellenőrzés sikertelen (${path}):`, error);
    return false;
  }
}

/**
 * Egyetlen batch hívással feloldja a tárolt fileUrl/documentUrl/logoUrl
 * mezőket valódi, lejáró signed URL-ekre (a megjelenítéshez - a bucket
 * PRIVÁT, nyers útvonalon nem tölthető be kép/fájl). A "/"-rel vagy
 * "http"-vel kezdődő (régi, telepítés előtti vagy demó) értékeket
 * változatlanul adja vissza, mert azok nem bucket-útvonalak.
 */
export async function resolveFileUrls(values: (string | null | undefined)[], expiresIn = 3600): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const toSign: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (v.startsWith("/") || v.startsWith("http")) {
      result[v] = v;
    } else if (!toSign.includes(v)) {
      toSign.push(v);
    }
  }

  if (toSign.length === 0) return result;

  if (!isStorageConfigured()) {
    console.warn("[storage] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY nincs beállítva - fájl-URL feloldás kihagyva.");
    for (const p of toSign) result[p] = p;
    return result;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn, paths: toSign }),
    });
    if (!res.ok) {
      console.error(`[storage] Signed URL batch lekérdezés sikertelen: ${res.status} ${await res.text()}`);
      for (const p of toSign) result[p] = p;
      return result;
    }
    const data = (await res.json()) as { path: string; signedURL?: string; signedUrl?: string; error?: string | null }[];
    for (const item of data) {
      const signed = item.signedURL ?? item.signedUrl;
      result[item.path] = signed ? `${SUPABASE_URL}/storage/v1${signed}` : item.path;
    }
    for (const p of toSign) if (!(p in result)) result[p] = p;
    return result;
  } catch (error) {
    console.error("[storage] Signed URL batch lekérdezés sikertelen:", error);
    for (const p of toSign) result[p] = p;
    return result;
  }
}
