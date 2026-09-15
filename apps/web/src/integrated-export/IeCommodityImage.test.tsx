import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IeCommodityImage } from "./IeCommodityImage.js";
vi.mock("../lib/api-origin.js", () => ({ browserApiBase: () => "https://api.example.test" }));
describe("commodity image recovery", () => {
  it("uses the API origin, shows a neutral failure surface, and retries when the assigned source changes", () => {
    const { rerender } = render(<IeCommodityImage src="/api/v1/public/catalog-media/id/first.jpg" alt="Assigned commodity image" />);
    const image = screen.getByRole("img", { name: "Assigned commodity image" });
    expect(image).toHaveAttribute("src", "https://api.example.test/api/v1/public/catalog-media/id/first.jpg");
    fireEvent.error(image);
    expect(screen.getByRole("img", { name: "Image unavailable" }).tagName).toBe("DIV");
    rerender(<IeCommodityImage src="https://storage.example.test/replacement.jpg" alt="Replacement" />);
    expect(screen.getByRole("img", { name: "Replacement" })).toHaveAttribute("src", "https://storage.example.test/replacement.jpg");
  });
});
