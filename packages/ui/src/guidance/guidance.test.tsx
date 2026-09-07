import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuidanceProvider, useGuidance } from "./GuidanceProvider.js";
import { WelcomeModal } from "./WelcomeModal.js";
import { GuideControl } from "./GuideControl.js";
import { LearningCenter } from "./LearningCenter.js";
import { TourRunner } from "./TourRunner.js";
import { GuidanceAdminWorkspace } from "./GuidanceAdminWorkspace.js";
import {
  guidanceAnalyticsFixture,
  guidancePreferenceFixture,
  guidanceProgressFixture,
  guidanceToursFixture,
} from "./fixtures.js";
import {
  GUIDANCE_PAGE_KEYS,
  completionPercent,
  filterToursByQuery,
  guidanceModeLabel,
} from "./types.js";
import {
  GUIDANCE_PAGE_REGISTRY,
  PUBLIC_PAGES_EXCLUDED_FROM_GUIDANCE,
} from "./page-registry.js";
import {
  createStaticTourCatalog,
  filterToursForRole,
  isTourVersionStale,
  resolveProductTourRole,
  shouldAutoOfferTour,
} from "./product-tour.js";

function TourRunnerHarness() {
  const { startTour } = useGuidance();
  return (
    <>
      <button type="button" onClick={() => startTour("dashboard")}>
        Start harness tour
      </button>
      <div data-guide="dashboard-stats">Stats</div>
      <TourRunner />
    </>
  );
}

describe("guidance coverage audit", () => {
  it("registers every authenticated page key and excludes public marketing", () => {
    const registryKeys = GUIDANCE_PAGE_REGISTRY.map((p) => p.pageKey).sort();
    expect(registryKeys).toEqual([...GUIDANCE_PAGE_KEYS].sort());
    for (const page of PUBLIC_PAGES_EXCLUDED_FROM_GUIDANCE) {
      expect(GUIDANCE_PAGE_KEYS).not.toContain(page);
    }
    const publishedPages = new Set(
      guidanceToursFixture.map((t) => t.pageKey),
    );
    for (const page of GUIDANCE_PAGE_REGISTRY) {
      expect(
        publishedPages.has(page.pageKey) ||
          guidanceToursFixture.some((t) => t.key === page.tourKey),
      ).toBe(true);
    }
  });

  it("computes completion and filters tours", () => {
    expect(guidanceModeLabel("guided")).toMatch(/guided/i);
    expect(
      completionPercent(
        [
          {
            tourId: "tour-dashboard",
            tourKey: "dashboard",
            status: "completed",
            completedSteps: 3,
            totalSteps: 3,
            lastActiveAt: "2026-08-05T00:00:00Z",
          },
        ],
        guidanceToursFixture.slice(0, 2),
      ),
    ).toBe(50);
    expect(filterToursByQuery(guidanceToursFixture, "shipment").length).toBeGreaterThan(0);
  });
});

describe("product tour roles and versioning", () => {
  it("resolves roles and filters audiences", () => {
    expect(
      resolveProductTourRole({ isAuthenticated: false }),
    ).toBe("public_visitor");
    expect(
      resolveProductTourRole({
        isAuthenticated: true,
        permissions: ["guidance:manage"],
      }),
    ).toBe("administrator");
    expect(
      resolveProductTourRole({
        isAuthenticated: true,
        permissions: ["supplier:read"],
      }),
    ).toBe("supplier");
    expect(
      resolveProductTourRole({
        isAuthenticated: true,
        permissions: ["procurement:read"],
      }),
    ).toBe("client");

    const publicTours = filterToursForRole(guidanceToursFixture, "public_visitor");
    expect(publicTours.every((t) => t.audience === "public_visitor")).toBe(true);
    expect(publicTours.some((t) => t.key === "public_home")).toBe(true);

    const clientTours = filterToursForRole(guidanceToursFixture, "client");
    expect(clientTours.some((t) => t.audience === "public_visitor")).toBe(false);
  });

  it("re-offers versioned tours after CMS bumps", () => {
    const tour = {
      ...guidanceToursFixture[0]!,
      version: 2,
    };
    expect(
      isTourVersionStale(tour, {
        tourId: tour.id,
        tourKey: tour.key,
        status: "completed",
        completedSteps: 3,
        totalSteps: 3,
        tourVersion: 1,
        lastActiveAt: "2026-08-01T00:00:00Z",
      }),
    ).toBe(true);
    expect(
      shouldAutoOfferTour({
        tour,
        progress: {
          tourId: tour.id,
          tourKey: tour.key,
          status: "skipped",
          completedSteps: 1,
          totalSteps: 3,
          tourVersion: 1,
          lastActiveAt: "2026-08-01T00:00:00Z",
        },
        suppressedTourKeys: [],
      }),
    ).toBe(true);
    expect(
      shouldAutoOfferTour({
        tour,
        progress: {
          tourId: tour.id,
          tourKey: tour.key,
          status: "in_progress",
          completedSteps: 1,
          totalSteps: 3,
          tourVersion: 2,
          currentStepKey: tour.steps[1]?.stepKey,
          lastActiveAt: "2026-08-01T00:00:00Z",
        },
        suppressedTourKeys: [],
      }),
    ).toBe(true);
  });

  it("builds a static catalog for admin-ready swaps", () => {
    const catalog = createStaticTourCatalog({
      tours: guidanceToursFixture,
      catalogVersion: 3,
    });
    expect(catalog.catalogVersion).toBe(3);
    expect(catalog.getTours()).toHaveLength(guidanceToursFixture.length);
  });
});

