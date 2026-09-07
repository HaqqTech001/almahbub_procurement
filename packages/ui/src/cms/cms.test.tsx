import { describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CmsWorkspace } from "./CmsWorkspace.js";
import { cmsContentFixture, cmsMediaFixture } from "./fixtures.js";
import {
  CMS_CONTENT_TYPES,
  availableCmsCommands,
  cmsContentTypeLabel,
  emptyCmsFilters,
  filterCmsContent,
  filterCmsMedia,
} from "./types.js";

describe("cms helpers", () => {
  it("covers all mission content types in fixtures", () => {
    const types = new Set(cmsContentFixture.map((row) => row.type));
    for (const type of CMS_CONTENT_TYPES) {
      expect(types.has(type)).toBe(true);
      expect(cmsContentTypeLabel(type).length).toBeGreaterThan(2);
    }
  });

  it("filters content and media", () => {
    expect(
      filterCmsContent(cmsContentFixture, {
        ...emptyCmsFilters(),
        type: "faq",
      }).every((row) => row.type === "faq"),
    ).toBe(true);
    expect(
      filterCmsMedia(cmsMediaFixture, "wedding").map((m) => m.id),
    ).toEqual(["media-2"]);
  });

  it("exposes lifecycle commands by status", () => {
    expect(availableCmsCommands("draft")).toContain("submit_review");
    expect(availableCmsCommands("approved")).toContain("publish");
    expect(availableCmsCommands("published")).toContain("rollback");
    expect(availableCmsCommands("archived")).toEqual(["restore"]);
  });
});

describe("CmsWorkspace", () => {
  it(
    "covers manage types, draft/preview/publish, versions, schedule, SEO, media",
    async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onSaveDraft = vi.fn().mockResolvedValue(undefined);
      const onTransition = vi.fn().mockResolvedValue(undefined);
      const onPreview = vi.fn().mockResolvedValue(undefined);
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const onUploadMedia = vi.fn().mockResolvedValue(undefined);
      const onOpenMedia = vi.fn();

      render(
        <CmsWorkspace
          items={cmsContentFixture}
          media={cmsMediaFixture}
          onSelect={onSelect}
          onSaveDraft={onSaveDraft}
          onTransition={onTransition}
          onPreview={onPreview}
          onCreate={onCreate}
          onUploadMedia={onUploadMedia}
          onOpenMedia={onOpenMedia}
        />,
      );

      expect(
        screen.getByRole("heading", { name: /enterprise cms/i }),
      ).toBeInTheDocument();

      const directory = screen.getByLabelText(/cms content directory/i);
      const contentList = within(directory).getByLabelText(/^cms content$/i);
      expect(
        within(contentList).getByRole("button", {
          name: /primary homepage hero/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(contentList).getByRole("button", {
          name: /sourcing advisory/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(contentList).getByRole("button", {
          name: /how does an rfq work/i,
        }),
      ).toBeInTheDocument();

      await user.selectOptions(
        within(directory).getByLabelText(/^type$/i),
        "wedding_banner",
      );
      expect(
        within(directory).getByRole("button", {
          name: /q3 celebration banner/i,
        }),
      ).toBeInTheDocument();

      await user.selectOptions(
        within(directory).getByLabelText(/^type$/i),
        "news",
      );
      await user.click(
        within(directory).getByRole("button", {
          name: /corridor expansion update/i,
        }),
      );
      expect(onSelect).toHaveBeenCalled();

      const detail = screen.getByLabelText(/cms content detail/i);
      expect(
        within(detail).getByRole("heading", {
          name: /corridor expansion update/i,
        }),
      ).toBeInTheDocument();

      await user.click(
        within(detail).getByRole("button", { name: /^editor$/i }),
      );
      const titleInput = within(detail).getByDisplayValue(
        /corridor expansion update/i,
      );
      fireEvent.change(titleInput, {
        target: { value: "Corridor expansion update - revised" },
      });
      await user.click(
        within(detail).getByRole("button", {
          name: /apply editor changes/i,
        }),
      );
      expect(onSaveDraft).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: "Corridor expansion update - revised",
        }),
        expect.objectContaining({ rowVersion: expect.any(Number) }),
      );

      await user.click(
        within(detail).getByRole("button", { name: /^preview$/i }),
      );
      expect(
        within(detail).getByText(/preview - not indexable/i),
      ).toBeInTheDocument();
      await user.click(
        within(detail).getByRole("button", { name: /open host preview/i }),
      );
      expect(onPreview).toHaveBeenCalled();

      const tabs = within(detail).getByLabelText(/cms sections/i);
      await user.click(
        within(tabs).getByRole("button", { name: /version history/i }),
      );
      expect(
        within(detail).getByRole("list", { name: /version history/i }),
      ).toBeInTheDocument();

      await user.click(
        within(tabs).getByRole("button", { name: /^scheduling$/i }),
      );
      expect(
        within(detail).getByLabelText(/schedule for/i),
      ).toBeInTheDocument();

      await user.click(
        within(tabs).getByRole("button", { name: /seo metadata/i }),
      );
      expect(within(detail).getByLabelText(/seo title/i)).toBeInTheDocument();

      await user.click(
        within(tabs).getByRole("button", { name: /^media library$/i }),
      );
      const media = within(detail).getByRole("region", {
        name: /^media library$/i,
      });
      await user.click(
        within(media).getByRole("button", { name: /hero-lagos-port/i }),
      );
      expect(onOpenMedia).toHaveBeenCalled();

      await user.click(
        within(tabs).getByRole("button", { name: /^create$/i }),
      );
      await user.selectOptions(
        within(detail).getByLabelText(/^type$/i),
        "faq",
      );
      fireEvent.change(within(detail).getByLabelText(/^title$/i), {
        target: { value: "New FAQ" },
      });
      fireEvent.change(within(detail).getByLabelText(/^slug$/i), {
        target: { value: "new-faq" },
      });
      await user.click(
        within(detail).getByRole("button", { name: /create draft/i }),
      );
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "faq",
          title: "New FAQ",
          slug: "new-faq",
        }),
      );

      await user.selectOptions(
        within(directory).getByLabelText(/^type$/i),
        "all",
      );
      await user.selectOptions(
        within(directory).getByLabelText(/^status$/i),
        "approved",
      );
      await user.click(
        within(directory).getByRole("button", {
          name: /industrial valves landing/i,
        }),
      );
      await user.click(
        within(screen.getByLabelText(/cms content detail/i)).getByRole(
          "button",
          { name: /^publish$/i },
        ),
      );
      expect(onTransition).toHaveBeenCalledWith(
        expect.any(String),
        "publish",
        expect.objectContaining({ rowVersion: expect.any(Number) }),
      );
    },
    20_000,
  );

  it("renders skeleton while loading", () => {
    const { container } = render(
      <CmsWorkspace items={[]} loading media={[]} />,
    );
    expect(container.querySelector(".hamd-cms--skeleton")).toBeTruthy();
  });
});
