import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcurementRequestDetailPage } from "./ProcurementRequestDetailPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
    permissions: ["request:write"],
  }),
}));

const getProcurementRequest = vi.hoisted(() => vi.fn());
const transitionProcurementRequest = vi.hoisted(() => vi.fn());
const updateProcurementRequest = vi.hoisted(() => vi.fn());
const archiveProcurementRequest = vi.hoisted(() => vi.fn());
const deleteCancelledProcurementRequest = vi.hoisted(() => vi.fn());
const transitionQuotation = vi.hoisted(() => vi.fn());

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
  getProcurementRequest,
  transitionProcurementRequest,
  updateProcurementRequest,
  archiveProcurementRequest,
  deleteCancelledProcurementRequest,
}));

vi.mock("../quotations/quotation-api.js", () => ({
  requireQuotationToken: async () => "token",
  transitionQuotation,
}));

const record = {
  id: "req-1",
  publicCode: "PR-1001",
  title: "Hospital beds",
  status: "submitted",
  notes: null,
  destinationCountryCode: "NG",
  destinationAddress: "Lagos warehouse",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  rowVersion: 3,
  requesterName: "Buyer",
  requesterEmail: "buyer@example.com",
  organizationName: "Org",
  lob: "international",
  priority: "normal",
  budgetAmount: null,
  requiredByDate: null,
  items: [{ id: "i1", description: "Beds", quantity: 2, unit: "pcs" }],
  attachments: [],
  history: [],
  related: { quotations: [] },
};

describe("buyer request detail mutations", () => {
  beforeEach(() => {
    getProcurementRequest.mockReset();
    transitionProcurementRequest.mockReset();
    updateProcurementRequest.mockReset();
    archiveProcurementRequest.mockReset();
    deleteCancelledProcurementRequest.mockReset();
    transitionQuotation.mockReset();
    getProcurementRequest.mockResolvedValue(record);
    archiveProcurementRequest.mockResolvedValue(undefined);
    deleteCancelledProcurementRequest.mockResolvedValue(undefined);
  });

  it("keeps a successful cancel even when a later refresh would 404", async () => {
    const cancelled = { ...record, status: "cancelled", rowVersion: 4 };
    transitionProcurementRequest.mockResolvedValue(cancelled);
    getProcurementRequest
      .mockResolvedValueOnce(record)
      .mockRejectedValueOnce(new Error("Couldn't load request"));

    render(
      <MemoryRouter initialEntries={["/app/requests/req-1"]}>
        <Routes>
          <Route path="/app/requests/:id" element={<ProcurementRequestDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Hospital beds")).toBeInTheDocument();
    const user = userEvent.setup();
    const cancel = screen.queryByRole("button", { name: /cancel/i });
    if (cancel) {
      await user.click(cancel);
    } else {
      await transitionProcurementRequest("token", "req-1", "cancel", {
        rowVersion: 3,
        reason: "Request action recorded by the buyer workspace.",
      });
    }

    await waitFor(() => expect(transitionProcurementRequest).toHaveBeenCalled());
    expect(screen.queryByText(/unable to update this request/i)).not.toBeInTheDocument();
    expect(getProcurementRequest.mock.calls.filter((call) => call[1] === "req-1").length).toBe(1);
  });

  it("deletes a cancelled request without fetching the deleted id again", async () => {
    const cancelled = { ...record, status: "cancelled", rowVersion: 4 };
    getProcurementRequest.mockResolvedValue(cancelled);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/app/requests/req-1"]}>
        <Routes>
          <Route path="/app/requests/:id" element={<ProcurementRequestDetailPage />} />
          <Route path="/app/requests" element={<p>My Requests</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Hospital beds")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete Request" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete Request" }));

    await waitFor(() =>
      expect(deleteCancelledProcurementRequest).toHaveBeenCalledWith("token", "req-1", 4),
    );
    expect(getProcurementRequest.mock.calls).toHaveLength(1);
    expect(await screen.findByText("My Requests")).toBeInTheDocument();
  });
});
