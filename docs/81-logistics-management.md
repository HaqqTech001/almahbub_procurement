# Logistics Management

**Package:** `@hamd/ui/shipments` (+ `@hamd/ui/shipments.css`)

## Audit

| Asset | Decision |
| --- | --- |
| Prisma `ShipmentStatus` + milestone / history models | **KEEP** |
| API `/api/v1/shipments` (logistics module) | **KEEP** - hosts inject handlers |
| Carrier / tracking / POD (`deliveryEvidence`) | **KEEP** schema; UI surfaces |
| Map provider | **PLACEHOLDER + hooks** - `mapAdapter` / `renderMap` / `useShipmentMapSlot`; no fake maps |

## Mission coverage

Shipment · Tracking · Milestones · ETA · Carrier · Documents · Proof of delivery · Timeline · History · Map hooks

## Import

```ts
import { ShipmentWorkspace, useShipmentMapSlot } from "@hamd/ui/shipments";
import "@hamd/ui/shipments.css";
```

Hosted production route: `/app/shipments` (see `docs/94-rc49-shipment-hosting.md`).
