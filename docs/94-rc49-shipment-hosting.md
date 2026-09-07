# RC4.9 - Hosted Shipment Module

**Status:** COMPLETE (hosted in `apps/web` - `/app` is the buyer client workspace)  
**Date:** 2026-08-06

## Pages

| Route | Experience |
| --- | --- |
| `/app/shipments` | Directory + detail workspace |
| `/app/shipments/:id` | Deep-linked detail selection |

Nav: Workspace → Shipments.

## Features

| Feature | Implementation |
| --- | --- |
| Timeline | Serialized from milestones + history; also `GET /:id/timeline` |
| Status | Directory + overview pills; `POST /:id/transitions` |
| Milestones | Serialized on list/get |
| Tracking number / Carrier / ETA | Overview + Tracking tab; create + plan update |
| Documents | Linked document metadata; binary upload → honest 501 until document platform |
| Delivery confirmation | Proof tab + evidence document selection → `POST /:id/confirm-delivery` |
| History | History tab + enriched `GET /:id/history` (actorName) |

## Map integration hooks (no fake maps)

- UI props: `mapAdapter` (`ShipmentMapAdapter`) and `renderMap`
- Hook: `useShipmentMapSlot`
- Default: honest placeholder (label/region only; **no invented lat/lng tiles**)
- Host currently passes `mapAdapter={null}` - wire a real SDK later

## API enrichments

Serialize now includes: `purchaseOrderCode`, `destinationLabel`, labeled milestones, `timeline`, `history` (+ actor), `proofOfDelivery`, `map` placeholder (coords null unless known), document display fields.

Create accepts optional `publicCode` (auto-generated when omitted).

## Remaining

1. Document platform binary upload + signed URLs for evidence.
2. Real map provider adapter (Mapbox/Google) via `mapAdapter`.
3. Carrier tracking gateway beyond Noop (refresh currently reloads shipment).
4. Persist origin labels when product adds shipment geo fields.
