import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Environment } from "../../../../config/env.js";

const verifyIdToken = vi.fn();

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdToken;
  },
}));

const { isGoogleOAuthConfigured, isGoogleSignInConfigured, verifyGoogleIdToken } =
  await import("./google-oauth.js");

function env(partial: Partial<Environment>): Environment {
  return partial as Environment;
}

function ticket(payload: Record<string, unknown>) {
  return { getPayload: () => payload };
}

const validPayload = {
  sub: "google-sub-1",
  email: "buyer@example.com",
  email_verified: true,
  aud: "client.apps.googleusercontent.com",
  iss: "https://accounts.google.com",
  given_name: "Ada",
  family_name: "Buyer",
};

describe("google oauth config", () => {
  it("is disabled without credentials", () => {
    expect(
      isGoogleOAuthConfigured(
        env({
          GOOGLE_CLIENT_ID: undefined,
          GOOGLE_OAUTH_CLIENT_ID: undefined,
          GOOGLE_OAUTH_CLIENT_SECRET: undefined,
        }),
      ),
    ).toBe(false);
    expect(
      isGoogleSignInConfigured(
        env({
          GOOGLE_CLIENT_ID: undefined,
          GOOGLE_OAUTH_CLIENT_ID: undefined,
        }),
      ),
    ).toBe(false);
  });

  it("enables GIS with client id only", () => {
    expect(
      isGoogleSignInConfigured(
        env({
          GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com",
        }),
      ),
    ).toBe(true);
    expect(
      isGoogleOAuthConfigured(
        env({
          GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com",
          GOOGLE_OAUTH_CLIENT_SECRET: undefined,
        }),
      ),
    ).toBe(false);
  });

  it("enables the legacy redirect when a server secret is present", () => {
    expect(
      isGoogleOAuthConfigured(
        env({
          GOOGLE_OAUTH_CLIENT_ID: "client.apps.googleusercontent.com",
          GOOGLE_OAUTH_CLIENT_SECRET: "secret",
        }),
      ),
    ).toBe(true);
  });
});

describe("verifyGoogleIdToken", () => {
  const configured = env({
    GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com",
  });

  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it("rejects an invalid token", async () => {
    verifyIdToken.mockRejectedValue(new Error("invalid token"));
    await expect(
      verifyGoogleIdToken("not-a.real.jwt", configured),
    ).rejects.toMatchObject({ code: "GOOGLE_OAUTH_FAILED", statusCode: 401 });
  });

  it("rejects an expired token", async () => {
    verifyIdToken.mockRejectedValue(new Error("Token used too late"));
    await expect(
      verifyGoogleIdToken("expired.token.value", configured),
    ).rejects.toMatchObject({ code: "GOOGLE_OAUTH_FAILED" });
  });

  it("rejects a wrong audience", async () => {
    verifyIdToken.mockResolvedValue(
      ticket({ ...validPayload, aud: "other-client.apps.googleusercontent.com" }),
    );
    await expect(
      verifyGoogleIdToken("aaa.bbb.ccc", configured),
    ).rejects.toMatchObject({ code: "GOOGLE_OAUTH_FAILED" });
  });

  it("rejects a tampered token", async () => {
    verifyIdToken.mockRejectedValue(new Error("Wrong number of segments"));
    await expect(
      verifyGoogleIdToken("tampered.payload.sig", configured),
    ).rejects.toMatchObject({ code: "GOOGLE_OAUTH_FAILED" });
  });

  it("rejects an unverified Google email", async () => {
    verifyIdToken.mockResolvedValue(
      ticket({ ...validPayload, email_verified: false }),
    );
    await expect(
      verifyGoogleIdToken("aaa.bbb.ccc", configured),
    ).rejects.toMatchObject({ code: "GOOGLE_EMAIL_NOT_VERIFIED" });
  });

  it("returns claims from a valid Google ID token", async () => {
    verifyIdToken.mockResolvedValue(ticket(validPayload));
    await expect(verifyGoogleIdToken("aaa.bbb.ccc", configured)).resolves.toEqual({
      sub: "google-sub-1",
      email: "buyer@example.com",
      email_verified: true,
      given_name: "Ada",
      family_name: "Buyer",
    });
  });
});
