import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RequestCoach } from "./RequestCoach.js";

describe("RequestCoach", () => {
  it("uses an accessible icon control and a top-left close when open", async () => {
    const user = userEvent.setup();
    render(<RequestCoach actions={[]} />);
    await user.click(screen.getByRole("button", { name: "Request guide" }));
    expect(screen.getByRole("dialog", { name: "Request guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close request guide" })).toBeInTheDocument();
    expect(screen.queryByText("Guide")).not.toBeInTheDocument();
  });
});
