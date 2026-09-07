import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RequestHub, type RequestHubRow } from "./RequestHub.js";
import { RequestDetailView } from "./RequestDetailView.js";

const row: RequestHubRow = {
  id: "req-1",
  publicCode: "PR-1001",
  title: "Industrial valves",
  status: "submitted",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-02T10:00:00.000Z",
  organizationName: "Acme Ltd",
  requesterName: "Ada Buyer",
  requesterEmail: "ada@acme.test",
  categoryLabel: "Valves",
  lob: "integrated_export",
  priority: "high",
};

describe("RequestHub audience layouts", () => {
  it("shows buyer progress cards without customer or LOB columns", () => {
    render(
      <RequestHub
        audience="customer"
        title="My requests"
        rows={[row]}
        onOpen={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: /my requests/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /industrial valves/i })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /customer/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Integrated Export")).not.toBeInTheDocument();
    expect(screen.queryByText("ada@acme.test")).not.toBeInTheDocument();
  });

  it("shows an ops queue table with customer, organisation, and LOB", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <RequestHub
        audience="admin"
        title="Request queue"
        rows={[row]}
        onOpen={onOpen}
      />,
    );
    expect(screen.getByRole("columnheader", { name: /customer/i })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /assignee/i })).not.toBeInTheDocument();
    expect(screen.getByText("Ada Buyer")).toBeInTheDocument();
    expect(screen.getByText("ada@acme.test")).toBeInTheDocument();
    expect(screen.getByText("Acme Ltd")).toBeInTheDocument();
    expect(screen.getByText("Integrated Export")).toBeInTheDocument();
    expect(screen.getByText("Ada Buyer").closest("td")).toHaveAttribute("data-label", "Customer");
    expect(document.querySelector(".hamd-request-hub__table-wrap")).toBeTruthy();
    await user.click(screen.getByText("Ada Buyer"));
    expect(onOpen).toHaveBeenCalled();
  });

  it("renders one lifecycle status badge and separate action copy", () => {
    render(
      <RequestHub
        audience="admin"
        title="Request queue"
        rows={[{ ...row, status: "needs_clarification" }]}
        onOpen={() => undefined}
      />,
    );
    expect(document.querySelectorAll(".hamd-badge")).toHaveLength(1);
    expect(screen.getByText("Clarification required")).toBeInTheDocument();
    expect(screen.getByText(/action required: provide clarification/i)).toBeInTheDocument();
  });

  const detail = {
    id: "req-1",
    publicCode: "PR-1001",
    title: "Industrial valves",
    status: "submitted",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-02T10:00:00.000Z",
    requesterName: "Ada Buyer",
    requesterEmail: "ada@acme.test",
    organizationName: "Acme Ltd",
    lob: "international",
    priority: "urgent",
    assigneeName: "Ops Lead",
    items: [],
    history: [
      {
        id: "evt-1",
        toStatus: "submitted",
        createdAt: "2026-08-01T10:00:00.000Z",
        actorName: "Ops Lead",
      },
    ],
  };

  it("hides assignee and actor names from buyers", () => {
    render(
      <RequestDetailView
        audience="customer"
        request={detail}
        requestCommands={[]}
        quotationCommands={[]}
        onRequestCommand={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: /your next step/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /operational next actions/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Ops Lead")).not.toBeInTheDocument();
    expect(screen.queryByText("Assignee")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /assignment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /customer/i })).not.toBeInTheDocument();
    expect(screen.getByText("Line of business")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /progress/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve for sourcing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve quote/i })).not.toBeInTheDocument();
  });

  it("renders only host-supplied buyer commands, never ops verbs", () => {
    render(
      <RequestDetailView
        audience="customer"
        request={detail}
        requestCommands={["submit", "cancel"]}
        quotationCommands={[]}
        onRequestCommand={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: /^submit$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel request/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve for sourcing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start sourcing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve quote/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it("shows ops requester and customer fields without assignment controls", () => {
    render(
      <RequestDetailView
        audience="admin"
        request={{ ...detail, assigneeMembershipId: "mem-1" }}
        requestCommands={[]}
        quotationCommands={[]}
        onRequestCommand={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: /operational next actions/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /your next step/i })).not.toBeInTheDocument();
    expect(screen.getByText("Line of business")).toBeInTheDocument();
    expect(screen.getByText("International")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^customer$/i })).toBeInTheDocument();
    expect(screen.getByText("Requested by")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /assigned to/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /assigned to/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /history/i })).toBeInTheDocument();
  });

  it("shows state-valid ops commands and hides them after completion", () => {
    const { rerender } = render(
      <RequestDetailView
        audience="admin"
        request={detail}
        requestCommands={["request_clarification", "accept_for_sourcing", "cancel"]}
        quotationCommands={[]}
        onRequestCommand={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: /change status/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request clarification/i })).toBeInTheDocument();
    rerender(
      <RequestDetailView
        audience="admin"
        request={{ ...detail, status: "closed" }}
        requestCommands={[]}
        quotationCommands={[]}
        onRequestCommand={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: /change status/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve for sourcing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve quote/i })).not.toBeInTheDocument();
  });

  it("renders a structured clarification action surface for buyers", () => {
    render(
      <RequestDetailView
        audience="customer"
        request={{
          ...detail,
          status: "needs_clarification",
          history: [
            {
              id: "evt-q",
              toStatus: "needs_clarification",
              command: "request_clarification",
              reason: "Confirm the required flange rating.",
              createdAt: "2026-08-03T10:00:00.000Z",
            },
          ],
        }}
        requestCommands={["submit"]}
        quotationCommands={[]}
        onRequestCommand={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: /action required/i })).toBeInTheDocument();
    expect(screen.getByText(/required information/i)).toBeInTheDocument();
    expect(screen.getAllByText(/confirm the required flange rating/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /submit clarification/i })).toBeInTheDocument();
    expect(screen.getByText("Almahbub")).toBeInTheDocument();
  });

  it("opens a status dialog with only valid next transitions", async () => {
    const user = userEvent.setup();
    const onRequestCommand = vi.fn();
    render(
      <RequestDetailView
        audience="admin"
        request={detail}
        requestCommands={["request_clarification", "accept_for_sourcing", "cancel"]}
        quotationCommands={[]}
        onRequestCommand={onRequestCommand}
      />,
    );
    await user.click(screen.getByRole("button", { name: /change status/i }));
    expect(screen.getByRole("dialog", { name: /change request status/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /approve for sourcing/i })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /cancel request/i })).not.toBeInTheDocument();
  });
});
