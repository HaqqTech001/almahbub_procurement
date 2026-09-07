export function resolveActivityPath(
  notificationType: string,
  payload: Record<string, unknown>,
): string | null {
  const type = notificationType.toLowerCase();
  const id = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };

  const requestId = id("requestId", "procurementRequestId", "procurement_request_id");
  const quotationId = id("quotationId", "quotation_id");
  const shipmentId = id("shipmentId", "shipment_id");
  const invoiceId = id("invoiceId", "invoice_id");
  const paymentId = id("paymentId", "payment_id");
  const announcementId = id("announcementId", "announcement_id", "slug");
  const conversationId = id("conversationId", "threadId", "roomId", "supportThreadId");

  if (announcementId || type.includes("announcement")) {
    return announcementId ? `/app/announcements/${announcementId}` : "/app/announcements";
  }
  if (quotationId || type.includes("quotation")) {
    return quotationId ? `/app/quotations/${quotationId}` : "/app/quotations";
  }
  if (shipmentId || type.includes("shipment")) {
    return shipmentId ? `/app/shipments/${shipmentId}` : "/app/shipments";
  }
  if (invoiceId || type.includes("invoice")) {
    return invoiceId ? `/app/invoices/${invoiceId}` : "/app/invoices";
  }
  if (paymentId || type.includes("payment")) {
    return paymentId ? `/app/payments/${paymentId}` : "/app/payments";
  }
  if (conversationId || type.includes("support") || type.includes("chat")) {
    return conversationId ? `/app/support?room=${encodeURIComponent(conversationId)}` : "/app/support";
  }
  if (requestId || type.includes("procurement") || type.includes("request")) {
    return requestId ? `/app/requests/${requestId}` : "/app/requests";
  }

  const deep = typeof payload.deepLink === "string" ? payload.deepLink.trim() : "";
  if (!deep || deep.startsWith("http") || !deep.startsWith("/")) return null;
  if (deep === "/notifications" || deep === "/app/notifications") return null;
  if (deep.startsWith("/app/")) return deep;
  return `/app${deep}`;
}
