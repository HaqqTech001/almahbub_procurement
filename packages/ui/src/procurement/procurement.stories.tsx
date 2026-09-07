import type { Meta, StoryObj } from "@storybook/react";
import { ProcurementWorkspace } from "./ProcurementWorkspace.js";
import { procurementRequestsFixture } from "./fixtures.js";

const meta: Meta<typeof ProcurementWorkspace> = {
  title: "Procurement/ProcurementWorkspace",
  component: ProcurementWorkspace,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ProcurementWorkspace>;

export const Default: Story = {
  args: { requests: procurementRequestsFixture },
};

export const DraftFocus: Story = {
  args: {
    requests: procurementRequestsFixture,
  },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector(
      "button.hamd-pr-row",
    ) as HTMLButtonElement | null;
    button?.click();
  },
};

export const Loading: Story = {
  args: { requests: [], loading: true },
};
