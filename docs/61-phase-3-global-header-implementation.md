# Phase 3 - Global Header Implementation

**Component:** `GlobalHeader` (`@hamd/ui/navigation`)  
**Styles:** `@hamd/ui/navigation.css`  
**Blueprint:** `docs/53-phase-3-enterprise-navigation-system-blueprint.md`

---

## 1. Mission delivered

One unified navigation for Desktop / Tablet / Mobile.

| Capability | Implementation |
| --- | --- |
| Mega Menu | Click/keyboard open for Services, Catalog, Industries - not hover-only |
| Product Categories | Catalog mega column + mobile accordion |
| Services | Services mega panel |
| Industries | Industries mega panel |
| Search | Expandable command search panel; `onSearchSubmit` or GET `/search` |
| Notifications | Link/button + unread badge |
| Profile | Account link or `onProfileClick` |
| Theme Switcher | Cycles light → dark → system via `onThemeChange` |
| Language Placeholder | Native select; disabled locales marked “(soon)” |
| Sticky | `position: sticky; top: 0` |
| Transparent → Solid | `transparentUntilScroll` + scroll offset |
| Mobile Drawer | Right sheet, backdrop, Esc/Close, body scroll lock, accordions |
| Skip link | Skip to `#main-content` |

Primary CTA remains **Request Procurement** (never hidden).

---

## 2. Usage

```tsx
import { GlobalHeader } from "@hamd/ui/navigation";
import "@hamd/ui/navigation.css";

<GlobalHeader
  transparentUntilScroll
  notificationCount={2}
  theme={theme}
  onThemeChange={setTheme}
  onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
/>
```

Ensure page content uses `id="main-content"` for the skip target.

---

## 3. Accessibility

- Landmarks: `header`, labelled `nav`, mobile `dialog` + `aria-modal`
- Mega triggers: `aria-expanded` / `aria-controls`
- Esc closes panels and returns focus to trigger when applicable
- Focus-visible rings; ≥44px targets
- Reduced motion: disables panel/drawer transitions
- Language and theme exposed with accessible names

---

## 4. Testing

`packages/ui/src/navigation/GlobalHeader.test.tsx`

- Renders brand, mega triggers, Request, notifications, theme, language, skip link  
- Mega open/close via click + Escape  
- Search submit callback  
- Mobile drawer + collapsible Catalog  
- Transparent → solid on scroll  

```bash
pnpm --filter @hamd/ui test
pnpm --filter @hamd/ui build
```

---

## 5. Engineering Review

| Area | Verdict |
| --- | --- |
| Matches nav doctrine (click mega, persistent Request) | **PASS** |
| Responsive breakpoints (drawer &lt;960, nav ≥960) | **PASS** |
| Performance (CSS transitions only; no heavy deps) | **PASS** |
| Tree-shake export `@hamd/ui/navigation` | **PASS** |
| Theme/language are controlled props (app owns state) | **PASS** |
| No hover-only mega | **PASS** |

**Engineering verdict:** GO for public website shell composition.

**Follow-ups (not blocking):** full focus-trap roving tabindex inside drawer; wire Universal Search combobox suggestions into the search panel.

---

## STOP

Global Header implemented with documentation, tests, and engineering review.
