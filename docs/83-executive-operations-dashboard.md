# Executive Operations Dashboard

**Package:** `@hamd/ui/dashboard` (`ExecutiveDashboard` + `@hamd/ui/dashboard.css`)  
**Role:** First screen after admin/ops login - operational awareness at a glance.

## Audit

| Asset | Decision |
| --- | --- |
| `ClientDashboard` (buyer) | **KEEP** separate |
| `DashboardWidget` chrome | **KEEP** + collapse / drag / resize |
| Architecture `docs/19` | **KEEP** hierarchy |
| Legacy admin recharts collage | **REPLACE** for Genesis |
| Inventory snapshot | **Future-ready** placeholder |

## Mission sections

Executive KPIs · Revenue overview · Procurement pipeline · Pending approvals · Recent procurement requests · Supplier performance · Financial summary · Shipment status · Inventory snapshot (future) · Customer activity · Recent notifications · System health · AI procurement insights · Quick actions · Recent audit events

## Charts

Line · Bar · Donut · Area · Heatmap placeholder - SVG with visually-hidden table alternatives (no chart-lib dependency).

## Widgets

Reorderable (HTML5 drag) · Collapsible · Resizable (column-span cycle) · Persistent layout (`localStorage` via `useDashboardLayout`)

## Quality

Responsive · Dark mode (`data-theme` / prefers-color-scheme) · Skip link · Landmarks · Live layout status · Content-visibility-friendly lists · Tests · Lazy export

## Import

```ts
import {
  ExecutiveDashboard,
  executiveDashboardFixture,
} from "@hamd/ui/dashboard";
import "@hamd/ui/dashboard.css";
```
