import { act, render, screen, waitFor } from "@testing-library/react";
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
  it("removes the dismissed re-entry link when Ops disables promotion", async () => {
    sessionStorage.setItem(weddingModalDismissKey(DEFAULT_WEDDING_CAMPAIGN.id), "1");
    render(<HostApp />);
    expect(await screen.findByRole("link", { name: /Rowdotul HAMD/ })).toBeTruthy();
    fetchWeddingCampaign.mockResolvedValue({ ...DEFAULT_WEDDING_CAMPAIGN, modalEnabled: false });
    vi.advanceTimersByTime(10_100);
    await waitFor(() => expect(screen.queryByRole("link", { name: /Rowdotul HAMD/ })).toBeNull());
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  beforeEach(() => {
    sessionStorage.clear();
    resetCelebrationHostTimerForTests();
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      coupleNames: "Amina & Yusuf",
      modalEnabled: true,
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

  it("stays closed until the persisted promotion setting is known", async () => {
    fetchWeddingCampaign.mockReturnValue(new Promise(() => {}));
    render(<HostApp />);
    vi.advanceTimersByTime(WEDDING_MODAL_PUBLIC_DELAY_MS + 50);
    expect(screen.queryByRole("dialog")).toBeNull();
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
    expect(screen.getByRole("link", { name: /Rowdotul HAMD/ })).toHaveAttribute("href", DEFAULT_WEDDING_CAMPAIGN.sitePath);
    expect(screen.getByRole("link", { name: /Rowdotul HAMD/ }).querySelector('svg[data-icon="gift"]')).toBeTruthy();
  });

  it("does not show when the campaign window has expired", async () => {
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      modalEnabled: true,
      modalEndsAt: "2020-01-01T00:00:00.000Z",
    });
    render(<HostApp />);
    vi.advanceTimersByTime(WEDDING_MODAL_PUBLIC_DELAY_MS + 50);
    await waitFor(() => {
      expect(fetchWeddingCampaign).toHaveBeenCalled();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("keeps both controls hidden when disabled or unresolved, then handles re-enable", async () => {
    fetchWeddingCampaign.mockReturnValue(new Promise(() => {}));
    const {unmount}=render(<HostApp />);
    await act(async () => { vi.advanceTimersByTime(11000); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("link", {name:/Return to Rowdotul/})).toBeNull();
    unmount(); resetCelebrationHostTimerForTests();
    fetchWeddingCampaign.mockResolvedValue({...DEFAULT_WEDDING_CAMPAIGN,modalEnabled:false});
    render(<HostApp />);
    await act(async () => { vi.advanceTimersByTime(11000); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("link", {name:/Return to Rowdotul/})).toBeNull();
    fetchWeddingCampaign.mockResolvedValue({...DEFAULT_WEDDING_CAMPAIGN,modalEnabled:true});
    await act(async () => { vi.advanceTimersByTime(11000); });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("does not promote inside the wedding experience", async () => {
    render(<HostApp initialPath="/rowdotul-hamd-26/live" />);
    await act(async () => { vi.advanceTimersByTime(11000); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("link", {name:/Return to Rowdotul/})).toBeNull();
  });

});
