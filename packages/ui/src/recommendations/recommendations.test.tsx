import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecommendationEngine } from "./RecommendationEngine.js";
import { recommendationFixture } from "./fixtures.js";
import {
  RECOMMENDATION_KINDS,
  emptyRecommendationFilters,
  filterRecommendations,
  recommendationKindLabel,
} from "./types.js";

describe("recommendation helpers", () => {
  it("covers all mission kinds in fixtures", () => {
    const kinds = new Set(recommendationFixture.map((r) => r.kind));
    for (const kind of RECOMMENDATION_KINDS) {
      expect(kinds.has(kind)).toBe(true);
      expect(recommendationKindLabel(kind).length).toBeGreaterThan(2);
    }
  });

  it("filters by kind and confidence", () => {
    expect(
      filterRecommendations(recommendationFixture, {
        ...emptyRecommendationFilters(),
        kind: "seasonal",
      }).every((r) => r.kind === "seasonal"),
    ).toBe(true);
    expect(
      filterRecommendations(recommendationFixture, {
        ...emptyRecommendationFilters(),
        minimumConfidence: "high",
      }).every((r) => r.confidence === "high"),
    ).toBe(true);
  });
});

describe("RecommendationEngine", () => {
  it("renders explainable cards, filters, feedback, and refresh", async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const onAddToRequest = vi.fn().mockResolvedValue(undefined);
    const onOpen = vi.fn();

    render(
      <RecommendationEngine
        recommendations={recommendationFixture}
        context={{ requestId: "pr-1042", consentedHistory: true }}
        onFeedback={onFeedback}
        onRefresh={onRefresh}
        onAddToRequest={onAddToRequest}
        onOpen={onOpen}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /recommendation engine/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/context:/i)).toBeInTheDocument();
    expect(screen.getByText(/gate valve dn50/i)).toBeInTheDocument();
    expect(
      screen.getByText(/matches requested diameter/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^products$/i }));
    expect(screen.getByText(/gate valve dn50/i)).toBeInTheDocument();
    expect(screen.queryByText(/west africa valves/i)).toBeNull();

    await user.click(screen.getByRole("button", { name: /^all$/i }));
    await user.click(
      screen.getByRole("button", {
        name: /mark gate valve dn50 pn16 helpful/i,
      }),
    );
    expect(onFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rec-product-1" }),
      "helpful",
    );

    const addButtons = screen.getAllByRole("button", {
      name: /add to request/i,
    });
    await user.click(addButtons[0]!);
    expect(onAddToRequest).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^refresh$/i }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("renders loading skeleton", () => {
    render(<RecommendationEngine recommendations={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
