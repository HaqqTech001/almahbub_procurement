import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActivityFeed, formatActivityWhen } from "./ActivityFeed.js";

describe("ActivityFeed", () => {
  it("renders designed rows without list markers and navigates", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ActivityFeed
        items={[
          {
            id: "1",
            kind: "request",
            title: "Request submitted",
            detail: "PR-10241",
            href: "/app/requests/r-1",
            at: new Date().toISOString(),
          },
          {
            id: "2",
            kind: "clarification",
            title: "Clarification requested",
            detail: "Almahbub needs more information",
            href: "/app/requests/r-2#clarification",
            at: new Date(Date.now() - 86_400_000).toISOString(),
          },
        ]}
        viewAllHref="/app/notifications"
        onNavigate={onNavigate}
      />,
    );

    expect(container.querySelector("ul, ol")).toBeNull();
    expect(container.querySelector(".hamd-activity__list")).toBeTruthy();
    expect(container.querySelectorAll(".hamd-activity__row")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /request submitted/i }));
    expect(onNavigate).toHaveBeenCalledWith("/app/requests/r-1");
    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute(
      "href",
      "/app/notifications",
    );
  });

  it("shows a compact empty state", () => {
    render(<ActivityFeed items={[]} />);
    expect(screen.getByText("No recent activity yet")).toBeInTheDocument();
    expect(
      screen.getByText(/your procurement updates will appear here/i),
    ).toBeInTheDocument();
  });

  it("limits visible rows to seven", () => {
    render(
      <ActivityFeed
        items={Array.from({ length: 12 }).map((_, index) => ({
          id: String(index),
          kind: "status" as const,
          title: `Event ${index}`,
          href: `/app/requests/${index}`,
          at: new Date().toISOString(),
        }))}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });

  it("formats relative times", () => {
    const now = Date.parse("2026-09-02T12:00:00.000Z");
    expect(formatActivityWhen("2026-09-02T11:50:00.000Z", now)).toBe("10 min ago");
    expect(formatActivityWhen("2026-09-01T12:00:00.000Z", now)).toBe("Yesterday");
  });
});
