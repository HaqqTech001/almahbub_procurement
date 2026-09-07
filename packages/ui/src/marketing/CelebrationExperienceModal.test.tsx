import { DEFAULT_WEDDING_CAMPAIGN } from "@hamd/constants";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CelebrationExperienceModal,
  ROWDOTUL_HAMD_IDENTITY,
} from "./CelebrationExperienceModal.js";

describe("CelebrationExperienceModal", () => {
  it("opens as a digital invitation with close control and campaign identity", () => {
    const onDismiss = vi.fn();
    render(
      <CelebrationExperienceModal
        open
        campaign={{
          ...DEFAULT_WEDDING_CAMPAIGN,
          coupleNames: "Amina & Yusuf",
          venue: "Ilorin",
          venueAddress: "Kwara",
        }}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText(ROWDOTUL_HAMD_IDENTITY)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Amina & Yusuf" })).toBeInTheDocument();
    expect(screen.getByText(/cordially invite you/i)).toBeInTheDocument();
    expect(screen.getByText(/Ilorin/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close invitation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Wedding" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pause slides" })).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const onDismiss = vi.fn();
    render(
      <CelebrationExperienceModal
        open
        campaign={DEFAULT_WEDDING_CAMPAIGN}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.keyDown(document.querySelector("dialog")!, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows Join Live Now when the stream is live", () => {
    render(
      <CelebrationExperienceModal
        open
        campaign={{ ...DEFAULT_WEDDING_CAMPAIGN, streamStatus: "live" }}
        onDismiss={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Join Live Now" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View Wedding" })).not.toBeInTheDocument();
  });
});
