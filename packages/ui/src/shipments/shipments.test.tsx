import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShipmentWorkspace } from "./ShipmentWorkspace.js";
import { shipmentRecordsFixture } from "./fixtures.js";
import {
  availableShipmentCommands,
  emptyShipmentFilters,
  filterShipments,
  shipmentStatusLabel,
} from "./types.js";

describe("shipment helpers", () => {
  it("exposes lifecycle commands and filters", () => {
    expect(shipmentStatusLabel("out_for_delivery")).toBe("Out for delivery");
    expect(availableShipmentCommands("planned")).toEqual(
      expect.arrayContaining(["supplier_ready", "hold", "cancel"]),
    );
    expect(
      filterShipments(shipmentRecordsFixture, {
        ...emptyShipmentFilters(),
        status: "held",
      }).every((s) => s.status === "held"),
    ).toBe(true);
  });
});

describe("ShipmentWorkspace", () => {
  it(
    "covers mission facets and workflow actions",
    async () => {
      const user = userEvent.setup();
      const onTransition = vi.fn().mockResolvedValue(undefined);
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const onRefreshTracking = vi.fn().mockResolvedValue(undefined);
      const onConfirmDelivery = vi.fn().mockResolvedValue(undefined);

      render(
        <ShipmentWorkspace
          shipments={shipmentRecordsFixture}
          onTransition={onTransition}
          onCreate={onCreate}
          onRefreshTracking={onRefreshTracking}
          onConfirmDelivery={onConfirmDelivery}
        />,
      );

      expect(
        screen.getByRole("heading", { name: /logistics/i }),
      ).toBeInTheDocument();

      const detail = screen.getByLabelText(/shipment detail/i);
      expect(within(detail).getByText("SH-901")).toBeInTheDocument();
      expect(
        within(detail).getAllByText(/Maersk/i).length,
      ).toBeGreaterThan(0);

      const actions = screen.getByLabelText(/shipment workflow actions/i);
      await user.click(
        within(actions).getByRole("button", { name: /mark supplier ready/i }),
      );
      expect(onTransition).toHaveBeenCalledWith(
        "sh-901",
        "supplier_ready",
        expect.objectContaining({ rowVersion: 2 }),
      );

      await user.click(screen.getByRole("button", { name: /^tracking$/i }));
      expect(within(detail).getByText(/Not assigned/i)).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: /refresh carrier tracking/i }),
      );
      expect(onRefreshTracking).toHaveBeenCalledWith("sh-901");

      await user.click(screen.getByRole("button", { name: /^milestones$/i }));
      expect(within(detail).getByText(/PO confirmed/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^timeline$/i }));
      expect(within(detail).getByText(/Shipment planned/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^documents$/i }));
      expect(
        within(detail).getByText(/booking-confirmation\.pdf/i),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /proof of delivery/i }),
      );
      expect(
        within(detail).getByText(/Proof of delivery not yet confirmed/i),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^history$/i }));
      expect(
        within(detail).getByLabelText(/shipment history/i),
      ).toBeInTheDocument();
      expect(within(detail).getByText(/→ planned/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^map$/i }));
      expect(
        within(detail).getByText(/Map provider not configured/i),
      ).toBeInTheDocument();
      expect(within(detail).getByText(/Ningbo Port/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^create$/i }));
      fireEvent.change(screen.getByLabelText(/purchase order id/i), {
        target: { value: "11111111-1111-1111-1111-111111111111" },
      });
      fireEvent.change(screen.getByLabelText(/^carrier$/i), {
        target: { value: "Maersk" },
      });
      await user.click(
        screen.getByRole("button", { name: /create planned shipment/i }),
      );
      expect(onCreate).toHaveBeenCalled();
    },
    15_000,
  );

  it("renders loading skeleton", () => {
    render(<ShipmentWorkspace shipments={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
