import type { Meta, StoryObj } from "@storybook/react";
import { QuotationWorkspace } from "./QuotationWorkspace.js";
import { quotationRecordsFixture } from "./fixtures.js";

const meta: Meta<typeof QuotationWorkspace> = {
  title: "Procurement/QuotationWorkspace",
  component: QuotationWorkspace,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof QuotationWorkspace>;

export const Default: Story = {
  args: { quotations: quotationRecordsFixture },
};

export const Loading: Story = {
  args: { quotations: [], loading: true },
};
