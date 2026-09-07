import { describe, expect, it } from "vitest";

import {
  googleCredentialSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../api/auth-schemas.js";

describe("auth schemas", () => {
  it("enforces strong passwords on register and reset", () => {
    expect(() =>
      registerSchema.parse({
        email: "buyer@example.com",
        password: "weak",
        firstName: "Ada",
        lastName: "Buyer",
        companyName: "Ada Co",
        agreeToTerms: true,
      }),
    ).toThrow();

    const ok = registerSchema.parse({
      email: "Buyer@Example.com",
      password: "SecurePass1",
      firstName: "Ada",
      lastName: "Buyer",
      companyName: "Ada Co",
      agreeToTerms: true,
    });
    expect(ok.email).toBe("buyer@example.com");

    expect(() =>
      resetPasswordSchema.parse({ token: "abc123", password: "short" }),
    ).toThrow();
  });

  it("accepts remember-me device fields on login", () => {
    const parsed = loginSchema.parse({
      email: "buyer@example.com",
      password: "SecurePass1",
      rememberMe: true,
      deviceFingerprint: "fingerprint-123456",
      deviceName: "Chrome",
      devicePlatform: "Win32",
    });
    expect(parsed.rememberMe).toBe(true);
    expect(parsed.deviceFingerprint).toBe("fingerprint-123456");
  });

  it("accepts a GIS credential and rejects client-sent profile objects", () => {
    const parsed = googleCredentialSchema.parse({
      credential: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
    });
    expect(parsed.credential).toBe("eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.signature");
    expect(() =>
      googleCredentialSchema.parse({
        credential: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
        role: "admin",
        profile: { email: "spoof@example.com" },
      }),
    ).toThrow();
  });
});
