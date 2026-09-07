import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WeddingLivePortalShell } from "./WeddingLivePortalShell.js";
import { WeddingLiveHeader } from "./WeddingLiveHeader.js";

describe("WeddingLivePortalShell", () => {
  it("renders a dedicated portal without public chrome classes", () => {
    render(
      <WeddingLivePortalShell>
        <WeddingLiveHeader
          status="WAITING"
          themeControl={<span>theme</span>}
          exitHref="/rowdotul-hamd-26"
          exitLabel="Back to Wedding"
        />
      </WeddingLivePortalShell>,
    );
    expect(screen.getByTestId("wedding-live-portal")).toBeInTheDocument();
    expect(screen.getByText("WAITING")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Wedding/i })).toHaveAttribute(
      "href",
      "/rowdotul-hamd-26",
    );
    expect(document.querySelector(".hamd-header")).toBeNull();
  });
});
