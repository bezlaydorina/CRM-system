import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// Tetszőleges hosszú/formátumú CREDENTIALS_ENCRYPTION_KEY-ből mindig pontosan
// 32 bájtos AES-256 kulcsot képzünk (SHA-256 hash), hogy ne kelljen a
// felhasználónak pontosan 32 bájtos kulcsot generálnia.
const KEY = process.env.CREDENTIALS_ENCRYPTION_KEY ? createHash("sha256").update(process.env.CREDENTIALS_ENCRYPTION_KEY).digest() : null;

const PREFIX = "enc:v1:";

export function isEncryptionConfigured() {
  return Boolean(KEY);
}

/**
 * Nélküle (nincs CREDENTIALS_ENCRYPTION_KEY) síkszövegként tárol - csak
 * logol, sosem dob hibát -, hogy a belépési adatok funkció enélkül is
 * működjön, csak titkosítás nélkül.
 */
export function encryptSecret(plaintext: string): string {
  if (!KEY) {
    console.warn("[crypto] CREDENTIALS_ENCRYPTION_KEY nincs beállítva - bizalmas adat titkosítás nélkül kerül tárolásra.");
    return plaintext;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Visszafelé kompatibilis: egy korábbi (titkosítás bevezetése előtti)
 * síkszöveges értéket érintetlenül visszaad - csak az "enc:v1:" prefixű
 * értékeket próbálja visszafejteni.
 */
export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  if (!KEY) return "(titkosítva - CREDENTIALS_ENCRYPTION_KEY hiányzik a visszafejtéshez)";

  try {
    const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch (error) {
    console.error("[crypto] Visszafejtés sikertelen:", error);
    return "(visszafejtés sikertelen - lehet, hogy megváltozott a CREDENTIALS_ENCRYPTION_KEY)";
  }
}
