import { render, screen } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth as useAuthFromProvider } from "./AuthProvider.js";
import { useAuth as useAuthFromContext } from "./auth-context.js";

vi.mock("../api/auth-client.js", () => ({
  loginRequest: vi.fn(),
  refreshRequest: vi.fn().mockRejectedValue(new Error("no session")),
  logoutRequest: vi.fn(),
  logoutEverywhereRequest: vi.fn(),
  meRequest: vi.fn(),
  validateRequest: vi.fn(),
  forgotPasswordRequest: vi.fn(),
  resetPasswordRequest: vi.fn(),
  googleOAuthStatusRequest: vi.fn().mockResolvedValue({ enabled: false }),
  googleOAuthStartUrl: vi.fn(() => "/api/v1/auth/google"),
}));

const here = dirname(fileURLToPath(import.meta.url));
const opsSrc = join(here, "../..");

function walk(dir: string, acc: string[]): void {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) acc.push(full);
  }
}

describe("ops auth context identity", () => {
  it("exports the same useAuth function from AuthProvider and auth-context", () => {
    expect(useAuthFromProvider).toBe(useAuthFromContext);
  });

  it("reads the mounted AuthProvider from the isolated context hook", () => {
    function Probe() {
      const fromContext = useAuthFromContext();
      const fromProvider = useAuthFromProvider();
      expect(fromContext).toBe(fromProvider);
      return <span data-testid="status">{fromContext.status}</span>;
    }

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status")).toBeInTheDocument();
  });

  it("WeddingCampaignPage and main.tsx share the canonical ops session context", () => {
    const main = readFileSync(join(opsSrc, "main.tsx"), "utf8");
    const page = readFileSync(join(opsSrc, "modules/WeddingCampaignPage.tsx"), "utf8");
    const provider = readFileSync(join(here, "AuthProvider.tsx"), "utf8");

    expect(main.match(/<AuthProvider>/g)?.length).toBe(1);
    expect(main).toMatch(/from ["']\.\/auth\/session\/AuthProvider\.js["']/);
    expect(page).toMatch(/from ["']\.\.\/auth\/session\/auth-context\.js["']/);
    expect(page).not.toMatch(/<AuthProvider/);
    expect(provider).toMatch(/from ["']\.\/auth-context\.js["']/);
    expect(provider).not.toMatch(/google\/gis|loginWithGoogle|apps\/web/);
    expect(page).not.toMatch(/apps\/web|google\/gis|@hamd\/ui\/auth/);
  });

  it("does not import buyer-web AuthProvider or GIS into ops", () => {
    const files: string[] = [];
    walk(opsSrc, files);
    const leaks = files.filter((file) => {
      const text = readFileSync(file, "utf8");
      return /apps\/web\/.*AuthProvider/.test(text) || /auth\/google\/gis/.test(text);
    });
    expect(leaks).toEqual([]);
  });
});
