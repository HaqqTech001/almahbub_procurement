import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SupplierWorkspace } from "./SupplierWorkspace.js";
import { supplierRecordsFixture } from "./fixtures.js";
import {
  emptySupplierFilters,
  filterSuppliers,
  suppliersToCsv,
} from "./types.js";

describe("supplier helpers", () => {
  it("filters by status/risk/country and exports CSV", () => {
    const active = filterSuppliers(supplierRecordsFixture, {
      ...emptySupplierFilters(),
      status: "active",
    });
    expect(active.every((s) => s.status === "active")).toBe(true);
    const cn = filterSuppliers(supplierRecordsFixture, {
      ...emptySupplierFilters(),
      country: "CN",
    });
    expect(cn.some((s) => s.id === "sup-valve-co")).toBe(true);
    expect(suppliersToCsv(active)).toContain("legal_name");
  });
});

describe("SupplierWorkspace", () => {
  it("renders directory, profile facets, and skip link", async () => {
    const user = userEvent.setup();
    render(<SupplierWorkspace suppliers={supplierRecordsFixture} />);

    expect(
      screen.getByRole("heading", { name: /supplier management/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to supplier detail/i }),
    ).toHaveAttribute("href", "#hamd-sup-detail");
    expect(
      screen.getByRole("heading", { name: /Ningbo Precision Valves/i }),
    ).toBeInTheDocument();

    const detail = screen.getByLabelText(/supplier detail/i);

    await user.click(screen.getByRole("button", { name: /^contacts$/i }));
    expect(within(detail).getByText(/Li Wei/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^locations$/i }));
    expect(within(detail).getByText(/Harbor Rd/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^certifications$/i }));
    expect(within(detail).getByText(/ISO 9001/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^documents$/i }));
    expect(within(detail).getByText(/Company profile\.pdf/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^ratings$/i }));
    expect(within(detail).getByLabelText(/4\.6 out of 5/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^lead time$/i }));
    expect(within(detail).getByText(/^Typical$/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^performance$/i }));
    expect(within(detail).getByText(/OTIF/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^communication$/i }));
    expect(within(detail).getByText(/PR-1042 clarification/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^products$/i }));
    expect(within(detail).getByText(/Gate valve DN50/i)).toBeInTheDocument();
  });

  it("searches, filters countries, and exports CSV", async () => {
    const user = userEvent.setup();
    const onExportCsv = vi.fn();
    render(
      <SupplierWorkspace
        suppliers={supplierRecordsFixture}
        onExportCsv={onExportCsv}
      />,
    );

    await user.type(screen.getByLabelText(/search suppliers/i), "Lagos Pack");
    const list = screen.getByRole("list", { name: /^suppliers$/i });
    expect(within(list).getByText(/Lagos Pack Systems/i)).toBeInTheDocument();
    expect(
      within(list).queryByText(/Ningbo Precision/i),
    ).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/search suppliers/i));
    await user.selectOptions(screen.getByLabelText(/^country$/i), "AE");
    expect(within(list).getByText(/Gulf Specialty/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /export csv/i }));
    expect(onExportCsv).toHaveBeenCalled();
  });

  it("runs admin approve, suspend, verify, and risk score actions", async () => {
    const user = userEvent.setup();
    const onAdminAction = vi.fn().mockResolvedValue(undefined);

    render(
      <SupplierWorkspace
        suppliers={supplierRecordsFixture}
        onAdminAction={onAdminAction}
      />,
    );

    const list = screen.getByRole("list", { name: /^suppliers$/i });
    await user.click(within(list).getByText(/Accra Weave/i));
    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await user.click(screen.getByRole("button", { name: /approve supplier/i }));
    expect(onAdminAction).toHaveBeenCalledWith("sup-textile", "approve");

    await user.click(within(list).getByText(/Ningbo Precision/i));
    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await user.click(screen.getByRole("button", { name: /suspend supplier/i }));
    expect(onAdminAction).toHaveBeenCalledWith("sup-valve-co", "suspend");

    await user.click(within(list).getByText(/Accra Weave/i));
    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await user.click(
      screen.getByRole("button", { name: /complete verification/i }),
    );
    expect(onAdminAction).toHaveBeenCalledWith("sup-textile", "verify");

    await user.type(screen.getByLabelText(/risk score/i), "55");
    await user.click(screen.getByRole("button", { name: /update risk score/i }));
    expect(onAdminAction).toHaveBeenCalledWith(
      "sup-textile",
      "reassess_risk",
      { riskScore: 55 },
    );
  });

  it("renders loading skeleton", () => {
    render(<SupplierWorkspace suppliers={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
