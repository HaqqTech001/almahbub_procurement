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

it("replaces an empty child table with skeletons until resolved", () => {
 const props = {header:{title:"Records"},empty:{title:"No records"},isEmpty:true};
 const {rerender,container}=render(<ListModuleFrame {...props} loading><table><tbody /></table></ListModuleFrame>);
 expect(container.querySelectorAll(".hamd-module-skeleton tbody tr")).toHaveLength(6);
 expect(screen.queryByText("No records")).toBeNull();
 rerender(<ListModuleFrame {...props} loading={false} />);
 expect(screen.getByText("No records")).toBeInTheDocument();
 expect(container.querySelector(".hamd-module-skeleton")).toBeNull();
 rerender(<ListModuleFrame {...props} error="Unavailable" onRetry={() => {}} />);
 expect(screen.getByText("Unavailable")).toBeInTheDocument();
 expect(container.querySelector(".hamd-module-skeleton")).toBeNull();
 rerender(<ListModuleFrame header={{title:"Records"}}><p>Loaded record</p></ListModuleFrame>);
 expect(screen.getByText("Loaded record")).toBeInTheDocument();
});
