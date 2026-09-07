import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PurchaseOrderWorkspace } from "./PurchaseOrderWorkspace.js";
import { purchaseOrderRecordsFixture } from "./fixtures.js";
import {
  availablePurchaseOrderCommands,
  emptyPurchaseOrderFilters,
  filterPurchaseOrders,
  purchaseOrderStatusLabel,
} from "./types.js";

describe("purchase order helpers", () => {
  it("exposes lifecycle commands and filters", () => {
    expect(purchaseOrderStatusLabel("partially_fulfilled")).toBe(
      "Partially fulfilled",
    );
    expect(
      availablePurchaseOrderCommands("issued", "pending"),
    ).toEqual(
      expect.arrayContaining(["supplier_accept", "supplier_reject", "revise"]),
    );
    expect(
      filterPurchaseOrders(purchaseOrderRecordsFixture, {
        ...emptyPurchaseOrderFilters(),
        status: "draft",
      }).every((o) => o.status === "draft"),
    ).toBe(true);
  });
});

describe("PurchaseOrderWorkspace", () => {
  it("covers mission facets and workflow actions", async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn().mockResolvedValue(undefined);
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onOpenDelivery = vi.fn();

    render(
      <PurchaseOrderWorkspace
        orders={purchaseOrderRecordsFixture}
        onTransition={onTransition}
        onCreate={onCreate}
        onOpenDelivery={onOpenDelivery}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /purchase orders/i }),
    ).toBeInTheDocument();
    const detail = screen.getByLabelText(/purchase order detail/i);
    expect(
      within(detail).getAllByText(/Awaiting supplier/i).length,
    ).toBeGreaterThan(0);

    const actions = screen.getByLabelText(/purchase order workflow actions/i);
    await user.click(
      within(actions).getByRole("button", {
        name: /record supplier acceptance/i,
      }),
    );
    expect(onTransition).toHaveBeenCalledWith(
      "po-551",
      "supplier_accept",
      expect.objectContaining({ rowVersion: 3 }),
    );

    await user.click(screen.getByRole("button", { name: /^history$/i }));
    expect(
      within(detail).getByText(/Issue to supplier/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^documents$/i }));
    expect(within(detail).getByText(/PO-551\.pdf/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^attachments$/i }));
    expect(
      within(detail).getByText(/packing-instructions\.pdf/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^revision$/i }));
    expect(within(detail).getByText(/v1 · PO-551/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /delivery tracking/i }),
    );
    await user.click(within(detail).getByText(/SH-901/i));
    expect(onOpenDelivery).toHaveBeenCalledWith("/shipments/sh-901");

    await user.click(screen.getByRole("button", { name: /^creation$/i }));
    await user.type(
      screen.getByLabelText(/procurement request id/i),
      "11111111-1111-1111-1111-111111111111",
    );
    await user.type(screen.getByLabelText(/line description/i), "Valve set");
    await user.click(screen.getByRole("button", { name: /create draft po/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it("renders loading skeleton", () => {
    render(<PurchaseOrderWorkspace orders={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
