import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnnouncementsPage } from "./AnnouncementsPage.js";

vi.mock("../api/parity-api.js", () => ({
  listAnnouncements: vi.fn(),
}));

vi.mock("../lib/seo.js", () => ({
  applyPageSeo: () => undefined,
}));

import { listAnnouncements } from "../api/parity-api.js";

describe("AnnouncementsPage published data", () => {
  beforeEach(() => {
    vi.mocked(listAnnouncements).mockReset();
  });

  it("renders published announcements from the API", async () => {
    vi.mocked(listAnnouncements).mockResolvedValue([
      {
        id: "a-1",
        title: "Eid notice",
        slug: "eid-notice",
        summary: "Workspace hours for Eid.",
        body: "Full body",
        status: "published",
        publishedAt: "2026-09-01T00:00:00.000Z",
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ] as never);

    render(
      <MemoryRouter>
        <AnnouncementsPage basePath="/app/announcements" />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Eid notice")).toBeInTheDocument();
    expect(screen.queryByText("No announcements published yet")).not.toBeInTheDocument();
  });
});
