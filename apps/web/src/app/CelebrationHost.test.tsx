import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WEDDING_CAMPAIGN,
  WEDDING_MODAL_PUBLIC_DELAY_MS,
  weddingModalDismissKey,
} from "@hamd/constants";

import { CelebrationHost, resetCelebrationHostTimerForTests } from "./CelebrationHost.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useOptionalAuth: () => ({
    status: "anonymous",
  }),
}));

const fetchWeddingCampaign = vi.fn();

vi.mock("../wedding/wedding-api.js", () => ({
  fetchWeddingCampaign: (...args: unknown[]) => fetchWeddingCampaign(...args),
}));

function HostApp({ initialPath = "/" }: { initialPath?: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <CelebrationHost />
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/services" element={<a href="/about">About</a>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CelebrationHost", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetCelebrationHostTimerForTests();
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      coupleNames: "Amina & Yusuf",
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    resetCelebrationHostTimerForTests();
    vi.useRealTimers();
  });

  it("does not show on first paint, then appears after the public delay", async () => {
    render(<HostApp />);
    expect(screen.queryByRole("dialog")).toBeNull();
    vi.advanceTimersByTime(WEDDING_MODAL_PUBLIC_DELAY_MS - 50);
    expect(screen.queryByRole("dialog")).toBeNull();
    vi.advanceTimersByTime(100);
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Rowdotul HAMD'26")).toBeTruthy();
    expect(screen.getByRole("button", { name: "View Wedding" })).toBeTruthy();
  });

  it("opens after 3.5s even when the campaign fetch never resolves", async () => {
    fetchWeddingCampaign.mockReturnValue(new Promise(() => {}));
    render(<HostApp />);
    vi.advanceTimersByTime(WEDDING_MODAL_PUBLIC_DELAY_MS + 50);
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getAllByText("Rowdotul HAMD'26").length).toBeGreaterThan(0);
  });

  it("does not auto-open on login routes", async () => {
    render(<HostApp initialPath="/login" />);
    vi.advanceTimersByTime(WEDDING_MODAL_PUBLIC_DELAY_MS + 50);
    await waitFor(() => {
      expect(fetchWeddingCampaign).toHaveBeenCalled();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays dismissed for the browsing session including later login", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<HostApp />);
    vi.advanceTimersByTime(WEDDING_MODAL_PUBLIC_DELAY_MS + 50);
    expect(await screen.findByRole("dialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Close invitation" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(sessionStorage.getItem(weddingModalDismissKey(DEFAULT_WEDDING_CAMPAIGN.id))).toBe(
      "1",
    );
  });

  it("does not show when the campaign window has expired", async () => {
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      modalEndsAt: "2020-01-01T00:00:00.000Z",
    });
    render(<HostApp />);
    vi.advanceTimersByTime(WEDDING_MODAL_PUBLIC_DELAY_MS + 50);
    await waitFor(() => {
      expect(fetchWeddingCampaign).toHaveBeenCalled();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
