# User & Organization Management

**Package:** `@hamd/ui/identity` (+ `@hamd/ui/identity.css`)  
**Auth journey:** remains `@hamd/ui/auth` (login/register/invite accept/reset)  
**Rule:** Presentational workspace. Hosts wire Genesis identity APIs. Preserve `apps/api` auth business logic.

## Audit - KEEP / REFACTOR / REPLACE

| Asset | Decision | Notes |
| --- | --- | --- |
| `AuthService` login/refresh/logout/me/profile | **KEEP** | Argon2id, membership selection, JWT `org` claim, refresh rotation, CSRF |
| `authenticate` + permission resolution | **KEEP** | Tenancy boundary for all domains |
| Prisma User / Org / Membership / Role / Session / Invitation / Audit | **KEEP** | Status enums match docs/13 |
| Notification preferences API | **KEEP** | Compose into Profile tab via handlers |
| `@hamd/ui/auth` screens | **KEEP** | Registration/login/invite accept/reset UX |
| Org switch via refresh `organizationId` | **REFACTOR** | UI switcher + host re-issues token |
| Legacy `backend/routes/auth.js` + `users.js` | **REPLACE** | Flat `user\|admin` incompatible with RBAC |
| Admin `UsersPage` hard delete | **REPLACE** | Soft suspend/deactivate/delete + audit |
| Settings mock theme/2FA | **REPLACE** | Theme client-side; MFA via auth placeholder |
| Genesis org/member/invite/session admin APIs | **NEW** (host) | Schema ready; UI contracts defined here |

## Mission coverage

### Support
Registration · Login · Organizations · Org switching · Invitations · Membership · Roles · Permissions · Profile · Avatar · Preferences · Notification prefs · Language · Theme · Sessions · Devices · Security · Activity log  

### Admin
Create · Suspend · Deactivate · Restore · Delete · Invite · Reset password · Assign roles · Organization transfer  

### Enterprise
Bulk actions · Advanced search · Filtering · Pagination · CSV export · Audit logs  

## Import

```ts
import {
  IdentityWorkspace,
  identityMembersFixture,
  identityLazy,
} from "@hamd/ui/identity";
import "@hamd/ui/identity.css";
```

## Host wiring (preserve auth logic)

```tsx
<IdentityWorkspace
  currentUser={me}
  organizations={orgs}
  activeOrganizationId={orgId}
  members={members}
  /* … */
  onSwitchOrganization={(id) => auth.refresh({ organizationId: id })}
  onSaveProfile={(patch) => api.patch("/auth/profile", patch)}
  onSavePreferences={async (prefs) => {
    await api.patch("/auth/profile", { locale: prefs.locale, timeZone: prefs.timeZone });
    await api.patch("/notification-preferences", prefs.notifications);
  }}
/>
```

Account status ≠ membership status. Prefer soft delete (`deletedAt`) over hard delete.

## Reviews

See [76-user-organization-management-review.md](./76-user-organization-management-review.md) for accessibility and performance.
