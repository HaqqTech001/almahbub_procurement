# User & Organization Management - Review

## Verdict

Ship `@hamd/ui/identity` as the Genesis management surface. Keep `apps/api` auth core untouched. Replace legacy MySQL user admin when org/member APIs land.

## Accessibility review

| Check | Status |
| --- | --- |
| Skip link to main content | Pass |
| Landmark nav + main | Pass |
| Org switcher labelled | Pass |
| Member table caption + column headers | Pass |
| Bulk region labelled | Pass |
| Theme radios (`role="radio"` + `aria-checked`) | Pass |
| Live status / error alerts | Pass |
| Avatar decorative (`aria-hidden`) with text name adjacent | Pass |
| Keyboard operable tabs/actions | Pass (native buttons/selects) |
| Reduced motion on skeleton | Pass |
| Color not sole status signal | Pass (text + pill) |

**Follow-ups:** add focus trap when invite modal is extracted; announce page changes on tab switch for SR users if hosts use route-level titles.

## Performance review

| Check | Status |
| --- | --- |
| Presentational - no fetch/socket in package | Pass |
| Client filter/paginate (pageSize default 10) | Pass |
| CSV built only on export | Pass |
| Table wrap `content-visibility: auto` | Pass |
| Lazy export `identityLazy.IdentityWorkspace` | Pass |
| Fixtures isolated from runtime bundle via separate imports | Pass |
| Avoided heavy virtualization (member pages are paged) | Acceptable for org-scale directories |

**Follow-ups:** host-side server pagination when member counts exceed ~500; virtualize activity log if audit volume is high; avatar uploads via signed URL + CDN.

## Preserved business rules (must not regress)

1. Invalid credentials message is generic for bad password and non-active users.
2. Access token embeds organization; refresh rotates hashed token under CSRF.
3. Permissions resolved server-side - UI never trusts client role strings as authorization.
4. Profile PATCH whitelist only (`firstName`, `lastName`, `displayName`, `locale`, `timeZone`).
5. Suspend user (account) ≠ remove membership (one org).

## Test plan

- [x] Helper filter / paginate / CSV
- [x] Overview + org switch
- [x] Members search / filter / export / bulk
- [x] Invite + assign roles
- [x] Profile / theme / prefs / revoke session
- [x] Activity + admin lifecycle
- [x] Loading skeleton

## Stop line

Production UI implementation, tests, documentation, accessibility review, and performance review complete for Phase 5.
