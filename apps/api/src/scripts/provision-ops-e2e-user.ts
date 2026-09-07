/**
 * Register + verify a temporary buyer via the live API and console OTP.
 * Does not grant ops:access — run grant-ops-access.ts after the buyer 403 check.
 */
import { readFile } from "node:fs/promises";

const apiBase = (process.env.HAMD_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
const password = process.env.HAMD_OPS_E2E_PASSWORD ?? "";
const email = process.env.HAMD_OPS_E2E_EMAIL ?? "";
const logFile = process.env.HAMD_API_LOG_FILE ?? "";

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as {
    data?: unknown;
    error?: { code?: string; message?: string };
  };
  if (!response.ok) {
    throw new Error(
      `${path} ${response.status} ${json.error?.code ?? ""} ${json.error?.message ?? ""}`.trim(),
    );
  }
  return json.data;
}

async function readOtp(targetEmail: string): Promise<string> {
  if (!logFile) throw new Error("HAMD_API_LOG_FILE is required to read the console OTP.");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const log = await readFile(logFile, "utf8").catch(() => "");
    const matches = [...log.matchAll(/\[auth-email\] to=([^\s]+)[\s\S]{0,500}/g)];
    const block = matches
      .reverse()
      .find((match) => match[1]?.toLowerCase() === targetEmail.toLowerCase())?.[0];
    const code =
      block?.match(/verification code is (\d{6})/i)?.[1] ??
      block?.match(/verification code:\s*(\d{6})/i)?.[1];
    if (code) return code;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`OTP not found in API log for ${targetEmail}`);
}

async function main(): Promise<void> {
  if (!email || !password) {
    throw new Error("HAMD_OPS_E2E_EMAIL and HAMD_OPS_E2E_PASSWORD are required.");
  }
  await postJson("/api/v1/auth/register", {
    email,
    password,
    firstName: "Phase",
    lastName: "SixA",
    companyName: "Phase6A Verification",
    agreeToTerms: true,
  });
  const code = await readOtp(email);
  await postJson("/api/v1/auth/verify-email", { code, email });
  const login = (await postJson("/api/v1/auth/login", { email, password })) as {
    accessToken: string;
  };
  const buyerOps = await fetch(`${apiBase}/api/v1/ops/products`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${login.accessToken}`,
    },
  });
  console.info(
    JSON.stringify({ email, verified: true, buyerOpsStatus: buyerOps.status }, null, 2),
  );
  if (buyerOps.status !== 403) {
    throw new Error(`Expected buyer 403 from /ops/products, got ${buyerOps.status}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
