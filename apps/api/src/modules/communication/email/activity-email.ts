import {
  activityDestinationUrl,
  greetingLine,
  greetingName,
  type EmailBrand,
} from "./email-brand.js";
import { resolveActivityPath } from "./email-paths.js";
import {
  mutedParagraph,
  paragraph,
  renderEmailDocument,
  type EmailDocument,
} from "./email-layout.js";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  needs_clarification: "Clarification required",
  accepted_for_sourcing: "Accepted for sourcing",
  sourcing: "Sourcing",
  quote_issued: "Quotation issued",
  revision_requested: "Revision requested",
  approved: "Approved",
  purchase_in_progress: "Fulfilment",
  fulfilled: "Fulfilled",
  closed: "Closed",
  cancelled: "Cancelled",
  declined: "Declined",
};

function stringField(payload: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export type ActivityEmailContext = {
  readonly brand: EmailBrand;
  readonly eventType: string;
  readonly notificationType: string;
  readonly payload: Record<string, unknown>;
  readonly recipient: {
    readonly firstName?: string | null;
    readonly displayName?: string | null;
  };
  readonly publicCode?: string | null;
  readonly requestTitle?: string | null;
};

export function composeActivityEmail(context: ActivityEmailContext): EmailDocument {
  const name = greetingName(context.recipient);
  const greeting = greetingLine(name);
  const eventType = context.eventType;
  const payload = context.payload;
  const status = stringField(payload, ["status", "toStatus", "currentStatus"]);
  const publicCode = context.publicCode || stringField(payload, ["publicCode", "requestCode"]);
  const title = context.requestTitle || stringField(payload, ["title", "requestTitle"]);
  const clarification = stringField(payload, ["reason", "clarificationQuestion", "question"]);
  const excerpt = stringField(payload, ["excerpt", "summary", "bodyPreview"]);
  const announcementTitle = stringField(payload, ["announcementTitle", "title"]);
  const shipmentStatus = stringField(payload, ["shipmentStatus", "milestone"]);

  const path = resolveActivityPath(context.notificationType, payload);

  const requestPath =
    eventType.includes("needs_clarification") && path
      ? `${path}#clarification`
      : path;

  const ctaHref = requestPath ? activityDestinationUrl(context.brand, requestPath) : undefined;
  const isActivity = !["account", "system", "security"].includes(context.notificationType);

  let subject = `${context.brand.brandName}: Account update`;
  let preheader = "There is an update on your Almahbub International account.";
  let panelTitle = "Account update";
  let panelRows = [] as { label: string; value: string }[];
  let intro = "There is an update on your Almahbub International account.";
  let explanation = "Open your account to review the latest activity.";
  let ctaLabel = "View details";
  let details = "You can open the related record to review documents and any action required from you.";

  if (eventType.includes("needs_clarification")) {
    subject = publicCode
      ? `Clarification required for procurement request ${publicCode}`
      : "Clarification required for your procurement request";
    preheader = "Almahbub needs a little more information before sourcing can continue.";
    panelTitle = "Action required";
    panelRows = [
      ...(publicCode ? [{ label: "Request", value: publicCode }] : []),
      { label: "Current stage", value: "Clarification required" },
    ];
    intro = "Almahbub needs additional information from you before we can continue sourcing.";
    explanation = clarification
      ? clarification
      : "Please review the clarification question in your request and reply from your account.";
    ctaLabel = "Provide Clarification";
    details = "Your reply stays on the request record so the procurement team can continue from there.";
  } else if (eventType.includes("quote_issued") || context.notificationType === "quotation") {
    subject = publicCode
      ? `Your quotation is ready to review for ${publicCode}`
      : "Your quotation is ready to review";
    preheader = "A quotation is available for your procurement request.";
    panelTitle = "Quotation available";
    panelRows = [
      ...(publicCode ? [{ label: "Request", value: publicCode }] : []),
      { label: "Current stage", value: "Quotation issued" },
    ];
    intro = "A quotation is available for your procurement request.";
    explanation = "Open the quotation to review commercial terms in your account. Full details stay on the website.";
    ctaLabel = "View Quotation";
    details = "You can accept, decline, or request a revision from the quotation record.";
  } else if (
    eventType.includes("submitted") ||
    eventType === "procurement.requested"
  ) {
    subject = publicCode
      ? `${context.brand.brandName}: We received request ${publicCode}`
      : `${context.brand.brandName}: We received your procurement request`;
    preheader = "Your procurement request is with the Almahbub team.";
    panelTitle = "Request received";
    panelRows = [
      ...(publicCode ? [{ label: "Request", value: publicCode }] : []),
      { label: "Current stage", value: statusLabel(status || "submitted") },
      ...(title ? [{ label: "Summary", value: title }] : []),
    ];
    intro = "Thank you. We have received your procurement request and our team will review it.";
    explanation = "You can follow sourcing, clarification, quotation and fulfilment from this request.";
    ctaLabel = "View Request";
  } else if (context.notificationType === "payment" || eventType.includes("payment")) {
    subject = `${context.brand.brandName}: Payment update`;
    preheader = "A payment on your account has been updated.";
    panelTitle = "Payment recorded";
    panelRows = [{ label: "Status", value: "Payment update" }];
    intro = "A payment on your Almahbub International account has been updated.";
    explanation = "Open the payment record to review the latest confirmation details.";
    ctaLabel = "View Payment";
  } else if (context.notificationType === "invoice" || eventType.includes("invoice")) {
    subject = `${context.brand.brandName}: Invoice available`;
    preheader = "An invoice is available in your account.";
    panelTitle = "Invoice";
    panelRows = [{ label: "Status", value: "Invoice available" }];
    intro = "An invoice is available for you to review in your account.";
    explanation = "Open the invoice for amounts, documents and payment status.";
    ctaLabel = "View Invoice";
  } else if (context.notificationType === "shipment" || eventType.includes("shipment")) {
    subject = publicCode
      ? `Shipment update for request ${publicCode}`
      : `${context.brand.brandName}: Shipment update`;
    preheader = "There is a shipment update on your procurement.";
    panelTitle = "Shipment update";
    panelRows = [
      ...(publicCode ? [{ label: "Request", value: publicCode }] : []),
      { label: "Status", value: statusLabel(shipmentStatus || status || "updated") },
    ];
    intro = "There is a shipment update related to your procurement.";
    explanation = "Open the shipment record for the latest milestone. Tracking details appear only when they are recorded on the website.";
    ctaLabel = "View Shipment";
  } else if (context.notificationType === "announcement" || eventType.includes("announcement")) {
    subject = announcementTitle
      ? `New announcement from Almahbub International: ${announcementTitle}`
      : "New announcement from Almahbub International";
    preheader = "Almahbub International published an announcement.";
    panelTitle = "Announcement";
    panelRows = [{ label: "Title", value: announcementTitle || "Almahbub International announcement" }];
    intro = "Almahbub International published an announcement for your organisation.";
    explanation = excerpt || "Open the announcement to read the full message.";
    ctaLabel = "View Announcement";
    details = "Replies and comments stay on the website and are not included in this email.";
  } else if (context.notificationType === "support" || eventType.includes("support") || eventType.includes("chat")) {
    subject = "New reply from Almahbub Support";
    preheader = "There is a new message in your support conversation.";
    panelTitle = "Support reply";
    panelRows = [{ label: "Conversation", value: "Almahbub Support" }];
    intro = "There is a new reply in your Almahbub Support conversation.";
    explanation = excerpt || "Open the conversation to read the message and respond.";
    ctaLabel = "View Conversation";
    details = "Attachments stay in the conversation and are not included in this email.";
  } else if (context.notificationType === "procurement" || eventType.includes("procurement") || eventType.includes("request")) {
    const stage = statusLabel(status || "updated");
    subject = publicCode
      ? `${context.brand.brandName}: Update on request ${publicCode}`
      : `${context.brand.brandName}: Update on your procurement request`;
    preheader = `Your request is now at the ${stage} stage.`;
    panelTitle = "Request update";
    panelRows = [
      ...(publicCode ? [{ label: "Request", value: publicCode }] : []),
      { label: "Current stage", value: stage },
      ...(title ? [{ label: "Summary", value: title }] : []),
    ];
    intro = "There is an update on your procurement request.";
    explanation = `Our team has moved this request to ${stage}. Open the request to review the latest activity.`;
    ctaLabel = "View Request";
  }

  if (isActivity && !ctaHref) {
    return renderEmailDocument({
      brand: context.brand,
      subject,
      preheader,
      greeting,
      introHtml: paragraph(intro),
      panelTitle,
      panelRows,
      explanationHtml: paragraph(explanation),
      detailsHtml: mutedParagraph(details),
      text: [greeting, "", intro, explanation, "", context.brand.brandName].join("\n"),
    });
  }

  return renderEmailDocument({
    brand: context.brand,
    subject,
    preheader,
    greeting,
    introHtml: paragraph(intro),
    panelTitle,
    panelRows,
    explanationHtml: paragraph(explanation),
    ...(ctaHref ? { cta: { label: ctaLabel, href: ctaHref } } : {}),
    detailsHtml: mutedParagraph(details),
    text: [
      greeting,
      "",
      intro,
      panelRows.map((row) => `${row.label}: ${row.value}`).join("\n"),
      "",
      explanation,
      "",
      `${ctaLabel}: ${ctaHref ?? ""}`,
      "",
      details,
      "",
      `Need help? ${context.brand.contactEmail}`,
      context.brand.brandName,
    ].join("\n"),
  });
}
