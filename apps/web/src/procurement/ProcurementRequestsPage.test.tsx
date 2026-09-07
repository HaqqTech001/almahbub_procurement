import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "../app/providers/ToastProvider.js";
import { ProcurementRequestsPage } from "./ProcurementRequestsPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
    permissions: ["request:write"],
  }),
}));

const listProcurementRequests = vi.hoisted(() => vi.fn());
const deleteCancelledProcurementRequest = vi.hoisted(() => vi.fn());
const archiveProcurementRequest = vi.hoisted(() => vi.fn());
const transitionProcurementRequest = vi.hoisted(() => vi.fn());
const duplicateProcurementRequest = vi.hoisted(() => vi.fn());
const getProcurementRequest = vi.hoisted(() => vi.fn());

vi.mock("./procurement-api.js", () => ({
  ProcurementApiError: class ProcurementApiError extends Error {
    status: number;
    code: string;
    constructor(message: string, status = 500, code = "ERROR") {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
  requireProcurementToken: async () => "token",
  listProcurementRequests,
  deleteCancelledProcurementRequest,
  archiveProcurementRequest,
  transitionProcurementRequest,
  duplicateProcurementRequest,
  getProcurementRequest,
}));

const cancelledRow = {
  id: "req-del",
  publicCode: "PR-2002",
  title: "Cancelled valves",
  status: "cancelled",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  organizationName: "Org",
  requesterName: "Buyer",
  items: [{ description: "Valve" }],
  attachments: [],
  related: null,
  rowVersion: 2,
};

function renderList() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ProcurementRequestsPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("My Requests deletion", () => {
  beforeEach(() => {
    listProcurementRequests.mockReset();
    deleteCancelledProcurementRequest.mockReset();
    archiveProcurementRequest.mockReset();
    getProcurementRequest.mockReset();
    transitionProcurementRequest.mockReset();
    listProcurementRequests.mockResolvedValue([cancelledRow]);
    deleteCancelledProcurementRequest.mockResolvedValue(undefined);
  });

  it("removes a deleted request from the list without refetching the deleted id", async () => {
    const user = userEvent.setup();
    renderList();

    expect(await screen.findByText("Cancelled valves")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /more actions for PR-2002/i })[0]);
    await user.click(screen.getByRole("menuitem", { name: "Delete Request" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete Request" }));

    await waitFor(() =>
      expect(deleteCancelledProcurementRequest).toHaveBeenCalledWith("token", "req-del", 2),
    );
    expect(getProcurementRequest).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Cancelled valves")).not.toBeInTheDocument());
    expect(screen.getByText("Request deleted.")).toBeInTheDocument();
  });

  it("does not treat a background list refresh failure as a delete failure", async () => {
    listProcurementRequests
      .mockResolvedValueOnce([cancelledRow])
      .mockRejectedValueOnce(new Error("Unable to load procurement requests."));
    deleteCancelledProcurementRequest.mockResolvedValue(undefined);

    renderList();

    expect(await screen.findByText("Cancelled valves")).toBeInTheDocument();
    await waitFor(() => expect(listProcurementRequests).toHaveBeenCalled());
    expect(screen.queryByText(/unable to remove this request/i)).not.toBeInTheDocument();
  });
});
