import type { Meta, StoryObj } from "@storybook/react";
import { IdentityWorkspace } from "./IdentityWorkspace.js";
import {
  identityActivityFixture,
  identityCurrentUserFixture,
  identityInvitationsFixture,
  identityMembersFixture,
  identityOrganizationsFixture,
  identityPermissionsFixture,
  identityPreferencesFixture,
  identityRolesFixture,
  identitySessionsFixture,
} from "./fixtures.js";

const meta: Meta<typeof IdentityWorkspace> = {
  title: "Identity/IdentityWorkspace",
  component: IdentityWorkspace,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof IdentityWorkspace>;

const args = {
  currentUser: identityCurrentUserFixture,
  organizations: identityOrganizationsFixture,
  activeOrganizationId: "org-almahbub",
  members: identityMembersFixture,
  invitations: identityInvitationsFixture,
  roles: identityRolesFixture,
  permissions: identityPermissionsFixture,
  sessions: identitySessionsFixture,
  activity: identityActivityFixture,
  preferences: identityPreferencesFixture,
};

export const Default: Story = { args };

export const MembersTab: Story = {
  args: { ...args, initialTab: "members" },
};

export const DarkTheme: Story = {
  args: {
    ...args,
    preferences: { ...identityPreferencesFixture, theme: "dark" },
    initialTab: "profile",
  },
};

export const Loading: Story = {
  args: { ...args, loading: true },
};
