import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CelebrationModal } from "./CelebrationModal.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    status: "authenticated",
    ensureSession: vi.fn().mockResolvedValue("token"),
  }),
}));

vi.mock("../auth/session/token-store.js", () => ({
  getAccessToken: () => "token",
}));

vi.mock("../lib/ops-fetch.js", () => ({
  requireOpsToken: vi.fn().mockResolvedValue("token"),
  opsFetch: vi.fn().mockResolvedValue({
    id: "founder-wedding-september-2026",
    slug: "rowdotul-hamd-26",
    title: "Rowdotul HAMD'26",
    tagline: "A beautiful union begins",
    coupleNames: "",
    familyLine: "Together with their families",
    invitationHeading: "Alhamdulillah",
    invitationBody: "cordially invite you to celebrate their wedding",
    eventAt: "2026-09-30T16:00:00+01:00",
    streamAt: "2026-09-30T16:00:00+01:00",
    venue: "",
    venueAddress: "",
    modalEnabled: true,
    modalStartsAt: "2026-08-01T00:00:00+01:00",
    modalEndsAt: "2026-10-03T16:00:00+01:00",
    streamStatus: "upcoming",
    galleryEnabled: true,
    recordingAvailable: false,
    commentsEnabled: true,
    recordingDownloadEnabled: false,
    campaignStatus: "upcoming",
    sitePath: "/rowdotul-hamd-26",
    livePath: "/rowdotul-hamd-26/live",
  }),
}));

describe("ops CelebrationModal", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("does not show a Guide Close Modal label", async () => {
    render(
      <MemoryRouter>
        <CelebrationModal />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Guide/i)).toBeNull();
    expect(screen.queryByText(/Close Modal/i)).toBeNull();
  });
});
