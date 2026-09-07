import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WeddingGalleryPanel } from "./WeddingGalleryPanel.js";

const opsFetch = vi.hoisted(() => vi.fn());

vi.mock("../../lib/ops-fetch.js", () => ({
  opsFetch,
}));

describe("WeddingGalleryPanel", () => {
  beforeEach(() => {
    opsFetch.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:wedding-preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("previews a selected image before any upload", async () => {
    render(
      <WeddingGalleryPanel items={[]} accessToken={async () => "token"} onItems={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Add Media/i }));
    const input = document.getElementById(
      screen.getByText(/Browse files/i).getAttribute("for") ?? "",
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "altar.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole("img", { name: "Selected image preview" })).toHaveAttribute(
      "src",
      "blob:wedding-preview",
    );
    expect(screen.getByText(/Image · 3 B · Ready/i)).toBeInTheDocument();
    expect(opsFetch).not.toHaveBeenCalled();
  });

  it("rejects files over 10 MB before upload and keeps a valid selection", async () => {
    render(
      <WeddingGalleryPanel items={[]} accessToken={async () => "token"} onItems={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Add Media/i }));
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    const huge = new File([new Uint8Array(12)], "huge.mp4", { type: "video/mp4" });
    Object.defineProperty(huge, "size", { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [huge] } });
    expect(
      await screen.findByText("This file is larger than the 10 MB upload limit."),
    ).toBeInTheDocument();
    expect(opsFetch).not.toHaveBeenCalled();
  });

  it("revokes the blob URL when a pending preview is removed", async () => {
    render(
      <WeddingGalleryPanel items={[]} accessToken={async () => "token"} onItems={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Add Media/i }));
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "altar.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("button", { name: /^Remove$/i });
    fireEvent.click(screen.getByRole("button", { name: /^Remove$/i }));
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:wedding-preview"));
  });
});
