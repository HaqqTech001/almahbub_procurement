import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantWorkspace } from "./AssistantWorkspace.js";
import {
  assistantMessagesFixture,
  assistantSuggestionsFixture,
} from "./fixtures.js";
import {
  emptyAssistantFilters,
  filterAssistantSuggestions,
  groupSuggestionsByKind,
  assistantSuggestionKindLabel,
} from "./types.js";

describe("assistant helpers", () => {
  it("covers all mission suggestion kinds", () => {
    const kinds = new Set(assistantSuggestionsFixture.map((s) => s.kind));
    expect(kinds.has("product_suggestion")).toBe(true);
    expect(kinds.has("supplier_suggestion")).toBe(true);
    expect(kinds.has("alternative_product")).toBe(true);
    expect(kinds.has("specification_explanation")).toBe(true);
    expect(kinds.has("budget_suggestion")).toBe(true);
    expect(kinds.has("lead_time_explanation")).toBe(true);
    expect(kinds.has("document_summary")).toBe(true);
    expect(kinds.has("quotation_summary")).toBe(true);
    expect(kinds.has("procurement_guidance")).toBe(true);
    expect(kinds.has("faq_answer")).toBe(true);
    expect(assistantSuggestionKindLabel("quotation_summary")).toBe(
      "Summarize quotations",
    );
    expect(assistantSuggestionKindLabel("faq_answer")).toBe("Answer FAQs");
    expect(
      groupSuggestionsByKind(assistantSuggestionsFixture).length,
    ).toBeGreaterThan(5);
    expect(
      filterAssistantSuggestions(assistantSuggestionsFixture, {
        ...emptyAssistantFilters(),
        kinds: ["product_suggestion"],
      }).every((s) => s.kind === "product_suggestion"),
    ).toBe(true);
  });
});

describe("AssistantWorkspace", () => {
  it("covers mission facets, ask flow, and future-ready capabilities", async () => {
    const user = userEvent.setup();
    const onAsk = vi.fn().mockResolvedValue({
      message: {
        id: "a-new",
        role: "assistant",
        content: "Here are product suggestions for your request.",
        createdAt: new Date().toISOString(),
        mode: "recommend",
        confidence: "moderate",
      },
      suggestions: [assistantSuggestionsFixture[0]],
    });
    const onAcceptSuggestion = vi.fn().mockResolvedValue(undefined);
    const onOpenCitation = vi.fn();
    const onRequestCapability = vi.fn().mockResolvedValue(undefined);

    render(
      <AssistantWorkspace
        suggestions={assistantSuggestionsFixture}
        messages={assistantMessagesFixture}
        context={{ page: "requests", recordCode: "PR-1042", recordType: "request" }}
        onAsk={onAsk}
        onAcceptSuggestion={onAcceptSuggestion}
        onOpenCitation={onOpenCitation}
        onRequestCapability={onRequestCapability}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /ai procurement assistant/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/requests · PR-1042 · request/i)).toBeInTheDocument();

    const directory = screen.getByLabelText(/assistant suggestions/i);
    expect(
      within(directory).getByRole("heading", { name: /product suggestions/i }),
    ).toBeInTheDocument();
    expect(
      within(directory).getByRole("heading", {
        name: /recommend suppliers/i,
      }),
    ).toBeInTheDocument();

    await user.click(
      within(directory).getByRole("button", {
        name: /gate valve dn50 pn16/i,
      }),
    );
    const detail = screen.getByLabelText(/suggestion detail/i);
    expect(within(detail).getByText(/catalog match/i)).toBeInTheDocument();
    await user.click(
      within(detail).getByRole("button", { name: /accept for human review/i }),
    );
    expect(onAcceptSuggestion).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^guidance$/i }));
    expect(
      within(screen.getByLabelText(/assistant suggestions/i)).getByRole(
        "heading",
        { name: /explain procurement steps/i },
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/assistant suggestions/i)).getByRole(
        "heading",
        { name: /answer faqs/i },
      ),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/ask the procurement assistant/i),
      "Suggest products for PR-1042",
    );
    await user.click(screen.getByRole("button", { name: /ask assistant/i }));
    expect(onAsk).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Suggest products for PR-1042",
        mode: "recommend",
        memory: expect.any(Array),
      }),
    );
    expect(
      await screen.findByText(/here are product suggestions/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/conversation memory \(session stub\)/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /future ready/i }));
    const caps = screen.getByLabelText(/future-ready capabilities/i);
    expect(within(caps).getByText(/^LLM$/i)).toBeInTheDocument();
    expect(within(caps).getByText(/^RAG$/i)).toBeInTheDocument();
    expect(within(caps).getByText(/^Voice$/i)).toBeInTheDocument();
    expect(within(caps).getByText(/^Vision$/i)).toBeInTheDocument();
    expect(
      within(caps).getByRole("heading", { name: /^conversation memory$/i }),
    ).toBeInTheDocument();
    await user.click(
      within(caps).getAllByRole("button", {
        name: /notify when available/i,
      })[0]!,
    );
    expect(onRequestCapability).toHaveBeenCalled();
  });

  it("renders loading skeleton", () => {
    render(<AssistantWorkspace loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