describe("GuidanceRoot onboarding", () => {
  it("shows welcome and remembers never-auto-start", async () => {
    const user = userEvent.setup();
    const onUpdatePreference = vi.fn();
    render(
      <GuidanceProvider
        preference={guidancePreferenceFixture}
        tours={guidanceToursFixture}
        tips={[]}
        progress={guidanceProgressFixture}
        dismissedTipIds={[]}
        currentPageKey="dashboard"
        handlers={{ onUpdatePreference }}
      >
        <WelcomeModal />
        <GuideControl />
      </GuidanceProvider>,
    );

    expect(
      screen.getByRole("heading", { name: /welcome to almahbub international/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/powered by haqq tech/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /never automatically start again/i }),
    );
    expect(onUpdatePreference).toHaveBeenCalledWith(
      expect.objectContaining({ neverAutoStart: true, welcomeCompleted: true }),
    );
    expect(
      screen.queryByRole("heading", { name: /welcome to almahbub international/i }),
    ).not.toBeInTheDocument();
  });

  it("opens learning center from guide control", async () => {
    const user = userEvent.setup();
    render(
      <GuidanceProvider
        preference={{
          ...guidancePreferenceFixture,
          welcomeCompletedAt: "2026-08-01T00:00:00Z",
        }}
        tours={guidanceToursFixture}
        tips={[]}
        progress={[]}
        dismissedTipIds={[]}
        currentPageKey="dashboard"
        autoStart={false}
      >
        <GuideControl />
        <LearningCenter />
      </GuidanceProvider>,
    );

    await user.click(screen.getByRole("button", { name: /product tour/i }));
    const menu = screen.getByRole("menu", { name: /product tour options/i });
    await user.click(within(menu).getByRole("menuitem", { name: /help center/i }));
    expect(
      screen.getByRole("dialog", { name: /help & learning center/i }),
    ).toBeInTheDocument();
  });

  it("exposes pause, resume, and don't show again on the tour runner", async () => {
    const user = userEvent.setup();
    const onUpsertProgress = vi.fn();
    const onUpdatePreference = vi.fn();
    render(
      <GuidanceProvider
        preference={{
          ...guidancePreferenceFixture,
          welcomeCompletedAt: "2026-08-01T00:00:00Z",
        }}
        tours={guidanceToursFixture.filter((t) => t.key === "dashboard")}
        tips={[]}
        progress={[]}
        dismissedTipIds={[]}
        currentPageKey="dashboard"
        autoStart={false}
        handlers={{ onUpsertProgress, onUpdatePreference }}
      >
        <TourRunnerHarness />
      </GuidanceProvider>,
    );

    await user.click(screen.getByRole("button", { name: /start harness tour/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^previous$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^pause$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /don.?t show again/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^pause$/i }));
    expect(screen.getByRole("button", { name: /^resume$/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^resume$/i }));
    expect(screen.getByRole("button", { name: /^pause$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^skip$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /more tours/i })).toBeInTheDocument();
  });

  it("auto-starts a module welcome when entering quotations", async () => {
    render(
      <GuidanceProvider
        preference={{
          ...guidancePreferenceFixture,
          welcomeCompletedAt: "2026-08-01T00:00:00Z",
          neverAutoStart: true,
        }}
        tours={guidanceToursFixture.filter((t) => t.pageKey === "quotations")}
        tips={[]}
        progress={[]}
        dismissedTipIds={[]}
        currentPageKey="quotations"
        autoStart
      >
        <TourRunner />
      </GuidanceProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: /welcome to quotations/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^skip$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /more tours/i })).toBeInTheDocument();
  });
});

describe("GuidanceAdminWorkspace", () => {
  it("renders analytics and tour management", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();
    render(
      <GuidanceAdminWorkspace
        tours={guidanceToursFixture}
        analytics={guidanceAnalyticsFixture}
        onPublish={onPublish}
      />,
    );
    expect(screen.getByText(/users tracked/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /dashboard tour/i }));
    await user.click(screen.getByRole("button", { name: /unpublish/i }));
    expect(onPublish).not.toHaveBeenCalled();
  });
});
