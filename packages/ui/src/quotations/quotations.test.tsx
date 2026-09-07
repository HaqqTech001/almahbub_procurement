import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuotationWorkspace } from "./QuotationWorkspace.js";
import { quotationRecordsFixture } from "./fixtures.js";
import {
  availableQuotationCommands,
  computeQuotationTotal,
  emptyQuotationFilters,
  filterQuotations,
  quotationStatusLabel,
} from "./types.js";

describe("quotation helpers", () => {
  it("labels statuses, totals, and available commands", () => {
    expect(quotationStatusLabel("declined")).toBe("Rejected");
    expect(availableQuotationCommands("issued")).toEqual(["accept", "decline"]);
    expect(
      computeQuotationTotal({
        subtotalAmount: 100,
        discountAmount: 10,
        taxAmount: 5,
        shippingAmount: 2,
      }),
    ).toBe(97);
    expect(
      filterQuotations(quotationRecordsFixture, {
        ...emptyQuotationFilters(),
        status: "issued",
      }).every((q) => q.status === "issued"),
    ).toBe(true);
  });
});

describe("QuotationWorkspace", () => {
  it("renders commercial terms, versions, attachments, history, negotiation", async () => {
    const user = userEvent.setup();
    render(<QuotationWorkspace quotations={quotationRecordsFixture} />);

    expect(
      screen.getByRole("heading", { name: /quotation management/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to quotation detail/i }),
    ).toHaveAttribute("href", "#hamd-qt-detail");

    const detail = screen.getByLabelText(/quotation detail/i);
    expect(within(detail).getByText(/Currency/i)).toBeInTheDocument();
    expect(within(detail).getByText(/Discount/i)).toBeInTheDocument();
    expect(within(detail).getByText(/Taxes/i)).toBeInTheDocument();
    expect(within(detail).getByText(/Expiry/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /version history/i }));
    expect(within(detail).getByText(/v2 · QT-889/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^attachments$/i }));
    expect(within(detail).getByText(/QT-889-v2\.pdf/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /workflow history/i }),
    );
    expect(within(detail).getByText(/revise/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^negotiation$/i }));
    expect(
      within(detail).getByText(/improve discount/i),
    ).toBeInTheDocument();
  });

  it(
    "accepts, rejects, revises, and creates quotations",
    async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn().mockResolvedValue(undefined);
    const onRevise = vi.fn().mockResolvedValue(undefined);
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onAddNegotiationNote = vi.fn().mockResolvedValue(undefined);

    render(
      <QuotationWorkspace
        quotations={quotationRecordsFixture}
        onTransition={onTransition}
        onRevise={onRevise}
        onCreate={onCreate}
        onAddNegotiationNote={onAddNegotiationNote}
      />,
    );

    const actions = screen.getByLabelText(/quotation workflow actions/i);
    await user.click(
      within(actions).getByRole("button", { name: /accept quotation/i }),
    );
    expect(onTransition).toHaveBeenCalledWith(
      "qt-889-v2",
      "accept",
      expect.objectContaining({ rowVersion: 5 }),
    );

    await user.type(
      screen.getByPlaceholderText(/required for rejection/i),
      "Price too high",
    );
    await user.click(
      within(actions).getByRole("button", { name: /reject quotation/i }),
    );
    expect(onTransition).toHaveBeenCalledWith(
      "qt-889-v2",
      "decline",
      expect.objectContaining({ reason: "Price too high" }),
    );

    await user.type(screen.getByPlaceholderText(/why revise/i), "Buyer ask");
    await user.click(
      within(actions).getByRole("button", { name: /create revision/i }),
    );
    expect(onRevise).toHaveBeenCalledWith(
      "qt-889-v2",
      expect.objectContaining({ reason: "Buyer ask" }),
    );

    await user.click(screen.getByRole("button", { name: /^negotiation$/i }));
    await user.type(
      screen.getByLabelText(/add negotiation note/i),
      "Can we meet mid?",
    );
    await user.click(screen.getByRole("button", { name: /post note/i }));
    expect(onAddNegotiationNote).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^create$/i }));
    await user.type(
      screen.getByLabelText(/procurement request id/i),
      "11111111-1111-1111-1111-111111111111",
    );
    await user.type(screen.getByLabelText(/line description/i), "Sample valve");
    await user.clear(screen.getByLabelText(/^quantity$/i));
    await user.type(screen.getByLabelText(/^quantity$/i), "10");
    await user.clear(screen.getByLabelText(/unit amount/i));
    await user.type(screen.getByLabelText(/unit amount/i), "25");
    await user.click(
      screen.getByRole("button", { name: /create draft quotation/i }),
    );
    expect(onCreate).toHaveBeenCalled();
  },
  20_000,
  );

  it("searches and filters directory", async () => {
    const user = userEvent.setup();
    render(<QuotationWorkspace quotations={quotationRecordsFixture} />);
    await user.type(screen.getByLabelText(/search quotations/i), "QT-910");
    const list = screen.getByRole("list", { name: /^quotations$/i });
    expect(within(list).getByText(/Gulf Specialty/i)).toBeInTheDocument();
    expect(within(list).queryByText(/Ningbo Precision/i)).not.toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    render(<QuotationWorkspace quotations={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
