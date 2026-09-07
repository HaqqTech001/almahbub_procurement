# RC-POLISH-05 - Final public navbar information architecture

## Root cause

The public header treated every control as a peer in one crowded utility row:

- Language selector (default options always present)
- Full-width **Request Procurement** CTA
- Search + theme + auth + menu
- Floating fixed **Product tour** control competing with the hero

Secondary causes: logo `max-width` + `nowrap`, inconsistent control heights, theme track too large for its icons, and mobile `display: contents` + order hacks that hid Search/Theme while keeping Notify/Avatar.

## New architecture

```
Desktop:  [Logo] | Home Services Catalog Industries About Contact | [Search][Theme][Help][Sign In][Sign Up]
Mobile:   [Menu] [Logo] …spacer… [Search][Theme]
Drawer:   primary links + Sign In/Sign Up + Help + theme
```

Grid: `brand | primary-nav | utilities` (menu button first child, hidden on desktop).

## Removed from primary navbar

- Language selector (footprint gone; `languageOptions: []`)
- Request Procurement CTA (`requestCta: null`; remains in hero/sections)
- Floating Tour / TourOn button
- Workspace dump from account menu (account = Profile / Settings / Help / Sign Out)

## Tour

`GuideControl` labeled **Help** in `utilityExtra` / drawer. `PublicProductTourGate` no longer mounts a floating control.

## Theme

Fixed track (2.5×1.375rem), 12px icons fully inside, thumb centered, focus ring, no “Theme” label.

## Evidence

`apps/web/e2e/evidence/rc-polish-05/`

## Remaining defects

- Mobile drawer previously collapsed to header height because `backdrop-filter` on `.hamd-header--solid` created a containing block for nested `position: fixed` - **fixed** by moving drawer/backdrop outside `<header>` into `.hamd-header-shell`.
- Authenticated public browsing still uses marketing links in the header (workspace owns app nav once on `/app`).

## STOP

No further module work until this navbar system is accepted.
