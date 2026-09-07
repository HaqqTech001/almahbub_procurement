import { afterEach, describe, expect, it } from "vitest";

import { parseEnvironment } from "../../../../config/env.js";
import {
  ConsoleEmailGateway,
  ResilientAuthEmailGateway,
  buildWelcomeVerificationEmail,
  createAuthEmailGateway,
  createEmailBrand,
  shouldUseResendAuthEmail,
} from "./auth-email.js";

const baseEnv = {
  NODE_ENV: "development",
  JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
} as const;

describe("auth email delivery", () => {
  const previousAuth = process.env.AUTH_EMAIL_PROVIDER;
  const previousEmail = process.env.EMAIL_PROVIDER;

  afterEach(() => {
    if (previousAuth === undefined) delete process.env.AUTH_EMAIL_PROVIDER;
    else process.env.AUTH_EMAIL_PROVIDER = previousAuth;
    if (previousEmail === undefined) delete process.env.EMAIL_PROVIDER;
    else process.env.EMAIL_PROVIDER = previousEmail;
  });

  it("uses console when Resend is not configured", () => {
    delete process.env.AUTH_EMAIL_PROVIDER;
    delete process.env.EMAIL_PROVIDER;
    const environment = parseEnvironment({ ...baseEnv, NODE_ENV: "development" });
    expect(shouldUseResendAuthEmail(environment)).toBe(false);
    expect(createAuthEmailGateway(environment)).toBeInstanceOf(
      ConsoleEmailGateway,
    );
  });

  it("uses Resend in development when keys are set", () => {
    delete process.env.AUTH_EMAIL_PROVIDER;
    delete process.env.EMAIL_PROVIDER;
    const environment = parseEnvironment({
      ...baseEnv,
      NODE_ENV: "development",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "noreply@example.com",
    });
    expect(shouldUseResendAuthEmail(environment)).toBe(true);
    expect(createAuthEmailGateway(environment)).toBeInstanceOf(
      ResilientAuthEmailGateway,
    );
  });

  it("honors EMAIL_PROVIDER with surrounding whitespace as an alias", () => {
    delete process.env.AUTH_EMAIL_PROVIDER;
    process.env.EMAIL_PROVIDER = " resend ";
    const environment = parseEnvironment({
      ...baseEnv,
      NODE_ENV: "development",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "noreply@example.com",
    });
    expect(shouldUseResendAuthEmail(environment)).toBe(true);
  });

  it("does not use Resend in tests unless explicitly requested", () => {
    delete process.env.AUTH_EMAIL_PROVIDER;
    delete process.env.EMAIL_PROVIDER;
    const environment = parseEnvironment({
      ...baseEnv,
      NODE_ENV: "test",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "noreply@example.com",
    });
    expect(shouldUseResendAuthEmail(environment)).toBe(false);
  });

  it("builds a welcome verification email that includes the OTP", () => {
    const mail = buildWelcomeVerificationEmail({
      brand: createEmailBrand({
        APP_PUBLIC_URL: "http://127.0.0.1:3000",
        EMAIL_FROM: "noreply@example.com",
      }),
      firstName: "Ada",
      otp: "211072",
      verifyUrl: "http://127.0.0.1:3000/verify-email?token=211072",
    });
    expect(mail.subject).toMatch(/welcome/i);
    expect(mail.text).toMatch(/Verification code: 211072/);
    expect(mail.html).toContain("211072");
    expect(mail.text).toMatch(/Do not share this code/);
    expect(mail.subject).toMatch(/Almahbub International/);
    expect(mail.html).not.toMatch(/Hamd Genesis/i);
  });
});
