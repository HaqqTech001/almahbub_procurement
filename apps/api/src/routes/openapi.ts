import { apiServiceName, apiVersion } from "@hamd/contracts";
import { Router } from "express";

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "HAMD API",
    version: apiVersion,
    description: "HAMD procurement platform API.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/health/live": {
      get: {
        summary: "Liveness probe",
        responses: { "200": { description: "Service is running" } },
      },
    },
    "/health/ready": {
      get: {
        summary: "Readiness probe",
        responses: {
          "200": { description: "Dependencies are ready" },
          "503": { description: "A required dependency is unavailable" },
        },
      },
    },
    "/api/v1/products": {
      get: {
        summary: "List published catalogue products",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          {
            name: "sort",
            in: "query",
            schema: { type: "string", enum: ["newest", "name"] },
          },
        ],
        responses: {
          "200": { description: "Paginated published products" },
          "404": { description: "Category slug is unknown or unpublished" },
          "422": { description: "Invalid query" },
        },
      },
    },
    "/api/v1/products/{slug}": {
      get: {
        summary: "Get a published catalogue product by slug",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Published product" },
          "404": { description: "Product is missing or unpublished" },
        },
      },
    },
    "/api/v1/categories": {
      get: {
        summary: "List published catalogue categories",
        responses: {
          "200": { description: "Paginated published categories" },
        },
      },
    },
    "/api/v1/integrated-export/commodities": {
      get: {
        summary: "List Integrated Export commodities",
        description:
          "Public callers receive published, non-archived commodities only. Ops callers with ops:access may pass includeUnpublished=true to include drafts. Never returns International Product rows.",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["sortOrder", "name", "newest"],
            },
          },
          {
            name: "includeUnpublished",
            in: "query",
            schema: { type: "string", enum: ["true", "false"] },
            description: "Ops-only; ignored for anonymous and non-ops callers.",
          },
        ],
        responses: {
          "200": { description: "Paginated IE commodities" },
          "422": { description: "Invalid query" },
        },
      },
      post: {
        summary: "Create an Integrated Export commodity (defaults to draft)",
        description:
          "Requires authentication and ops:access. published defaults to false (draft).",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Commodity created" },
          "401": { description: "Authentication required" },
          "403": { description: "Missing ops:access" },
          "409": { description: "Slug conflict" },
          "422": { description: "Validation failed" },
        },
      },
    },
    "/api/v1/integrated-export/commodities/{slug}": {
      get: {
        summary: "Get an Integrated Export commodity by slug",
        description:
          "Public callers receive published commodities only. Ops with ops:access may retrieve drafts. Archived commodities return 404.",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Commodity detail" },
          "404": { description: "Missing, unpublished (public), or archived" },
        },
      },
    },
    "/api/v1/integrated-export/commodities/{id}": {
      patch: {
        summary: "Update an Integrated Export commodity",
        description:
          "Requires authentication and ops:access. Supports publish/unpublish via published boolean.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Commodity updated" },
          "401": { description: "Authentication required" },
          "403": { description: "Missing ops:access" },
          "404": { description: "Not found or archived" },
          "409": { description: "Slug conflict" },
          "422": { description: "Validation failed" },
        },
      },
      delete: {
        summary: "Archive an Integrated Export commodity",
        description:
          "Soft-archive (sets archivedAt, published=false). Hard delete is not used so future procurement links remain safe.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Commodity archived" },
          "401": { description: "Authentication required" },
          "403": { description: "Missing ops:access" },
          "404": { description: "Not found or already archived" },
        },
      },
    },
    "/api/v1/ops/products": {
      get: {
        summary: "List ops catalogue products",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Paginated ops products" } },
      },
      post: {
        summary: "Create a catalogue product (defaults to draft)",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Product created" },
          "422": { description: "Publish requirements not met" },
        },
      },
    },
    "/api/v1/ops/products/{id}": {
      get: {
        summary: "Get an ops catalogue product",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Product" }, "404": { description: "Not found" } },
      },
      patch: {
        summary: "Update a catalogue product including publication state",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Product updated" } },
      },
    },
    "/api/v1/ops/products/{id}/images": {
      post: {
        summary: "Add a public image URL to a product gallery",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Image added" } },
      },
    },
    "/api/v1/procurement-requests": {
      get: {
        summary: "List Procurement Requests",
        description:
          "LOB-scoped list. Omit `lob` to list authorised requests across LOBs (buyers remain owner-scoped). Use `international` or `integrated_export` to isolate. `all` requires request:manage.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "lob",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["international", "integrated_export", "all"],
            },
          },
        ],
        responses: {
          "200": { description: "Cursor-paginated Procurement Requests" },
          "401": { description: "Authentication required" },
          "403": { description: "Missing request:read permission" },
        },
      },
      post: {
        summary: "Create a Procurement Request draft",
        description:
          "Body may include `lob` (`international` | `integrated_export`). Omitting `lob` defaults to `international`.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Draft Procurement Request created" },
          "422": { description: "Validation failed" },
        },
      },
    },
    "/api/v1/procurement-requests/{requestId}": {
      get: {
        summary: "Get a Procurement Request",
        description:
          "Optional query `lob` enforces line-of-business isolation (404 on mismatch).",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "requestId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "lob",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["international", "integrated_export"],
            },
          },
        ],
        responses: {
          "200": { description: "Procurement Request including `lob`" },
          "404": { description: "Not found or LOB mismatch" },
        },
      },
    },
    "/api/v1/procurement-requests/{requestId}/transitions": {
      post: {
        summary: "Apply a governed Procurement Request lifecycle command",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Transition completed and audited" },
          "409": { description: "State transition or row version conflict" },
        },
      },
    },
    "/api/v1/quotations": {
      get: {
        summary: "List tenant-scoped quotation versions",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Quotation versions and commercial summaries" },
          "403": { description: "Missing quotation:read permission" },
        },
      },
      post: {
        summary: "Create a draft quotation family and version",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Draft quotation created" },
          "422": { description: "Commercial data validation failed" },
        },
      },
    },
    "/api/v1/quotations/{quotationId}": {
      get: {
        summary: "Get a quotation version",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Quotation version" } },
      },
      patch: {
        summary: "Update a draft quotation version",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Draft quotation updated" },
          "409": { description: "Draft state or row version conflict" },
        },
      },
    },
    "/api/v1/quotations/{quotationId}/transitions": {
      post: {
        summary: "Review, issue, accept, or decline a quotation",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Governed quotation transition completed" },
          "409": { description: "Lifecycle, expiry, or row version conflict" },
        },
      },
    },
    "/api/v1/quotations/{quotationId}/revise": {
      post: {
        summary: "Create a superseding draft quotation version",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Immutable successor quotation created" },
          "409": { description: "Only issued current versions are revisable" },
        },
      },
    },
    "/api/v1/quotations/{quotationId}/history": {
      get: {
        summary: "Get append-only quotation history",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Quotation lifecycle history" } },
      },
    },
    "/api/v1/invoices": {
      get: {
        summary: "List tenant-scoped invoices",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Invoices with payment allocation projections" },
          "403": { description: "Missing invoice:read permission" },
        },
      },
      post: {
        summary: "Create a draft invoice from an issued purchase order",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Draft invoice created" },
          "409": { description: "Purchase order is not issued" },
        },
      },
    },
    "/api/v1/invoices/{invoiceId}": {
      get: {
        summary: "Get an invoice and payment allocation projection",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Invoice" } },
      },
      patch: {
        summary: "Update a draft invoice",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Draft invoice updated" },
          "409": { description: "Draft state or row version conflict" },
        },
      },
    },
    "/api/v1/invoices/{invoiceId}/issue": {
      post: {
        summary: "Issue an invoice and prepare PDF and email events",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Invoice issued and audited" } },
      },
    },
    "/api/v1/invoices/{invoiceId}/void": {
      post: {
        summary: "Void a draft or issued invoice",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Invoice voided and audited" } },
      },
    },
    "/api/v1/invoices/{invoiceId}/history": {
      get: {
        summary: "Get append-only invoice history",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Invoice history" } },
      },
    },
    "/api/v1/payments": {
      get: {
        summary: "List tenant-scoped payment receipt projections",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Payments with allocations and receipt evidence" } },
      },
      post: {
        summary: "Create an idempotent manual payment draft",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "Idempotency-Key", in: "header", required: true }],
        responses: { "201": { description: "Manual payment draft created" } },
      },
    },
    "/api/v1/payments/{paymentId}": {
      get: {
        summary: "Get a payment receipt projection",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Payment, evidence, and invoice allocations" } },
      },
    },
    "/api/v1/payments/{paymentId}/submit": {
      post: {
        summary: "Submit a manual payment for independent confirmation",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Payment awaiting dual-control confirmation" } },
      },
    },
    "/api/v1/payments/{paymentId}/confirm": {
      post: {
        summary: "Confirm and atomically allocate a manual payment",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Payment confirmed and invoice balances updated" },
          "403": { description: "Creator cannot confirm their own payment" },
          "409": { description: "Allocation cap, eligibility, or row version conflict" },
        },
      },
    },
    "/api/v1/payments/{paymentId}/history": {
      get: {
        summary: "Get append-only payment history",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Payment lifecycle history" } },
      },
    },
    "/api/v1/shipments": {
      get: {
        summary: "List tenant-scoped shipment projections",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Shipments with tracking, containers, documents, inspections, and milestones" } },
      },
      post: {
        summary: "Create a planned shipment from an eligible purchase order",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Planned shipment created and audited" }, "409": { description: "Purchase order is ineligible" } },
      },
    },
    "/api/v1/shipments/{shipmentId}": {
      get: {
        summary: "Get an authorized shipment projection",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Shipment details" } },
      },
      patch: {
        summary: "Update shipment planning fields with optimistic concurrency",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Planned shipment updated" }, "409": { description: "Only planned shipments are editable" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/transitions": {
      post: {
        summary: "Apply a governed shipment lifecycle command",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Shipment lifecycle command completed" }, "409": { description: "State or row-version conflict" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/milestones": {
      post: {
        summary: "Append an evidence-linked shipment milestone",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Append-only milestone recorded" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/containers": {
      post: {
        summary: "Add a shipment container",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Container linked to shipment" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/tracking": {
      post: {
        summary: "Set carrier and tracking reference through gateway port",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Tracking reference recorded" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/documents": {
      post: {
        summary: "Link a UUID document reference to a shipment",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Document linked" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/evidence": {
      post: {
        summary: "Link an evidence UUID reference to a shipment",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Evidence document linked" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/inspections": {
      post: {
        summary: "Record an append-only shipment inspection",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Inspection recorded" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/confirm-delivery": {
      post: {
        summary: "Operations-only confirmation of delivered shipment evidence",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Delivery evidence verified and shipment completed" }, "403": { description: "Missing shipment:confirm permission" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/history": {
      get: {
        summary: "Get append-only shipment history",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Shipment command and confirmation history" } },
      },
    },
    "/api/v1/shipments/{shipmentId}/timeline": {
      get: {
        summary: "Get the append-only shipment milestone timeline",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Ordered shipment milestones and evidence metadata" } },
      },
    },
    "/api/v1/notifications": {
      get: {
        summary: "List the authenticated user's tenant-scoped notification inbox",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Notifications filtered by status, type, priority, and safe text search" } },
      },
    },
    "/api/v1/notifications/unread-count": {
      get: {
        summary: "Get the authenticated user's unread notification count",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Unread count" } },
      },
    },
    "/api/v1/notifications/read": {
      post: {
        summary: "Idempotently mark up to 100 owned notifications as read",
        security: [{ bearerAuth: [] }],
        responses: { "204": { description: "Notifications marked read" } },
      },
    },
    "/api/v1/notifications/read-all": {
      post: {
        summary: "Mark every unread inbox notification as read",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Count of notifications marked read" } },
      },
    },
    "/api/v1/notifications/{notificationId}/unread": {
      post: {
        summary: "Mark an owned notification unread",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Notification updated" } },
      },
    },
    "/api/v1/notifications/{notificationId}/archive": {
      post: {
        summary: "Archive an owned notification",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Notification archived" } },
      },
    },
    "/api/v1/notifications/{notificationId}/unarchive": {
      post: {
        summary: "Restore an owned archived notification",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Notification restored" } },
      },
    },
    "/api/v1/notifications/{notificationId}": {
      delete: {
        summary: "Soft-delete an owned notification",
        security: [{ bearerAuth: [] }],
        responses: { "204": { description: "Notification deleted" } },
      },
    },
    "/api/v1/notification-preferences": {
      get: {
        summary: "List the authenticated user's notification preferences",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Preference records" } },
      },
      patch: {
        summary: "Update permitted notification channel preferences",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Preferences updated" }, "422": { description: "Mandatory notices cannot be disabled" } },
      },
    },
    "/api/v1/admin/communication/templates": {
      get: {
        summary: "List organization communication templates and immutable versions",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Templates" } },
      },
      post: {
        summary: "Create a communication template draft",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Template created" } },
      },
    },
    "/api/v1/admin/communication/templates/{templateId}": {
      get: {
        summary: "Get an organization-scoped communication template",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Template with versions" } },
      },
    },
    "/api/v1/admin/communication/templates/{templateId}/revisions": {
      post: {
        summary: "Append a new immutable template revision",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Template revision created" } },
      },
    },
    "/api/v1/admin/communication/templates/{templateId}/publish": {
      post: {
        summary: "Publish the latest template revision with separation of duties",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Template published" }, "409": { description: "Template author cannot self-publish" } },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Authenticate with email and password",
        responses: {
          "200": { description: "Access token returned; refresh and CSRF cookies set" },
          "401": { description: "Invalid credentials" },
          "403": { description: "Email not verified" },
          "423": { description: "Account temporarily locked" },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        summary: "Register a buyer account and organization",
        responses: {
          "201": { description: "Pending email verification" },
          "409": { description: "Email already registered" },
          "422": { description: "Validation failed" },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        summary: "Request a password reset email (generic response)",
        responses: { "202": { description: "Accepted" }, "429": { description: "Rate limited" } },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        summary: "Reset password with a one-time token",
        responses: {
          "200": { description: "Password updated" },
          "400": { description: "Invalid or expired token" },
        },
      },
    },
    "/api/v1/auth/verify-email": {
      post: {
        summary: "Verify email with body token or code",
        responses: { "200": { description: "Email verified" }, "400": { description: "Invalid or expired token" } },
      },
    },
    "/api/v1/auth/verify-email/{token}": {
      post: {
        summary: "Verify email with path token",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Email verified" }, "400": { description: "Invalid or expired token" } },
      },
    },
    "/api/v1/auth/resend-verification": {
      post: {
        summary: "Resend verification email (generic response)",
        responses: { "202": { description: "Accepted" } },
      },
    },
    "/api/v1/auth/otp/verify": {
      post: {
        summary: "Verify email using a six-digit OTP code",
        responses: { "200": { description: "Email verified" }, "400": { description: "Invalid or expired code" } },
      },
    },
    "/api/v1/auth/otp/resend": {
      post: {
        summary: "Resend OTP verification email",
        responses: { "202": { description: "Accepted" } },
      },
    },
    "/api/v1/auth/invitations/{token}": {
      get: {
        summary: "Preview an organization invitation",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Invitation preview" }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/auth/invitations/{token}/accept": {
      post: {
        summary: "Accept an organization invitation and create an active account",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "201": { description: "Account created; refresh cookies set" },
          "400": { description: "Expired invitation" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/api/v1/auth/invitations": {
      post: {
        summary: "Invite a colleague to the current organization",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Invitation created and emailed" } },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        summary: "Rotate the refresh session and issue an access token",
        parameters: [{ name: "x-csrf-token", in: "header", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Session rotated" }, "401": { description: "Invalid refresh token" }, "403": { description: "CSRF validation failed" } },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "Revoke the current session",
        security: [{ bearerAuth: [] }],
        responses: { "204": { description: "Session revoked" } },
      },
    },
    "/api/v1/auth/logout-everywhere": {
      post: {
        summary: "Revoke every active session for the current user",
        security: [{ bearerAuth: [] }],
        responses: { "204": { description: "All sessions revoked" } },
      },
    },
    "/api/v1/auth/sessions": {
      get: {
        summary: "List active sessions",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Active sessions" } },
      },
    },
    "/api/v1/auth/sessions/{sessionId}": {
      delete: {
        summary: "Revoke a specific session",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Session revoked" }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/auth/devices": {
      get: {
        summary: "List trusted devices",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Trusted devices" } },
      },
    },
    "/api/v1/auth/devices/{deviceId}": {
      delete: {
        summary: "Revoke a trusted device",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "deviceId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Device revoked" }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/auth/login-history": {
      get: {
        summary: "List recent login events",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Login history" } },
      },
    },
    "/api/v1/auth/me": {
      get: {
        summary: "Get the current user and effective permissions",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Authenticated user" } },
      },
    },
    "/api/v1/auth/profile": {
      patch: {
        summary: "Update the current user profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Profile updated" }, "422": { description: "Invalid profile fields" } },
      },
    },
    "/api/v1/auth/validate": {
      get: {
        summary: "Validate the current bearer-token session",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Active session" }, "401": { description: "Invalid session" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  "x-service": apiServiceName,
} as const;

export function createOpenApiRouter(): Router {
  const router = Router();

  router.get("/openapi.json", (_request, response) => {
    response.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=3600",
    );
    response.json(openApiDocument);
  });
  router.get("/docs", (_request, response) => {
    response.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=3600",
    );
    response
      .type("html")
      .send(
        '<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>HAMD API</title></head><body><h1>HAMD API</h1><p>OpenAPI document: <a href="/openapi.json">/openapi.json</a></p></body></html>',
      );
  });

  return router;
}
