import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListModuleFrame } from "./ListModuleFrame.js";

describe("ListModuleFrame", () => {
  it("keeps the title outside the scrolling records region", () => {
    render(
      <ListModuleFrame
        header={{ title: "Announcements", description: "Published notices." }}
        toolbar={{
          search: { value: "", onChange: () => undefined, placeholder: "Search" },
        }}
      >
        <p>Published row</p>
      </ListModuleFrame>,
    );

    const title = screen.getByRole("heading", { name: "Announcements" });
    const records = document.querySelector(".hamd-module-workspace__records");
    expect(records).toBeTruthy();
    expect(records?.contains(title)).toBe(false);
    expect(records).toHaveTextContent("Published row");
    expect(document.querySelector(".hamd-list-module-frame")).toBeTruthy();
  });
});
