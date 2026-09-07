import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SafeRichText } from "./SafeRichText.js";

describe("SafeRichText", () => {
  it("renders plain paragraphs", () => {
    render(<SafeRichText value={"First paragraph.\n\nSecond paragraph."} />);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
  });

  it("keeps emphasis and drops scripts", () => {
    render(
      <SafeRichText value={'<p>Hello <strong>world</strong><script>alert(1)</script></p>'} />,
    );
    expect(screen.getByText("world")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });
});
