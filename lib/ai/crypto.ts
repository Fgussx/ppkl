import crypto from "crypto";

const VERSION = "v1";

function getSecretKey() {
  const secret = process.env.AI_CONFIG_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error("AI_CONFIG_SECRET belum diisi atau terlalu pendek.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string) {
  const iv = crypto.randomBytes(12);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(":");
}

export function decryptApiKey(payload: string) {
  const [version, ivRaw, tagRaw, encryptedRaw] = payload.split(":");

  if (version !== VERSION || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Format API key terenkripsi tidak valid.");
  }

  const key = getSecretKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivRaw, "base64url")
  );

  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
