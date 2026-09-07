import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OpsModulePage } from "./OpsModulePage.js";

describe("OpsModulePage", () => {
  it("search filters rows", () => {
    render(
      <OpsModulePage
        title="Products"
        rows={[
          { id: "1", name: "Ball valve", status: "active" },
          { id: "2", name: "Compressor", status: "draft" },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
        ]}
        searchKeys={["name", "status"]}
      />,
    );

    expect(screen.getByText("Ball valve")).toBeInTheDocument();
    expect(screen.getByText("Compressor")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search Products"), {
      target: { value: "compress" },
    });

    expect(screen.queryByText("Ball valve")).not.toBeInTheDocument();
    expect(screen.getByText("Compressor")).toBeInTheDocument();
  });
});
