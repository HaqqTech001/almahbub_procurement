import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import {
  filterMemberships,
  membershipsToCsv,
  paginateRows,
  emptyDirectoryFilters,
} from "./types.js";

const baseProps = {
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

describe("identity helpers", () => {
  it("filters, paginates, and exports CSV", () => {
    const filtered = filterMemberships(identityMembersFixture, {
      ...emptyDirectoryFilters(),
      query: "james",
    });
    expect(filtered).toHaveLength(1);
    const page = paginateRows(identityMembersFixture, 1, 2);
    expect(page.items).toHaveLength(2);
    expect(page.pageCount).toBeGreaterThan(1);
    expect(membershipsToCsv(filtered)).toContain("james@almahbub.example");
  });
});

describe("IdentityWorkspace", () => {
  it("renders overview, org switcher, and skip link", () => {
    render(<IdentityWorkspace {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: /user & organization/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to identity content/i }),
    ).toHaveAttribute("href", "#hamd-id-main");
    expect(screen.getByLabelText(/switch organization/i)).toBeInTheDocument();
    expect(screen.getByText(/Ada Okonkwo/i)).toBeInTheDocument();
  });

  it("supports member search, filter, pagination, and CSV export", async () => {
    const user = userEvent.setup();
    const onExportCsv = vi.fn();
    render(<IdentityWorkspace {...baseProps} onExportCsv={onExportCsv} />);

    await user.click(screen.getByRole("button", { name: /^members$/i }));
    await user.type(screen.getByLabelText(/search members/i), "sara");
    expect(screen.getByText(/Sara Ibrahim/i)).toBeInTheDocument();
    expect(screen.queryByText(/James Nwosu/i)).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/search members/i));
    const statusSelect = screen.getByLabelText(/^status$/i);
    await user.selectOptions(statusSelect, "suspended");
    expect(screen.getByText(/Leo Mensah/i)).toBeInTheDocument();

    await user.selectOptions(statusSelect, "all");
    await user.click(screen.getByRole("button", { name: /csv export/i }));
    expect(onExportCsv).toHaveBeenCalled();
    expect(String(onExportCsv.mock.calls[0]?.[0])).toContain("email");
  });

  it("invites members, assigns roles, and switches organization", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(undefined);
    const onAssignRoles = vi.fn().mockResolvedValue(undefined);
    const onSwitchOrganization = vi.fn().mockResolvedValue(undefined);

    render(
      <IdentityWorkspace
        {...baseProps}
        onInvite={onInvite}
        onAssignRoles={onAssignRoles}
        onSwitchOrganization={onSwitchOrganization}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(/switch organization/i),
      "org-partner",
    );
    expect(onSwitchOrganization).toHaveBeenCalledWith("org-partner");

    await user.click(screen.getByRole("button", { name: /^invitations$/i }));
    await user.type(screen.getByLabelText(/^email$/i), "ops@client.example");
    await user.click(screen.getByRole("button", { name: /invite user/i }));
    expect(onInvite).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^roles$/i }));
    await user.click(screen.getByRole("button", { name: /assign roles/i }));
    expect(onAssignRoles).toHaveBeenCalled();
  });

  it("saves profile preferences, theme, and revokes sessions", async () => {
    const user = userEvent.setup();
    const onSaveProfile = vi.fn().mockResolvedValue(undefined);
    const onSavePreferences = vi.fn().mockResolvedValue(undefined);
    const onThemeChange = vi.fn();
    const onRevokeSession = vi.fn().mockResolvedValue(undefined);

    render(
      <IdentityWorkspace
        {...baseProps}
        onSaveProfile={onSaveProfile}
        onSavePreferences={onSavePreferences}
        onThemeChange={onThemeChange}
        onRevokeSession={onRevokeSession}
      />,
    );

    await user.click(screen.getByRole("button", { name: /profile & prefs/i }));
    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), "Adanna");
    await user.click(screen.getByRole("button", { name: /save profile/i }));
    expect(onSaveProfile).toHaveBeenCalled();

    await user.click(screen.getByRole("radio", { name: /^dark$/i }));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
    await user.click(screen.getByRole("button", { name: /save preferences/i }));
    expect(onSavePreferences).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^security$/i }));
    expect(screen.getByText(/Ada's MacBook/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^revoke$/i }));
    expect(onRevokeSession).toHaveBeenCalled();
  });

  it("shows activity log and admin lifecycle actions", async () => {
    const user = userEvent.setup();
    const onAdminUserAction = vi.fn().mockResolvedValue(undefined);
    render(
      <IdentityWorkspace {...baseProps} onAdminUserAction={onAdminUserAction} />,
    );

    await user.click(screen.getByRole("button", { name: /^activity$/i }));
    expect(screen.getByText(/membership\.invited/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await user.click(screen.getByRole("button", { name: /suspend user/i }));
    expect(onAdminUserAction).toHaveBeenCalledWith(
      expect.any(String),
      "suspend",
    );
  });

  it("supports bulk selection and loading skeleton", async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <IdentityWorkspace {...baseProps} onBulkAction={onBulkAction} />,
    );

    await user.click(screen.getByRole("button", { name: /^members$/i }));
    const table = screen.getByRole("table");
    await user.click(within(table).getByLabelText(/select page/i));
    const bulk = screen.getByLabelText(/bulk actions/i);
    expect(bulk).toBeInTheDocument();
    await user.click(within(bulk).getByRole("button", { name: /^suspend$/i }));
    expect(onBulkAction).toHaveBeenCalled();

    rerender(<IdentityWorkspace {...baseProps} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
