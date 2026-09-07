import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { NotificationDetailView } from "./NotificationDetailView.js";
import type { InboxNotification } from "./types.js";

const row: InboxNotification = {
  id: "n-1",
  type: "procurement",
  priority: "high",
  status: "unread",
  title: "Clarification requested",
  body: "Please confirm the delivery window for this request.",
  createdAt: "2026-09-01T10:00:00.000Z",
  metadata: { requestId: "req-1", publicCode: "PR-1001" },
};

describe("NotificationDetailView", () => {
  it("shows human copy and a request CTA without raw JSON", () => {
    const onOpenRelated = vi.fn();
    render(
      <NotificationDetailView notification={row} audience="app" onOpenRelated={onOpenRelated} />,
    );
    expect(screen.getByRole("heading", { name: "Clarification requested" })).toBeInTheDocument();
    expect(screen.getByText("Please confirm the delivery window for this request.")).toBeInTheDocument();
    expect(screen.getByText(/PR-1001/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\{"/);
  });

  it("navigates through the related CTA", async () => {
    const onOpenRelated = vi.fn();
    const user = userEvent.setup();
    render(
      <NotificationDetailView notification={row} audience="app" onOpenRelated={onOpenRelated} />,
    );
    await user.click(screen.getByRole("button", { name: "View Request" }));
    expect(onOpenRelated).toHaveBeenCalled();
  });
});
