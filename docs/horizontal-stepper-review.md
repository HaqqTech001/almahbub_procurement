# Global horizontal stepper audit

14 September 2026. This correction extends the coordinated UX/wedding implementation documented in [the main review](rowdotul-hamd-26-quality-review.md). No commit, push, or index changes were performed.

## Locations found and decisions

| Location | Decision |
| --- | --- |
| `packages/ui/src/procurement/RequestCreateWizard.tsx`, used by `apps/web/src/procurement/ProcurementCreatePage.tsx` | Converted its `ProcurementProgress` wizard variant to the shared HorizontalStepper. Removed the old desktop indicator, mobile percentage/dot alternative, and legacy wrapping/vertical wizard CSS. Five visible labels: Items, Needs, Delivery, Media, Review. Full accessible names retain Products and Requirements. |
| `packages/ui/src/procurement/ProcurementProgress.tsx` | Wizard variant delegates to HorizontalStepper; non-wizard variants remain request lifecycle tracking. The existing exported percentage helper remains for compatibility but no longer renders wizard progress. |
| `packages/ui/src/auth/screens/RegisterScreen.tsx`, used by Web and Ops `src/auth/pages/RegisterPage.tsx` | Converted numbered registration pills to Account / Company / Security. Existing validation gates remain; errors mark the current step and focus its first invalid input. Earlier steps can be revisited without dropping entered values. |
| `packages/ui/src/guidance/TourRunner.tsx`, through `GuidanceRoot` and Web `src/product-tour/ProductTourHost.tsx` | Replaced the tour's step-derived percentage indicator with shared sequential progress. Tour action requirements and Previous/Next controls remain authoritative; the stepper does not add bypass navigation. Paused-tour text remains a status/control chip. No separate active Ops tour runner was found. |
| `apps/web/src/components/InteractionKit.tsx`, exported through `components/index.ts` | Existing Stepper delegates to HorizontalStepper, preserving its public props. No active page call sites were found. Removed its duplicate vertical CSS. |
| `packages/ui/src/procurement/RequestHub.tsx`, `ProcurementWorkspace.tsx`, request detail/list consumers including Ops `modules/RequestsPage.tsx` | Retained lifecycle/status progress, expected journey previews, and activity timelines. They describe request processing, not editable form steps. |
| `packages/ui/src/shipments/ShipmentWorkspace.tsx`, Web/Ops shipment pages | Retained shipment event/history timelines, explicitly outside the requested conversion scope. |
| `packages/ui/src/identity/IdentityWorkspace.tsx` and Web `components/InteractionKit.tsx` Timeline | Retained activity/history lists. |
| `packages/ui/src/guidance/GuidanceAdminWorkspace.tsx` | Retained the tour-content editing list. It edits definitions rather than representing a user's current wizard step. |
| `packages/ui/src/guidance/LearningCenter.tsx` | Retained aggregate completion percentage across tours, not one sequential flow. |
| Web `pages/HomePage.tsx`; Integrated Export `pages/IeHomePage.tsx`, `IeAboutPage.tsx`, `IeMarketsPage.tsx`, `IeProcessPage.tsx`, `IeQualityPage.tsx`, `IeRequestPage.tsx` | Retained informational process explanations and what-happens-next lists. These have no current/completed form state. The IE enquiry is a single form, not a wizard. |
| Shared homepage `WorkflowIndustriesSocial.tsx` / `InteractiveProcurementTimeline.tsx` | Retained marketing process exploration/timeline, not a validation-gated workflow. The simplified homepage no longer renders this legacy section. |
| Breadcrumbs, tab navigation, upload/loading indicators, audio sliders, quantity increment controls, dashboard charts, OTP inputs | Not stepper progress; unchanged. |

The audit searched both active apps and their shared UI consumers for step state, wizard components, numbered/sequential lists, progress markup, and CSS implementations. No separate checkout wizard or additional Ops form wizard was found.

## Shared implementation

