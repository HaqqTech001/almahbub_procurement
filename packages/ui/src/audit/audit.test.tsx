import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuditWorkspace } from "./AuditWorkspace.js";
import { auditEventsFixture, auditRetentionFixture } from "./fixtures.js";
import {
  AUDIT_CATEGORIES,
  emptyAuditFilters,
  filterAuditEvents,
  retentionDaysFor,
} from "./types.js";

describe("audit helpers", () => {
  it("covers all mission log categories in fixtures", () => {
    const cats = new Set(auditEventsFixture.map((e) => e.category));
    for (const category of AUDIT_CATEGORIES) {
      expect(cats.has(category)).toBe(true);
    }
  });

  it("filters and resolves retention", () => {
    expect(
      filterAuditEvents(auditEventsFixture, {
        ...emptyAuditFilters(),
        category: "payments",
      }).every((e) => e.category === "payments"),
    ).toBe(true);
    expect(retentionDaysFor(auditRetentionFixture, "payments")).toBeGreaterThan(
      0,
    );
  });
});

describe("AuditWorkspace", () => {
  it("renders timeline, filters, export, and retention", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn().mockResolvedValue(undefined);
    const onSelect = vi.fn();

    render(
      <AuditWorkspace
        events={auditEventsFixture}
        retention={auditRetentionFixture}
        onExport={onExport}
        onSelect={onSelect}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /enterprise audit/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to audit detail/i }),
    ).toBeInTheDocument();

    const timeline = screen.getByRole("list", { name: /^audit events$/i });
    expect(
      within(timeline).getByRole("button", {
        name: /someone signed in successfully/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^json$/i }));
    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({ format: "json" }),
    );

    await user.click(screen.getByRole("button", { name: /^retention$/i }));
    expect(screen.getByText(/default retention/i)).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    render(<AuditWorkspace events={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
