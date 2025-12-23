import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const credentialsKey = createHash("sha256")
  .update(process.env.CREDENTIALS_SECRET || "dev-credentials-secret")
  .digest();

export function encryptCredentials(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", credentialsKey, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptCredentials(encryptedBase64: string): string {
  const buf = Buffer.from(encryptedBase64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", credentialsKey, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
}

export function decryptCredentialsSafe(encryptedBase64: string | null): string | null {
  if (!encryptedBase64) {
    return null;
  }
  try {
    return decryptCredentials(encryptedBase64);
  } catch {
    return null;
  }
}

export function decodeCredentials(encryptedBase64: string | null): Record<string, unknown> {
  if (!encryptedBase64) {
    return {};
  }
  const decrypted = decryptCredentialsSafe(encryptedBase64);
  if (!decrypted) {
    return {};
  }
  try {
    const parsed = JSON.parse(decrypted) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { raw: decrypted };
  } catch {
    return { raw: decrypted };
  }
}

