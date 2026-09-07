import { createHash, randomBytes, randomInt } from "node:crypto";

import argon2 from "argon2";

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function newOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Six-digit numeric OTP for email verification UI. */
export function newOtpCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

/** Dummy Argon2id hash so missing users still burn verify time. */
export const dummyPasswordHash =
  "$argon2id$v=19$m=65536,p=1,t=3$m9nAPrzwvB5OnCLqyKKgIA$rQe5z57MoE3ignPXNAvwwnaVRYpJBmjf+IQTzYcN0OU";

export async function verifyPasswordConstantTime(
  credentials: { readonly passwordHash: string; readonly algorithm: string } | null | undefined,
  password: string,
): Promise<boolean> {
  const hash =
    credentials?.algorithm === "argon2id" && credentials.passwordHash
      ? credentials.passwordHash
      : dummyPasswordHash;
  try {
    const matches = await argon2.verify(hash, password);
    return Boolean(credentials?.algorithm === "argon2id" && matches);
  } catch {
    return false;
  }
}

export function slugifyOrg(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : "organization";
}
