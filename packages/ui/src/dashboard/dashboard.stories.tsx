import type { Meta, StoryObj } from "@storybook/react";
import { ClientDashboard } from "../src/dashboard/ClientDashboard";
import { dashboardFixture } from "../src/dashboard/fixtures";
import "../src/styles/dashboard.css";

const meta: Meta<typeof ClientDashboard> = {
  title: "Dashboard/ClientDashboard",
  component: ClientDashboard,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof ClientDashboard>;

export const Default: Story = {
  args: {
    data: dashboardFixture,
    shell: { userLabel: "Ada Okoro", notificationCount: 1 },
  },
};

export const Loading: Story = {
  args: {
    data: dashboardFixture,
    loading: true,
  },
};

export const ClearAttention: Story = {
  args: {
    data: { ...dashboardFixture, attention: [] },
  },
};

export const WithoutShell: Story = {
  args: {
    data: dashboardFixture,
    withShell: false,
  },
};
