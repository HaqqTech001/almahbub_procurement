export type NotificationHrefAudience = "app" | "ops";

export type NotificationHrefSource = {
  type?: string | undefined;
  deepLink?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
};

function firstId(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function withAudiencePrefix(path: string, audience: NotificationHrefAudience): string {
  if (audience === "ops") {
    return path.startsWith("/app/") ? path.slice(4) || "/" : path;
  }
  if (path.startsWith("/app/")) return path;
  if (path.startsWith("/")) return `/app${path}`;
  return path;
}

/** Maps a notification to a real module route, or null when there is no target. */
export function resolveNotificationHref(
  item: NotificationHrefSource,
  audience: NotificationHrefAudience = "app",
): string | null {
  const metadata = item.metadata ?? null;
  const type = String(item.type ?? "").toLowerCase();
  const requestId = firstId(metadata, [
    "requestId",
    "procurementRequestId",
    "procurement_request_id",
  ]);
  const quotationId = firstId(metadata, ["quotationId", "quotation_id"]);
  const shipmentId = firstId(metadata, ["shipmentId", "shipment_id"]);
  const invoiceId = firstId(metadata, ["invoiceId", "invoice_id"]);
  const paymentId = firstId(metadata, ["paymentId", "payment_id"]);
  const productId = firstId(metadata, ["productId", "product_id"]);

  const announcementId = firstId(metadata, [
    "announcementId",
    "announcement_id",
    "slug",
  ]);
  if (announcementId || type.includes("announcement")) {
    if (audience === "ops") {
      return "/cms";
    }
    return announcementId
      ? `/app/announcements/${announcementId}`
      : "/app/announcements";
  }

  if (type.includes("clarif") && requestId) {
    return withAudiencePrefix(`/requests/${requestId}#clarification`, audience);
  }
  if (
    type.includes("support") ||
    type.includes("chat") ||
    type.includes("conversation") ||
    type.includes("ticket")
  ) {
    return audience === "ops" ? "/support" : "/app/chat";
  }

  if (quotationId || type.includes("quotation")) {
    return withAudiencePrefix(
      quotationId ? `/quotations/${quotationId}` : "/quotations",
      audience,
    );
  }
  if (shipmentId || type.includes("shipment")) {
    return withAudiencePrefix(
      shipmentId ? `/shipments/${shipmentId}` : "/shipments",
      audience,
    );
  }
  if (invoiceId || type.includes("invoice")) {
    return withAudiencePrefix(invoiceId ? `/invoices/${invoiceId}` : "/invoices", audience);
  }
  if (paymentId || type.includes("payment")) {
    return withAudiencePrefix(paymentId ? `/payments/${paymentId}` : "/payments", audience);
  }
  if (
    productId ||
    type.includes("product") ||
    type.includes("catalogue") ||
    type.includes("catalog")
  ) {
    return withAudiencePrefix("/products", audience);
  }
  if (requestId || type.includes("procurement") || type.includes("request")) {
    return withAudiencePrefix(
      requestId ? `/requests/${requestId}` : "/requests",
      audience,
    );
  }

  const deep = item.deepLink?.trim();
  if (!deep) return null;
  if (/^https?:\/\//i.test(deep)) return deep;
  if (!deep.startsWith("/")) return null;
  if (deep === "/notifications" || deep === "/app/notifications") return null;
  return withAudiencePrefix(deep, audience);
}
