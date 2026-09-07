import type {
  AssistantMessage,
  AssistantSuggestion,
} from "./types.js";

const minutes = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

export const assistantSuggestionsFixture: AssistantSuggestion[] = [
  {
    id: "sug-product-1",
    kind: "product_suggestion",
    title: "Gate valve DN50 PN16 - catalog match",
    summary:
      "Three catalog SKUs match PR-1042 line 1 within pressure and material constraints.",
    mode: "recommend",
    confidence: "high",
    confidenceReason: "Direct catalog attributes match request line specs.",
    citations: [
      { id: "c1", label: "SKU-VAL-DN50", href: "/catalog/sku-val-dn50", kind: "product" },
      { id: "c2", label: "PR-1042", href: "/requests/pr-1042", kind: "request" },
    ],
    nextActions: ["Inspect SKU", "Add to shortlist"],
    href: "/catalog?q=gate+valve+dn50",
  },
  {
    id: "sug-supplier-1",
    kind: "supplier_suggestion",
    title: "Ningbo Precision Valves - qualified supplier",
    summary:
      "Approved supplier with prior on-time delivery for similar valves; certificates on file.",
    mode: "recommend",
    confidence: "moderate",
    confidenceReason: "Performance history is current; capacity not verified for this lot.",
    citations: [
      {
        id: "c3",
        label: "SUP-VALVE-CO",
        href: "/suppliers/sup-valve-co",
        kind: "supplier",
      },
    ],
    missingData: ["Current production slot confirmation"],
    nextActions: ["Open supplier profile", "Request quotation"],
  },
  {
    id: "sug-alt-1",
    kind: "alternative_product",
    title: "Alternative: Ball valve DN50 PN16",
    summary:
      "Functionally similar for isolation duty; slightly higher unit cost, shorter lead time.",
    mode: "recommend",
    confidence: "moderate",
    citations: [
      { id: "c4", label: "SKU-BALL-DN50", href: "/catalog/sku-ball-dn50", kind: "product" },
    ],
    assumptions: ["Isolation duty is acceptable for this line"],
    nextActions: ["Compare specs"],
  },
  {
    id: "sug-spec-1",
    kind: "specification_explanation",
    title: "What PN16 means for this line",
    summary:
      "PN16 indicates a nominal pressure rating of 16 bar. Confirm fluid and temperature before finalizing.",
    mode: "explain",
    confidence: "high",
    citations: [
      { id: "c5", label: "Catalog attribute glossary", kind: "knowledge" },
    ],
  },
  {
    id: "sug-budget-1",
    kind: "budget_suggestion",
    title: "Budget band for PR-1042 valve set",
    summary:
      "Recent accepted quotes for similar DN50 sets cluster around USD 38k–48k including freight estimates.",
    mode: "assist",
    confidence: "moderate",
    confidenceReason: "Based on last 90 days of organization quotations.",
    citations: [
      { id: "c6", label: "QT-889", href: "/quotations/qt-889", kind: "quotation" },
      { id: "c7", label: "QT-910", href: "/quotations/qt-910", kind: "quotation" },
    ],
    missingData: ["Incoterm preference not set"],
    nextActions: ["Set target budget on request"],
  },
  {
    id: "sug-lead-1",
    kind: "lead_time_explanation",
    title: "Lead time drivers for ocean freight Ningbo → Lagos",
    summary:
      "Typical production 10–14 days plus ocean transit ~18–25 days. Do not treat as a guaranteed ETA.",
    mode: "explain",
    confidence: "moderate",
    citations: [
      { id: "c8", label: "SH-901", href: "/shipments/sh-901", kind: "shipment" },
    ],
    assumptions: ["No customs hold at destination"],
    nextActions: ["Ask logistics for lane estimate"],
  },
  {
    id: "sug-doc-1",
    kind: "document_summary",
    title: "Summary: packing-instructions.pdf",
    summary:
      "Requires ISPM-15 pallets, moisture barrier, and valve end-cap protection. Destination: Lagos warehouse.",
    mode: "explain",
    confidence: "high",
    citations: [
      { id: "c9", label: "packing-instructions.pdf", href: "#", kind: "document" },
    ],
  },
  {
    id: "sug-quote-1",
    kind: "quotation_summary",
    title: "Quotation QT-889 at a glance",
    summary:
      "USD 42,500 · 2 lines · expires in 48 hours · Incoterm CIF Lagos. Review lead time clause before accept.",
    mode: "explain",
    confidence: "high",
    citations: [
      { id: "c10", label: "QT-889", href: "/quotations/qt-889", kind: "quotation" },
    ],
    nextActions: ["Open quotation", "Compare alternatives"],
  },
  {
    id: "sug-guide-1",
    kind: "procurement_guidance",
    title: "Next step for PR-1042",
    summary:
      "Request is ready for supplier shortlist. Capture destination warehouse and target budget before RFQ.",
    mode: "assist",
    confidence: "moderate",
    citations: [
      { id: "c11", label: "PR-1042", href: "/requests/pr-1042", kind: "request" },
    ],
    missingData: ["Warehouse address", "Target budget"],
    nextActions: ["Edit request", "Invite suppliers"],
  },
  {
    id: "sug-faq-1",
    kind: "faq_answer",
    title: "FAQ: How does an RFQ work?",
    summary:
      "You submit a procurement request, invite suppliers, compare quotations, then approve a purchase order. The assistant explains steps; it does not place orders for you.",
    mode: "explain",
    confidence: "high",
    citations: [
      { id: "c12", label: "Procurement help center", kind: "knowledge" },
    ],
    nextActions: ["Open request wizard"],
  },
];

export const assistantMessagesFixture: AssistantMessage[] = [
  {
    id: "msg-1",
    role: "system",
    content:
      "Almahbub assistant assists with explain, assist, and recommend. It never commits commercial actions without you.",
    createdAt: minutes(30),
  },
  {
    id: "msg-2",
    role: "user",
    content: "Suggest products and suppliers for PR-1042 gate valves.",
    createdAt: minutes(12),
  },
  {
    id: "msg-3",
    role: "assistant",
    content:
      "I found catalog matches and one qualified supplier. Review citations before shortlisting - lead time and capacity still need confirmation.",
    createdAt: minutes(11),
    mode: "recommend",
    confidence: "moderate",
    suggestionIds: ["sug-product-1", "sug-supplier-1", "sug-alt-1"],
    citations: [
      { id: "c1", label: "SKU-VAL-DN50", href: "/catalog/sku-val-dn50" },
      { id: "c3", label: "SUP-VALVE-CO", href: "/suppliers/sup-valve-co" },
    ],
  },
];
