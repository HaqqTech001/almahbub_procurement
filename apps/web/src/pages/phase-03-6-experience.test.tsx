import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppProviders } from "../app/providers/AppProviders.js";
import { CustomerNotificationMenu } from "../notifications/CustomerNotificationMenu.js";
import { IeCommodityCard } from "../integrated-export/IeCommodityCard.js";
import { ieProcurementCreatePath } from "../integrated-export/ie-paths.js";
import { AnnouncementsPage } from "./AnnouncementsPage.js";
import { WorkspaceAnnouncementDetailPage } from "./WorkspaceAnnouncementDetailPage.js";
import {
  createAnnouncementReply,
  listAnnouncementReplies,
} from "../api/parity-api.js";

const { ensureSession } = vi.hoisted(() => ({
  ensureSession: vi.fn(async () => "token"),
}));

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    status: "authenticated",
    ensureSession,
  }),
}));

vi.mock("../notifications/notification-api.js", () => ({
  requireNotificationToken: vi.fn(async () => "token"),
  fetchUnreadNotificationCount: vi.fn(async () => 2),
}));

const announcement = {
  id: "a-1",
  title: "Sourcing window",
  slug: "sourcing-window",
  summary: "West Africa corridor update.",
  body: "<p>Ships leave <strong>Lagos</strong> on Friday.</p>",
  status: "published",
  publishedAt: "2026-09-01T10:00:00.000Z",
  viewCount: 4,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  media: [
    {
      id: "m1",
      documentId: "d1",
      name: "photo",
      mimeType: "image/jpeg",
      sizeBytes: 12,
      kind: "image",
      href: "/media/a.jpg",
      sortOrder: 0,
    },
  ],
};

vi.mock("../api/parity-api.js", () => ({
  listAnnouncements: vi.fn(async () => [announcement]),
  getAnnouncement: vi.fn(async () => announcement),
  listAnnouncementReplies: vi.fn(async () => ({ items: [], nextCursor: null })),
  createAnnouncementReply: vi.fn(async (_token: string, _id: string, body: string) => ({
    id: "r-1",
    body,
    createdAt: new Date().toISOString(),
    authorLabel: "Ada Buyer",
  })),
  listAnnouncementReactions: vi.fn(async () => []),
  toggleAnnouncementReaction: vi.fn(async () => [{ emoji: "thumbs", count: 1, reacted: true }]),
}));

const commodity = {
  slug: "sesame-seeds",
  name: "Sesame Seeds",
  category: "Oilseeds",
  shortDescription: "Export sesame.",
  imageSrc: "/media/ie/sesame.jpg",
  imageAlt: "Sesame",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("buyer notification icon routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the authenticated notification module", async () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route
            path="/app"
            element={
              <>
                <CustomerNotificationMenu />
                <Outlet />
              </>
            }
          >
            <Route index element={<p>Workspace home</p>} />
            <Route path="notifications" element={<h1>Notifications</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(await screen.findByRole("heading", { name: /^notifications$/i })).toBeInTheDocument();
    expect(screen.queryByText("Workspace home")).not.toBeInTheDocument();
  });
});

describe("authenticated agro produce routing", () => {
  it("keeps view and quote actions inside the card and on buyer routes", () => {
    render(
      <MemoryRouter>
        <IeCommodityCard
          commodity={commodity}
          detailHref={`/app/agro-produce/${commodity.slug}`}
          quoteHref={ieProcurementCreatePath(commodity.slug)}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /view commodity/i })).toHaveAttribute(
      "href",
      "/app/agro-produce/sesame-seeds",
    );
    expect(screen.getByRole("link", { name: /request a quote/i })).toHaveAttribute(
      "href",
      "/app/requests/new?ieCommodity=sesame-seeds",
    );
    expect(screen.getByRole("link", { name: /request a quote/i }).closest(".hamd-aie-commodity-card")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /view commodity/i })?.getAttribute("href")).not.toMatch(
      /\/integrated-export$/,
    );
  });
});

describe("notification destinations", () => {
  it("maps announcement notifications to buyer announcement detail", async () => {
    const { resolveNotificationHref } = await import("@hamd/ui/notifications");
    expect(
      resolveNotificationHref(
        { type: "announcement", metadata: { announcementId: "a-1" } },
        "app",
      ),
    ).toBe("/app/announcements/a-1");
  });
});

describe("buyer announcement module", () => {
  it("lists concise rows instead of dumping bodies", async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <AnnouncementsPage basePath="/app/announcements" />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /^announcements$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sourcing window/i })).toHaveAttribute(
      "href",
      "/app/announcements/sourcing-window",
    );
    expect(screen.queryByText(/ships leave/i)).not.toBeInTheDocument();
  });

  it("opens detail and persists a reply through the API", async () => {
    vi.mocked(listAnnouncementReplies)
      .mockResolvedValueOnce({ items: [], nextCursor: null })
      .mockResolvedValueOnce({
        items: [
          {
            id: "r-1",
            body: "Noted, thank you.",
            createdAt: new Date().toISOString(),
            authorLabel: "Ada Buyer",
          },
        ],
        nextCursor: null,
      });

    render(
      <MemoryRouter initialEntries={["/app/announcements/sourcing-window"]}>
        <AppProviders>
          <Routes>
            <Route path="/app/announcements/:id" element={<WorkspaceAnnouncementDetailPage />} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: /sourcing window/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/your reply/i), "Noted, thank you.");
    await user.click(screen.getByRole("button", { name: /post reply/i }));
    expect(createAnnouncementReply).toHaveBeenCalled();
    expect(await screen.findByText(/noted, thank you/i)).toBeInTheDocument();
  });
});
