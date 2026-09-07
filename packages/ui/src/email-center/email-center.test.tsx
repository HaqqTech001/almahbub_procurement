import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailCenterWorkspace } from "./EmailCenterWorkspace.js";
import { emailTemplatesFixture } from "./fixtures.js";
import {
  EMAIL_TEMPLATE_KINDS,
  emptyEmailFilters,
  filterEmailTemplates,
  renderEmailTemplate,
  sampleVariablesFrom,
} from "./types.js";

describe("email-center helpers", () => {
  it("covers all mission template kinds in fixtures", () => {
    const kinds = new Set(emailTemplatesFixture.map((t) => t.kind));
    for (const kind of EMAIL_TEMPLATE_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
  });

  it("filters and renders variables", () => {
    expect(
      filterEmailTemplates(emailTemplatesFixture, {
        ...emptyEmailFilters(),
        kind: "welcome",
      }).map((t) => t.id),
    ).toEqual(["em-welcome"]);
    const welcome = emailTemplatesFixture[0]!;
    const vars = sampleVariablesFrom(welcome.variables, {
      first_name: "<script>alert(1)</script>",
    });
    expect(renderEmailTemplate(welcome.subject, vars)).toContain(
      "&lt;script&gt;",
    );
    expect(renderEmailTemplate(welcome.subject, vars)).not.toContain(
      "<script>",
    );
  });
});

describe("EmailCenterWorkspace", () => {
  it("covers preview, variables, schedule, test send, and versions", async () => {
    const user = userEvent.setup();
    const onSaveDraft = vi.fn().mockResolvedValue(undefined);
    const onPreview = vi.fn().mockResolvedValue(undefined);
    const onSchedule = vi.fn().mockResolvedValue(undefined);
    const onTestSend = vi.fn().mockResolvedValue(undefined);
    const onRestoreVersion = vi.fn().mockResolvedValue(undefined);

    render(
      <EmailCenterWorkspace
        templates={emailTemplatesFixture}
        onSaveDraft={onSaveDraft}
        onPreview={onPreview}
        onSchedule={onSchedule}
        onTestSend={onTestSend}
        onRestoreVersion={onRestoreVersion}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /enterprise email center/i }),
    ).toBeInTheDocument();

    const directory = screen.getByLabelText(/email templates/i);
    expect(
      within(directory).getByRole("button", { name: /welcome/i }),
    ).toBeInTheDocument();

    await user.selectOptions(
      within(directory).getByLabelText(/^kind$/i),
      "wedding_congratulations",
    );
    expect(
      within(directory).getByRole("button", {
        name: /wedding congratulations/i,
      }),
    ).toBeInTheDocument();

    await user.selectOptions(within(directory).getByLabelText(/^kind$/i), "all");
    await user.click(
      within(directory).getByRole("button", { name: /welcome/i }),
    );

    const detail = screen.getByLabelText(/email template detail/i);
    const tabs = within(detail).getByLabelText(/email template sections/i);

    await user.click(within(tabs).getByRole("button", { name: /^preview$/i }));
    expect(within(detail).getByLabelText(/email preview/i)).toBeInTheDocument();
    await user.click(
      within(detail).getByRole("button", { name: /open host preview/i }),
    );
    expect(onPreview).toHaveBeenCalled();

    await user.click(within(tabs).getByRole("button", { name: /variables/i }));
    expect(within(detail).getByText(/first_name/i)).toBeInTheDocument();

    await user.click(within(tabs).getByRole("button", { name: /scheduling/i }));
    fireEvent.change(within(detail).getByLabelText(/schedule for/i), {
      target: { value: "2030-01-15T10:00" },
    });
    await user.click(
      within(detail).getByRole("button", { name: /save schedule/i }),
    );
    expect(onSchedule).toHaveBeenCalled();

    await user.click(within(tabs).getByRole("button", { name: /test send/i }));
    fireEvent.change(within(detail).getByLabelText(/recipient email/i), {
      target: { value: "qa@example.com" },
    });
    await user.click(
      within(detail).getByRole("button", { name: /send test email/i }),
    );
    expect(onTestSend).toHaveBeenCalled();

    await user.click(
      within(tabs).getByRole("button", { name: /version history/i }),
    );
    expect(within(detail).getByText(/initial welcome copy/i)).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    render(<EmailCenterWorkspace templates={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
