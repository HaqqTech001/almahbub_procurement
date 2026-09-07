import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildHomepageBelowFoldProps, Homepage } from "./Homepage.js";
import { HomepageBelowFold } from "./HomepageBelowFold.js";

afterEach(() => {
  cleanup();
});

describe("Homepage production composer", () => {
  it("renders all RC4.2 homepage landmarks and sections", () => {
    render(
      <Homepage
        belowFoldSlot={<HomepageBelowFold {...buildHomepageBelowFoldProps()} />}
        seo={{ title: "Almahbub International | Global Procurement", includeJsonLd: true }}
      />,
    );

    const page = screen.getByTestId("homepage");
    expect(page.querySelector("header.hamd-header")).not.toBeNull();
    expect(within(page).getByRole("main")).toHaveAttribute("id", "main-content");
    expect(within(page).getByRole("heading", { level: 1 })).toBeInTheDocument();

    const headings = [
      /Partners that keep delivery accountable/i,
      /Nigerian partner for global procurement/i,
      /Almahbub Group/i,
      /Capabilities beyond product browsing/i,
      /Featured sourcing capability/i,
      /Industries we support/i,
      /transparent procurement journey/i,
      /Platform statistics/i,
      /Why buyers choose Almahbub/i,
      /What buyers report/i,
      /Common procurement questions/i,
      /Stay informed/i,
      /Ready to start a qualified request/i,
    ];

    for (const name of headings) {
      expect(within(page).getByRole("heading", { name })).toBeInTheDocument();
    }

    const footer = within(page).getByRole("contentinfo");
    expect(within(footer).getByText("Powered by HaqqTech")).toBeInTheDocument();
  });

  it("exposes HomepageBelowFold as an importable code-split module", async () => {
    const mod = await import("./HomepageBelowFold.js");
    expect(typeof mod.HomepageBelowFold).toBe("function");
    expect(typeof mod.default).toBe("function");
  });
});