`packages/ui/src/primitives/HorizontalStepper.tsx` is exported through the existing shared primitives/root exports. One stylesheet, `packages/ui/src/styles/horizontal-stepper.css`, loads through the foundation CSS already used by Web and Ops.

Labels sit above circles. Grid columns share one horizontal axis. Connector endpoints meet adjacent circle centers; opaque circles cover the line underneath them. Completed steps have a checkmark and brand fill, current steps have a prominent outline, future steps retain muted numbering, and errors display an exclamation mark plus an accessible error name. `aria-current="step"` identifies the current item. Earlier permitted steps use native keyboard-accessible buttons; future steps never become navigation buttons.

Three-to-five steps fit without scrolling at tested mobile widths. Longer flows use a single horizontally scrollable row, with the current step scrolled into view when progress changes. There is no vertical/mobile replacement, wrapping row, or progress card. Scroll affects only the stepper and uses immediate movement, without motion animation. Full names remain available through accessible labels and titles when longer caller-provided labels need truncation.

Request error fields map to step error states using the same central field-to-step mapping used by clickable validation messages. Existing Next validation and final error navigation remain intact. Returning to an earlier step does not allow jumping forward around validation.

## Verification and screenshots

Seven browser scenarios passed at **320, 360, 375, 390, 430, 768, and 1280 px**. Each covers the real shared request wizard and registration components in a test-only Vite fixture, plus a nine-step overflow example. These fixtures are not production routes or bundled application features.

Measurements confirm circle centers remain within one pixel of a common Y coordinate, connector endpoints match adjacent centers, labels stay above circles, and ordinary flows fit without a second row or horizontal page overflow. Browser interactions confirm completed/current/upcoming/error states, invalid registration focus, final request error navigation, absence of future-step buttons, and automatic current-step scrolling in the long flow. Shared unit tests also verify keyboard activation and first-error focus.

Screenshots are generated outside the repository:

| Width | Request progress | Request error | Registration error |
| --- | --- | --- | --- |
| 320 | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-320.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-error-320.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/registration-320.png) |
| 375 | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-375.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-error-375.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/registration-375.png) |
| 390 | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-390.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-error-390.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/registration-390.png) |
| 768 | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-768.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-error-768.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/registration-768.png) |
| Desktop (1280) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-1280.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/wizard-error-1280.png) | [Screenshot](C:/Users/USER/AppData/Local/Temp/hamd-stepper-review/registration-1280.png) |

Final focused tests: **48 shared UI, 21 Web, 15 Ops tests passed**. Shared UI build, Web/Ops typechecks and builds, and modified TypeScript/TSX lint passed. The expanded shared UI run passed 109 tests but failed collection on two unchanged empty files: `packages/ui/src/auth/http-envelope.test.ts` and `mutation-reconcile.test.ts`. The prior full Web/Ops failures remain documented in the main review; unrelated tests were not repaired.

Ops builds also retain a pre-existing CSS syntax warning: the unchanged `apps/ops/src/styles/ops.css` has an unexpected closing brace near line 2914. This warning was present in the build log from before the stepper correction. Modified shared styles parsed successfully; existing formatting differences were not globally reformatted.

To rerun browser checks: start `pnpm --filter @hamd/web exec vite --host 127.0.0.1 --port 4175 --strictPort`; set process-local `HAMD_WEB_URL` and `HAMD_STEPPER_DEV_URL` to `http://127.0.0.1:4175`; run `pnpm --filter @hamd/web exec playwright test e2e/horizontal-stepper.spec.ts --project=chromium-desktop --workers=2 --output=<temporary-directory>`. Without the explicit development opt-in, these fixture tests skip in the ordinary production-preview suite.

`git diff --check` passes for unstaged changes, and the combined source patch passes when generated reports are excluded. The full combined diff still fails whitespace checks only on previously staged Playwright error reports. No new screenshot, environment file, upload, dist file, or node_modules entry was staged by this work. The current index is not the final tested patch and remains **NO-GO as staged**.
