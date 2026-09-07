import { describe, expect, it } from "vitest";

import {
  isLivePublishedAnnouncement,
  publishedAnnouncementWhere,
} from "../application/announcement-visibility.js";

describe("announcement public visibility", () => {
  const now = new Date("2026-08-18T12:00:00.000Z");

  it("hides drafts and expired notices, not published rows with a future schedule", () => {
    expect(
      isLivePublishedAnnouncement(
        {
          status: "draft",
          publishedAt: now,
          scheduledFor: null,
          expiresAt: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isLivePublishedAnnouncement(
        {
          status: "published",
          publishedAt: now,
          scheduledFor: new Date("2026-08-19T00:00:00.000Z"),
          expiresAt: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      isLivePublishedAnnouncement(
        {
          status: "published",
          publishedAt: new Date("2026-08-19T00:00:00.000Z"),
          scheduledFor: null,
          expiresAt: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      isLivePublishedAnnouncement(
        {
          status: "published",
          publishedAt: now,
          scheduledFor: null,
          expiresAt: new Date("2026-08-18T11:00:00.000Z"),
        },
        now,
      ),
    ).toBe(false);
  });

  it("shows a published pinned notice that is in window", () => {
    expect(
      isLivePublishedAnnouncement(
        {
          status: "published",
          publishedAt: new Date("2026-08-01T00:00:00.000Z"),
          scheduledFor: null,
          expiresAt: new Date("2026-08-20T00:00:00.000Z"),
        },
        now,
      ),
    ).toBe(true);
  });

  it("builds a Prisma where clause that excludes expired rows only", () => {
    const where = publishedAnnouncementWhere(now);
    expect(where.status).toEqual({ equals: "published", mode: "insensitive" });
    expect(where.AND).toHaveLength(1);
    expect(JSON.stringify(where)).not.toMatch(/scheduledFor/);
    expect(JSON.stringify(where)).not.toMatch(/publishedAt/);
    expect(JSON.stringify(where)).not.toMatch(/preference/i);
    expect(JSON.stringify(where)).not.toMatch(/audience/i);
  });
});
