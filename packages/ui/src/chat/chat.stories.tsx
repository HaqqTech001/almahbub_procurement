import type { Meta, StoryObj } from "@storybook/react";
import { EnterpriseChat } from "./EnterpriseChat.js";
import {
  chatMessagesFixture,
  chatRoomsFixture,
} from "./fixtures.js";

const meta: Meta<typeof EnterpriseChat> = {
  title: "Communication/EnterpriseChat",
  component: EnterpriseChat,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof EnterpriseChat>;

export const Default: Story = {
  args: {
    rooms: chatRoomsFixture,
    messages: chatMessagesFixture,
    currentUserId: "user-ada",
    title: "Messages",
  },
};

export const CompactDark: Story = {
  render: () => (
    <div data-theme="dark" style={{ minHeight: "100vh", padding: "1rem" }}>
      <EnterpriseChat
        rooms={chatRoomsFixture}
        messages={chatMessagesFixture}
        currentUserId="user-ada"
        density="compact"
      />
    </div>
  ),
};

export const Loading: Story = {
  args: {
    rooms: [],
    messages: [],
    currentUserId: "user-ada",
    loading: true,
  },
};
