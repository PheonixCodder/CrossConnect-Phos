"use server"
import { encrypt } from "@/lib/crypto";

export async function encryptPayload(data: Record<string, string>) {
  // Encryption happens safely on the server where process.env is secure
  const encrypted: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    encrypted[key] = encrypt(value);
  }
  return encrypted;
}
