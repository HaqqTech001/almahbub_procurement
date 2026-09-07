import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProcurementWorkspace } from "./ProcurementWorkspace.js";
import { RequestCreateWizard } from "./RequestCreateWizard.js";
import { procurementRequestsFixture } from "./fixtures.js";
import {
  availableCommands,
  emptyProcurementFilters,
  filterProcurementRequests,
  missionPhaseForStatus,
  procurementStatusLabel,
  procurementActionRequiredCopy,
} from "./types.js";

const testCatalogProducts = [
  {
    id: "cat-valve-dn50",
    name: "Gate valve DN50 PN16",
    category: "Industrial",
    unit: "pcs",
  },
];

describe("procurement helpers", () => {
  it("maps mission phases and available commands from API statuses", () => {
    expect(procurementStatusLabel("quote_issued")).toBe("Quotation available");
    expect(procurementActionRequiredCopy("needs_clarification")).toBe("Provide clarification");
    expect(procurementStatusLabel("declined")).toBe("Rejected");
    expect(missionPhaseForStatus("sourcing")).toBe("Pending Supplier");
    expect(availableCommands("draft")).toContain("submit");
    expect(availableCommands("quote_issued")).toEqual(
      expect.arrayContaining(["approve", "decline", "request_revision"]),
    );
    const drafts = filterProcurementRequests(procurementRequestsFixture, {
      ...emptyProcurementFilters(),
      status: "draft",
    });
    expect(drafts.every((r) => r.status === "draft")).toBe(true);
  });
});

describe("ProcurementWorkspace", () => {
  it("renders directory, timeline, and collaboration facets", async () => {
    const user = userEvent.setup();
    render(<ProcurementWorkspace requests={procurementRequestsFixture} />);

    expect(
      screen.getByRole("heading", { name: /procurement requests/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to request detail/i }),
    ).toHaveAttribute("href", "#hamd-pr-detail");

    const detail = screen.getByLabelText(/request detail/i);
    expect(
      within(detail).getByRole("heading", {
        name: /Industrial valves for Lagos Free Zone/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(detail).getAllByText(/Pending supplier/i).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /^timeline$/i }));
    expect(within(detail).getByText(/start sourcing/i)).toBeInTheDocument();
    expect(within(detail).getByText(/approve for sourcing/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^comments$/i }));
    expect(within(detail).getByText(/warehouse gate code/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^attachments$/i }));
    expect(within(detail).getByText(/packing-list\.pdf/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^internal notes$/i }));
    expect(within(detail).getByText(/Prefer NPV Industrial/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^history$/i }));
    await user.click(screen.getByRole("button", { name: /^approvals$/i }));
    expect(within(detail).getByText(/Accepted into sourcing queue/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^notifications$/i }));
    expect(within(detail).getByText(/Sourcing started on PR-1042/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^activity$/i }));
    expect(within(detail).getByText(/Moved to sourcing/i)).toBeInTheDocument();
  });

  it("searches requests and runs lifecycle transitions", async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn().mockResolvedValue(undefined);
    render(
      <ProcurementWorkspace
        requests={procurementRequestsFixture}
        onTransition={onTransition}
      />,
    );

    await user.type(screen.getByLabelText(/search requests/i), "PR-881");
    const list = screen.getByRole("list", { name: /^requests$/i });
    expect(within(list).getByText(/Specialty solvents/i)).toBeInTheDocument();
    await user.click(within(list).getByText(/Specialty solvents/i));

    const actions = screen.getByLabelText(/lifecycle actions/i);
    await user.click(within(actions).getByRole("button", { name: /^approve quote$/i }));
    expect(onTransition).toHaveBeenCalledWith(
      "pr-881",
      "approve",
      expect.objectContaining({ rowVersion: 6 }),
    );
  });

  it("autosaves draft edits and posts comments/notes", async () => {
    const user = userEvent.setup();
    const onAutosave = vi.fn().mockResolvedValue(undefined);
    const onAddComment = vi.fn().mockResolvedValue(undefined);
    const onAddInternalNote = vi.fn().mockResolvedValue(undefined);

    render(
      <ProcurementWorkspace
        requests={procurementRequestsFixture}
        onAutosave={onAutosave}
        onAddComment={onAddComment}
        onAddInternalNote={onAddInternalNote}
      />,
    );

    const list = screen.getByRole("list", { name: /^requests$/i });
    await user.click(within(list).getByText(/Office packaging/i));

    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), "Updated packaging draft");

    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });
    expect(onAutosave).toHaveBeenCalled();
    expect(onAutosave.mock.calls[0]?.[0]).toBe("pr-990");

    await user.click(within(list).getByText(/Industrial valves/i));
    await user.click(screen.getByRole("button", { name: /^comments$/i }));
    await user.type(screen.getByLabelText(/add comment/i), "Thanks for the update");
    await user.click(screen.getByRole("button", { name: /post comment/i }));
    expect(onAddComment).toHaveBeenCalledWith(
      "pr-1042",
      "Thanks for the update",
    );

    await user.click(screen.getByRole("button", { name: /^internal notes$/i }));
    await user.type(
      screen.getByLabelText(/add internal note/i),
      "Keep margin offline",
    );
    await user.click(screen.getByRole("button", { name: /save note/i }));
    expect(onAddInternalNote).toHaveBeenCalled();
  });

  it("renders loading skeleton", () => {
    render(<ProcurementWorkspace requests={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("deletes a draft after inline confirmation", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <ProcurementWorkspace
        requests={procurementRequestsFixture}
        onDelete={onDelete}
      />,
    );

    const list = screen.getByRole("list", { name: /^requests$/i });
    await user.click(within(list).getByText(/Office packaging/i));
    await user.click(screen.getByRole("button", { name: /^delete request$/i }));
    await user.click(screen.getByRole("button", { name: /^confirm delete$/i }));
    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pr-990", status: "draft" }),
    );
  });
});

