import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// Load key once outside the class/functions
const getKey = () => {
  const keyHex = process.env.CREDENTIALS_ENCRYPTION_KEY;

  if (!keyHex) {
    // This error will now show up in your SERVER logs, not the browser console
    throw new Error("CREDENTIALS_ENCRYPTION_KEY environment variable is required");
  }

  // Ensure we handle the "key" prefix if it exists in your string
  const cleanHex = keyHex.startsWith('key') ? keyHex.slice(3) : keyHex;
  const key = Buffer.from(cleanHex, "hex");

  if (key.length !== 32) {
    throw new Error(`Invalid key length: ${key.length}. Need 64 hex chars.`);
  }
  return key;
};

export const encrypt = (payload: any) => {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    keyVersion: 1,
  };
};

export const decrypt = (encrypted: {
  ciphertext: string;
  iv: string;
  tag: string;
}) => {
  if (!encrypted.ciphertext || !encrypted.iv || !encrypted.tag) {
    throw new Error("Invalid encrypted payload structure");
  }

  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encrypted.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
};
