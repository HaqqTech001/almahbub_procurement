import type { Meta, StoryObj } from "@storybook/react";
import { NotificationCenter } from "../src/notifications/NotificationCenter";
import { notificationCenterFixture } from "../src/notifications/fixtures";
import "../src/styles/notifications.css";

const meta: Meta<typeof NotificationCenter> = {
  title: "Notifications/NotificationCenter",
  component: NotificationCenter,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof NotificationCenter>;

export const Default: Story = {
  args: {
    notifications: notificationCenterFixture,
  },
};

export const Loading: Story = {
  args: {
    notifications: [],
    loading: true,
  },
};

export const Compact: Story = {
  args: {
    notifications: notificationCenterFixture,
    density: "compact",
  },
};

export const EmptyFiltered: Story = {
  args: {
    notifications: [],
  },
};
