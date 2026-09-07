import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import "../styles/dashboard.css";
import { BuyerRequestsWorkspace, type BuyerRequestRecord } from "./BuyerRequestsWorkspace.js";

const row: BuyerRequestRecord = {
  id: "req-1",
  publicCode: "PR-1001",
  title: "Industrial valves",
  status: "needs_clarification",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-02T10:00:00.000Z",
  itemSummary: "DN50 gate valve",
  extraItemCount: 2,
};

const longTitle =
  "Very long office equipment procurement request title that must wrap without colliding with status";

function renderWorkspace(
  props: Partial<ComponentProps<typeof BuyerRequestsWorkspace>> = {},
) {
  return render(
    <BuyerRequestsWorkspace
      rows={[row]}
      summary={[{ id: "total", label: "Total requests", value: 1 }]}
      query=""
      onQueryChange={() => undefined}
      status="all"
      onStatusChange={() => undefined}
      statusOptions={[{ value: "all", label: "All statuses" }]}
      sort="updated"
      onSortChange={() => undefined}
      sortOptions={[{ value: "updated", label: "Updated" }]}
      onOpen={() => undefined}
      newAction={<a href="/app/requests/new">New Request</a>}
      {...props}
    />,
  );
}

describe("BuyerRequestsWorkspace", () => {
  it("uses a content-aware desktop queue with a nowrap request id", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWorkspace({ onOpen, onCancelRequest: vi.fn() });
    expect(screen.getByRole("heading", { name: "My Requests" })).toBeInTheDocument();
    expect(container.querySelector(".hamd-buyer-requests__cols")).toBeTruthy();
    const queue = container.querySelector(".hamd-buyer-requests__queue-row");
    expect(queue).toBeTruthy();
    const cells = [
      queue?.querySelector(".hamd-buyer-requests__cell--reference .hamd-buyer-requests__code")?.textContent?.trim(),
      queue?.querySelector(".hamd-buyer-requests__cell--request .hamd-buyer-requests__title")?.textContent?.trim(),
      queue?.querySelector(".hamd-buyer-requests__cell--request .hamd-buyer-requests__items")?.textContent?.trim(),
      queue?.querySelector(".hamd-buyer-requests__cell--status")?.textContent?.trim(),
      queue?.querySelector(".hamd-buyer-requests__cell--updated")?.textContent?.trim(),
    ];
    expect(cells[0]).toBe("PR-1001");
    expect(cells[1]).toBe("Industrial valves");
    expect(cells[2]).toContain("DN50 gate valve");
    expect(cells[3]).toMatch(/clarification/i);
    expect(cells[4]).toMatch(/2026/);
    expect(queue?.querySelector(".hamd-buyer-requests__cell--actions")).toBeTruthy();
    const codes = container.querySelectorAll(".hamd-buyer-requests__code");
    expect(codes.length).toBe(2);
    expect(screen.getAllByText(/more information is required/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /PR-1001 Industrial valves/i })).toBeInTheDocument();
    await user.click(
      within(queue as HTMLElement).getByRole("heading", { name: "Industrial valves" }),
    );
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "req-1" }));
    await user.click(screen.getAllByRole("button", { name: /more actions for PR-1001/i })[0]);
    expect(screen.getByRole("menuitem", { name: "View request" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancel Request" })).toBeInTheDocument();
  });

  it("keeps mobile request id and status as separate flow columns", () => {
    const { container } = renderWorkspace({
      rows: [{ ...row, title: longTitle, publicCode: "PR-00842" }],
    });
    const head = container.querySelector(".hamd-buyer-requests__card-head");
    expect(head).toBeTruthy();
    expect(head?.querySelector(".hamd-buyer-requests__code")?.textContent).toBe("PR-00842");
    expect(head?.children[1]).toHaveClass("hamd-buyer-requests__status");
    expect(screen.getAllByText(longTitle).length).toBeGreaterThan(0);
    expect(container.querySelector(".hamd-buyer-requests__card-head .hamd-buyer-requests__status")).not.toHaveStyle({
      position: "absolute",
    });
  });

  it("confirms deletion with Keep Request and Delete Request", async () => {
    const onDeleteDraft = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWorkspace({
      rows: [{ ...row, status: "draft", title: "Draft valves" }],
      onDeleteDraft,
    });
    await user.click(screen.getAllByRole("button", { name: /more actions for PR-1001/i })[0]);
    await user.click(screen.getByRole("menuitem", { name: "Delete Request" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: /delete this request/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Keep Request" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete Request" }));
    await waitFor(() => expect(onDeleteDraft).toHaveBeenCalled());
  });

  it("removes cancelled requests after confirmed delete", async () => {
    const onRemoveCancelled = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWorkspace({
      rows: [{ ...row, status: "cancelled", title: "Cancelled valves" }],
      onRemoveCancelled,
    });
    await user.click(screen.getAllByRole("button", { name: /more actions for PR-1001/i })[0]);
    await user.click(screen.getByRole("menuitem", { name: "Delete Request" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete Request" }));
    await waitFor(() => expect(onRemoveCancelled).toHaveBeenCalled());
  });

  it("renders the empty state in the records area", () => {
    renderWorkspace({
      rows: [],
      emptyAction: <button type="button">Create Request</button>,
    });
    expect(screen.getByRole("heading", { name: /no requests yet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create request/i })).toBeInTheDocument();
    expect(screen.getByText(/create your first procurement request/i)).toBeInTheDocument();
  });

  it("keeps header and row skeletons in place while loading", () => {
    renderWorkspace({ rows: [], loading: true });
    expect(screen.getByRole("heading", { name: "My Requests" })).toBeInTheDocument();
    expect(screen.getByLabelText("Loading requests")).toBeInTheDocument();
  });

  it("shows an error state instead of the empty catalogue copy", () => {
    renderWorkspace({
      rows: [],
      error: "Network failed",
      onRetry: () => undefined,
    });
    expect(screen.getByRole("heading", { name: /couldn't load your requests/i })).toBeInTheDocument();
    expect(screen.queryByText(/no requests yet/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("shows reference, title, item, status, and updated as separate desktop cells", () => {
    const { container } = renderWorkspace({
      rows: [
        {
          ...row,
          publicCode: "PR-1437CD2C4B",
          title: "Electrical supply request",
          itemSummary: "Ball valve DN80",
          extraItemCount: 0,
          status: "submitted",
          updatedAt: "2026-09-02T10:00:00.000Z",
        },
      ],
    });
    const queue = container.querySelector(".hamd-buyer-requests__queue-row");
    expect(screen.getAllByText("PR-1437CD2C4B").length).toBe(2);
    expect(queue?.querySelector(".hamd-buyer-requests__cell--reference .hamd-buyer-requests__code")?.textContent?.trim()).toBe(
      "PR-1437CD2C4B",
    );
    expect(
      queue?.querySelector(".hamd-buyer-requests__cell--request .hamd-buyer-requests__title")
        ?.textContent?.trim(),
    ).toBe("Electrical supply request");
    expect(
      queue?.querySelector(".hamd-buyer-requests__cell--request .hamd-buyer-requests__items")
        ?.textContent?.trim(),
    ).toBe("Ball valve DN80");
    expect(queue?.querySelector(".hamd-buyer-requests__cell--status")?.textContent?.trim()).toBe(
      "Submitted",
    );
    const updated = queue?.querySelector(".hamd-buyer-requests__cell--updated");
    expect(updated?.getAttribute("dateTime")).toBe("2026-09-02T10:00:00.000Z");
    expect(updated?.textContent).toMatch(/2026/);
  });

  it("keeps chrome outside the scrolling records list", () => {
    const { container } = renderWorkspace();
    const list = container.querySelector(".hamd-buyer-requests__list");
    expect(list?.contains(screen.getByRole("heading", { name: "My Requests" }))).toBe(false);
  });
});
