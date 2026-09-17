import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ProductListMedia } from "./ProductListMedia.js";

afterEach(cleanup);
it("recovers from failed admin thumbnails without a broken-image icon or loop", () => {
  const { container } = render(<ProductListMedia name="Photocopier" images={[{ url: "https://media.example/one.webp", position: 0 }, { url: "https://media.example/two.webp", position: 1 }]} />);
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")).toHaveAttribute("src", "https://media.example/two.webp");
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByRole("img")).toHaveAccessibleName("Photocopier: image unavailable");
});
