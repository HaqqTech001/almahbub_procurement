import { describe, expect, it, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlatformConfigWorkspace } from "./PlatformConfigWorkspace.js";
import {
  platformConfigChangeLogFixture,
  platformConfigDocumentFixture,
  platformConfigVersionsFixture,
} from "./fixtures.js";
import {
  PLATFORM_CONFIG_SECTIONS,
  platformConfigSectionLabel,
  validatePlatformConfig,
} from "./types.js";

describe("platform-config helpers", () => {
  it("labels every mission section", () => {
    for (const section of PLATFORM_CONFIG_SECTIONS) {
      expect(platformConfigSectionLabel(section).length).toBeGreaterThanOrEqual(
        2,
      );
    }
  });

  it("validates required fields", () => {
    const issues = validatePlatformConfig({
      ...platformConfigDocumentFixture.values,
      siteName: "",
      supportEmail: "not-an-email",
    });
    expect(issues.some((i) => i.field === "siteName")).toBe(true);
    expect(issues.some((i) => i.field === "supportEmail")).toBe(true);
  });
});

describe("PlatformConfigWorkspace", () => {
  it("covers sections, save, validation, versions, and audit log", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onRollback = vi.fn().mockResolvedValue(undefined);
    const onValidate = vi.fn();

    render(
      <PlatformConfigWorkspace
        document={platformConfigDocumentFixture}
        versions={platformConfigVersionsFixture}
        changeLog={platformConfigChangeLogFixture}
        onSave={onSave}
        onRollback={onRollback}
        onValidate={onValidate}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /platform configuration/i }),
    ).toBeInTheDocument();

    const nav = screen.getByLabelText(/settings sections/i);
    await user.click(within(nav).getByRole("button", { name: /^seo$/i }));
    expect(screen.getByLabelText(/default title/i)).toBeInTheDocument();

    await user.click(within(nav).getByRole("button", { name: /^general$/i }));
    const siteName = screen.getByLabelText(/site name/i);
    await user.clear(siteName);
    await user.type(siteName, "Almahbub Ops");

    const save = screen.getByRole("button", { name: /^save$/i });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);
    expect(onSave).toHaveBeenCalled();
    expect(onValidate).toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: /rollback \/ versions/i }),
    );
    expect(screen.getByText(/enabled mfa/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /audit logging/i }));
    expect(screen.getByText(/updated seo defaults/i)).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    render(
      <PlatformConfigWorkspace
        document={platformConfigDocumentFixture}
        loading
      />,
    );
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
