import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RequestCreateWizard, wizardStepForField, validateStep, type RequestWizardDraft } from "./RequestCreateWizard.js";

describe("wizard error navigation", () => {
  it("returns from final submit to a server-rejected earlier field and retains the draft", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(Object.assign(new Error("Check delivery"), {
      details: [{ field: "title", message: "Use a more specific request title." }, { field: "destinationAddress", message: "Include a street number." }],
    }));
    const onAutosave = vi.fn();
    render(<RequestCreateWizard onSubmit={onSubmit} onAutosave={onAutosave} initial={{
      title: "Valves for Lagos", destinationCountryCode: "NG", destinationAddress: "Lagos warehouse",
      items: [{ id: "row", description: "Valves", quantity: 2, unit: "pcs", category: "", specifications: "" }],
    }} />);
    for (let step = 0; step < 4; step += 1) await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "title" })).toHaveFocus());
    expect(screen.getByRole("textbox", { name: "title" })).toHaveValue("Valves for Lagos");
    await user.click(screen.getByRole("button", { name: "Include a street number." }));
    await waitFor(() => expect(document.querySelector('[data-wizard-field="destinationAddress"]')).toHaveFocus());
    expect(document.querySelector('[data-wizard-field="destinationAddress"]')).toHaveValue("Lagos warehouse");
    expect(onAutosave).toHaveBeenCalledWith(expect.objectContaining({ title: "Valves for Lagos" }));
  });
  it("blocks Next and focuses the first useful field within its own form", async () => {
    const user = userEvent.setup();
    render(<RequestCreateWizard />);
    await user.click(screen.getByRole("button", { name: /^next/i }));
    const field = document.querySelector('[data-wizard-field$=":description"]');
    expect(field).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(field).toHaveFocus());
    const link = screen.getByRole("button", { name: /Line 1: product description/ });
    await user.click(link);
    expect(field).toHaveFocus();
    fireEvent.change(field!, { target: { value: "Industrial valves" } });
    await user.click(screen.getByRole("button", { name: /^next/i }));
    expect(screen.getByRole("textbox", { name: "title" })).toBeInTheDocument();
  });
  it("maps errors without losing their field associations", () => {
    expect(wizardStepForField("item:row:quantity")).toBe("products");
    expect(wizardStepForField("title")).toBe("basics");
    expect(wizardStepForField("destinationCountryCode")).toBe("delivery");
    const draft = { title: "", destinationAddress: "", destinationCountryCode: "", items: [] } as unknown as RequestWizardDraft;
    const errors = validateStep("review", draft);
    expect(errors.messages.length).toBe(errors.fields.length);
    expect(errors.fields).toContain("title");
    expect(validateStep("documents", draft).messages).toEqual([]);
  });
  it("blocks invalid optional budgets and out-of-range quantities on their own steps", () => {
    const draft = { title: "Valid title", currencyCode: "NGN", budgetAmount: -1,
      items: [{ id: "row", description: "Valves", quantity: 1_000_001, unit: "pcs" }],
    } as unknown as RequestWizardDraft;
    expect(validateStep("basics", draft).fields).toEqual(["budgetAmount"]);
    expect(validateStep("products", draft).fields).toEqual(["item:row:quantity"]);
  });
  it.each([320, 360, 375, 390, 768, 1280])("keeps focus navigation scoped and preserves input at %ipx", async (width) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    const originalScroll = HTMLElement.prototype.scrollIntoView;
    const scroll = vi.fn();
    HTMLElement.prototype.scrollIntoView = scroll;
    const user = userEvent.setup();
    render(<RequestCreateWizard initial={{ items: [{ id: "row", description: "Valves", quantity: 0, unit: "", category: "", specifications: "" }] }} />);
    await user.click(screen.getByRole("button", { name: /^next/i }));
    const quantity = screen.getByRole("textbox", { name: "Quantity required" });
    await waitFor(() => expect(quantity).toHaveFocus());
    expect(scroll).toHaveBeenCalledWith({ block: "center", behavior: "auto" });
    expect(document.querySelector('[data-wizard-field="item:row:description"]')).toHaveValue("Valves");
    HTMLElement.prototype.scrollIntoView = originalScroll;
  });
});
