import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CmsPage } from "./CmsPage.js";

const opsFetch = vi.hoisted(() => vi.fn());

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
  }),
}));

vi.mock("../auth/session/token-store.js", () => ({
  getAccessToken: () => "token",
}));

vi.mock("../lib/ops-fetch.js", () => ({
  opsFetch,
}));

describe("CmsPage", () => {
  beforeEach(() => {
    opsFetch.mockReset();
    opsFetch.mockResolvedValue([
      {
        id: "announcement-1",
        title: "Q4 trading update",
        slug: "q4-trading-update",
        body: "Market note",
        status: "draft",
        publishedAt: null,
        viewCount: 0,
        updatedAt: "2026-08-20T00:00:00.000Z",
        media: [],
      },
    ]);
  });

  it("asks for inline confirmation before deleting an announcement", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockImplementation(() => true);

    render(
      <MemoryRouter>
        <CmsPage />
      </MemoryRouter>,
    );

    await screen.findByRole("link", { name: /create announcement/i });
    expect(screen.queryByRole("heading", { name: /create announcement/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent(/delete this announcement/i);
    expect(confirmSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() =>
      expect(opsFetch).toHaveBeenCalledWith(
        "/announcements/announcement-1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });
});
