import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WeddingWaitingAudioPanel } from "./WeddingWaitingAudioPanel.js";

const opsFetch = vi.hoisted(() => vi.fn());

vi.mock("../../lib/ops-fetch.js", () => ({
  opsFetch,
}));

describe("WeddingWaitingAudioPanel", () => {
  beforeEach(() => {
    opsFetch.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:waiting-preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("previews a selected track locally and does not upload until confirmed", async () => {
    render(
      <WeddingWaitingAudioPanel
        tracks={[]}
        enabled
        loop
        accessToken={async () => "token"}
        onTracks={vi.fn()}
        onEnabled={vi.fn()}
        onLoop={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Add Track/i })[0]!);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    const file = new File([new Uint8Array([0x49, 0x44, 0x33])], "nasheed.mp3", {
      type: "audio/mpeg",
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText("nasheed.mp3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload Track/i })).toBeInTheDocument();
    expect(opsFetch).not.toHaveBeenCalled();
  });

  it("revokes the blob URL when the pending file is removed", async () => {
    render(
      <WeddingWaitingAudioPanel
        tracks={[]}
        enabled
        loop
        accessToken={async () => "token"}
        onTracks={vi.fn()}
        onEnabled={vi.fn()}
        onLoop={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Add Track/i })[0]!);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    const file = new File([new Uint8Array([0x49, 0x44, 0x33])], "nasheed.mp3", {
      type: "audio/mpeg",
    });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(await screen.findByRole("button", { name: /Remove file/i }));
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:waiting-preview"));
  });

  it("rejects files over the waiting-audio size limit before upload", async () => {
    render(
      <WeddingWaitingAudioPanel
        tracks={[]}
        enabled
        loop
        accessToken={async () => "token"}
        onTracks={vi.fn()}
        onEnabled={vi.fn()}
        onLoop={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Add Track/i })[0]!);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    const huge = new File([new Uint8Array(12)], "long.mp3", { type: "audio/mpeg" });
    Object.defineProperty(huge, "size", { value: 25 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [huge] } });
    expect(await screen.findByText(/25 MB upload limit/i)).toBeInTheDocument();
    expect(opsFetch).not.toHaveBeenCalled();
  });
});

it("keeps the persisted value on save failure and reports the error", async () => {
 opsFetch.mockRejectedValue(new Error("Could not save")); const onEnabled=vi.fn();
 render(<WeddingWaitingAudioPanel tracks={[]} enabled={false} loop accessToken={async()=>"token"} onTracks={vi.fn()} onEnabled={onEnabled} onLoop={vi.fn()} />);
 fireEvent.click(screen.getByRole("checkbox",{name:/Enable waiting music/i}));
 expect(await screen.findByText("Could not save")).toBeInTheDocument(); expect(onEnabled).not.toHaveBeenCalled();
});
