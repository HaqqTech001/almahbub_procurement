import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AttachmentBoard } from "./AuthenticatedMedia.js";
import { configureMediaSession } from "../auth/media-request.js";
afterEach(() => { configureMediaSession(null); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("opens private documents via the authenticated transport, never a raw API tab", async () => {
  configureMediaSession({ getAccessToken: () => "token", ensureSession: vi.fn(), refreshSession: vi.fn(), onSessionLost: vi.fn() }, "https://api.example");
  const fetch = vi.fn(async () => new Response("pdf", { status: 200 })); vi.stubGlobal("fetch", fetch);
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  URL.createObjectURL = vi.fn(() => "blob:document"); URL.revokeObjectURL = vi.fn();
  render(<AttachmentBoard files={[{ id: "id", name: "quote.pdf", href: "/api/v1/documents/id" }]} />);
  expect(screen.queryByRole("link")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "quote.pdf" }));
  await waitFor(() => expect(open).toHaveBeenCalledWith("blob:document", "_blank", "noopener,noreferrer"));
  expect(fetch).toHaveBeenCalledWith("https://api.example/api/v1/documents/id", expect.objectContaining({ headers: expect.any(Headers) }));
});
it("calls the host attachment handler instead of exposing a private URL", async () => {
  const onOpen = vi.fn();
  render(<AttachmentBoard files={[{ id: "id", name: "quote.pdf", href: "/api/v1/documents/id" }]} onOpen={onOpen} />);
  await userEvent.click(screen.getByRole("button", { name: "quote.pdf" }));
  expect(onOpen).toHaveBeenCalledOnce();
});
