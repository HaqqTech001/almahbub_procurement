import type { Meta, StoryObj } from "@storybook/react";
import { SupplierWorkspace } from "./SupplierWorkspace.js";
import { supplierRecordsFixture } from "./fixtures.js";

const meta: Meta<typeof SupplierWorkspace> = {
  title: "Sourcing/SupplierWorkspace",
  component: SupplierWorkspace,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof SupplierWorkspace>;

export const Default: Story = {
  args: { suppliers: supplierRecordsFixture },
};

export const SuspendedFocus: Story = {
  args: {
    suppliers: supplierRecordsFixture,
    initialSupplierId: "sup-chem",
  },
};

export const Loading: Story = {
  args: { suppliers: [], loading: true },
};