describe("RequestCreateWizard", () => {
  it("walks products → requirements with validation and catalog add", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <RequestCreateWizard
        autosaveMs={10_000}
        onSubmit={onSubmit}
        catalogProducts={testCatalogProducts}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /new procurement request/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save for later" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Save and continue later")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least one product/i);

    await user.click(
      screen.getByRole("checkbox", { name: /select gate valve dn50/i }),
    );
    await user.click(screen.getByRole("button", { name: /add selected/i }));
    expect(screen.getByDisplayValue(/gate valve dn50/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText(/request title/i)).toBeInTheDocument();
  });

  it("blocks Next on empty products with visible errors", async () => {
    const user = userEvent.setup();
    render(
      <RequestCreateWizard
        autosaveMs={10_000}
        catalogProducts={testCatalogProducts}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least one product/i);
  });

  it("does not advance when catalog items are only checked", async () => {
    const user = userEvent.setup();
    render(
      <RequestCreateWizard
        autosaveMs={10_000}
        catalogProducts={testCatalogProducts}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: /select gate valve dn50/i }),
    );
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/add selected/i);
    expect(screen.getByText("Line items")).toBeInTheDocument();
  });

  it("renders a single Save for later label with the mobile action set", () => {
    render(
      <RequestCreateWizard
        autosaveMs={10_000}
        catalogProducts={testCatalogProducts}
        onCancel={() => undefined}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Save for later" })).toHaveLength(1);
    expect(screen.queryByText("Save and continue later")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next$/i })).toBeInTheDocument();
  });

  it("blocks leaving Delivery without a location", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <RequestCreateWizard
        autosaveMs={10_000}
        catalogProducts={testCatalogProducts}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: /select gate valve dn50/i }),
    );
    await user.click(screen.getByRole("button", { name: /add selected/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.type(
      screen.getByPlaceholderText(/valves for lagos/i),
      "Plant spare parts",
    );
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/delivery location is required/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
