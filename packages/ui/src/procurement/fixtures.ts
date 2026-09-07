import type { ProcurementRequestRecord } from "./types.js";

const hours = (h: number) =>
  new Date(Date.now() - h * 3_600_000).toISOString();
const days = (d: number) =>
  new Date(Date.now() - d * 86_400_000).toISOString();

export const procurementRequestsFixture: ProcurementRequestRecord[] = [
  {
    id: "pr-1042",
    publicCode: "PR-1042",
    title: "Industrial valves for Lagos Free Zone",
    status: "sourcing",
    priority: "high",
    currencyCode: "USD",
    notes: "Prefer ISO-certified suppliers. Destination: Building C.",
    destinationCountryCode: "NG",
    destinationAddress: "Lagos Free Zone, Building C",
    requiredByDate: days(-20),
    budgetAmount: 45_000,
    restrictedGoodsDeclared: false,
    rowVersion: 4,
    requesterName: "Ada Okonkwo",
    assigneeName: "James Nwosu",
    createdAt: days(12),
    updatedAt: hours(6),
    items: [
      {
        id: "li1",
        description: "Gate valve DN50 PN16",
        quantity: 120,
        unit: "pcs",
        targetUnitAmount: 85,
      },
      {
        id: "li2",
        description: "Ball valve DN80",
        quantity: 40,
        unit: "pcs",
        targetUnitAmount: 140,
      },
    ],
    timeline: [
      {
        id: "t1",
        fromStatus: null,
        toStatus: "draft",
        command: "create",
        actorName: "Ada Okonkwo",
        createdAt: days(12),
      },
      {
        id: "t2",
        fromStatus: "draft",
        toStatus: "submitted",
        command: "submit",
        actorName: "Ada Okonkwo",
        createdAt: days(11),
      },
      {
        id: "t3",
        fromStatus: "submitted",
        toStatus: "accepted_for_sourcing",
        command: "accept_for_sourcing",
        actorName: "James Nwosu",
        createdAt: days(10),
      },
      {
        id: "t4",
        fromStatus: "accepted_for_sourcing",
        toStatus: "sourcing",
        command: "start_sourcing",
        actorName: "James Nwosu",
        createdAt: days(9),
      },
    ],
    comments: [
      {
        id: "cm1",
        authorName: "James Nwosu",
        body: "Confirming warehouse gate code before RFQ send.",
        createdAt: hours(8),
      },
      {
        id: "cm2",
        authorName: "Ada Okonkwo",
        body: "Gate code is on the packing list PDF.",
        createdAt: hours(7),
      },
    ],
    attachments: [
      {
        id: "att1",
        name: "packing-list.pdf",
        kind: "specification",
        sizeLabel: "420 KB",
        href: "#",
        uploadedAt: days(11),
        uploadedBy: "Ada Okonkwo",
      },
      {
        id: "att2",
        name: "valve-drawing.dwg",
        kind: "drawing",
        sizeLabel: "1.2 MB",
        href: "#",
        uploadedAt: days(10),
        uploadedBy: "Ada Okonkwo",
      },
    ],
    internalNotes: [
      {
        id: "n1",
        authorName: "James Nwosu",
        body: "Prefer NPV Industrial based on prior OTIF. Do not share margin notes externally.",
        createdAt: hours(10),
      },
    ],
    history: [],
    approvals: [
      {
        id: "ap1",
        kind: "accept_for_sourcing",
        status: "approved",
        actorName: "James Nwosu",
        decidedAt: days(10),
        note: "Accepted into sourcing queue",
      },
    ],
    notifications: [
      {
        id: "nt1",
        title: "Sourcing started on PR-1042",
        body: "Ops is inviting suppliers.",
        createdAt: days(9),
        unread: true,
      },
    ],
    activity: [
      {
        id: "a1",
        type: "status",
        title: "Moved to sourcing",
        createdAt: days(9),
        actorName: "James Nwosu",
      },
      {
        id: "a2",
        type: "attachment",
        title: "packing-list.pdf uploaded",
        createdAt: days(11),
        actorName: "Ada Okonkwo",
      },
      {
        id: "a3",
        type: "comment",
        title: "New comment from James Nwosu",
        createdAt: hours(8),
      },
      {
        id: "a4",
        type: "notification",
        title: "Notification sent: Sourcing started",
        createdAt: days(9),
      },
    ],
  },
  {
    id: "pr-990",
    publicCode: "PR-990",
    title: "Office packaging replenishment",
    status: "draft",
    priority: "normal",
    currencyCode: "USD",
    notes: "",
    destinationCountryCode: "NG",
    destinationAddress: "Ikeja HQ",
    requiredByDate: null,
    budgetAmount: 2_500,
    rowVersion: 1,
    requesterName: "Ada Okonkwo",
    createdAt: hours(30),
    updatedAt: hours(1),
    items: [
      {
        id: "li3",
        description: "Corrugated carton 40×40",
        quantity: 500,
        unit: "pcs",
      },
    ],
    timeline: [
      {
        id: "t5",
        toStatus: "draft",
        command: "create",
        actorName: "Ada Okonkwo",
        createdAt: hours(30),
      },
    ],
    comments: [],
    attachments: [],
    internalNotes: [],
    history: [],
    approvals: [],
    notifications: [],
    activity: [
      {
        id: "a5",
        type: "status",
        title: "Draft created",
        createdAt: hours(30),
        actorName: "Ada Okonkwo",
      },
    ],
  },
  {
    id: "pr-881",
    publicCode: "PR-881",
    title: "Specialty solvents trial lot",
    status: "quote_issued",
    priority: "urgent",
    currencyCode: "USD",
    destinationCountryCode: "NG",
    budgetAmount: 12_000,
    rowVersion: 6,
    requesterName: "Sara Ibrahim",
    assigneeName: "James Nwosu",
    createdAt: days(20),
    updatedAt: hours(20),
    items: [
      {
        id: "li4",
        description: "Industrial solvent blend",
        quantity: 4,
        unit: "drums",
      },
    ],
    timeline: [
      {
        id: "t6",
        toStatus: "draft",
        createdAt: days(20),
        actorName: "Sara Ibrahim",
      },
      {
        id: "t7",
        fromStatus: "sourcing",
        toStatus: "quote_issued",
        command: "issue_quotation",
        createdAt: hours(24),
        actorName: "James Nwosu",
      },
    ],
    comments: [
      {
        id: "cm3",
        authorName: "Sara Ibrahim",
        body: "Need SDS with the quote package.",
        createdAt: hours(18),
      },
    ],
    attachments: [
      {
        id: "att3",
        name: "QT-889.pdf",
        kind: "quotation",
        href: "#",
        uploadedAt: hours(24),
        uploadedBy: "System",
      },
    ],
    internalNotes: [
      {
        id: "n2",
        authorName: "James Nwosu",
        body: "Supplier currently suspended elsewhere - verify SDS before approve.",
        createdAt: hours(22),
      },
    ],
    history: [],
    approvals: [
      {
        id: "ap2",
        kind: "approve",
        status: "pending",
        note: "Awaiting buyer decision on QT-889",
      },
    ],
    notifications: [
      {
        id: "nt2",
        title: "Quotation QT-889 received",
        body: "Review and approve or request revision.",
        createdAt: hours(24),
        unread: true,
      },
    ],
    activity: [
      {
        id: "a6",
        type: "approval",
        title: "Approval pending on quote",
        createdAt: hours(24),
      },
      {
        id: "a7",
        type: "notification",
        title: "Quotation notification delivered",
        createdAt: hours(24),
      },
    ],
  },
  {
    id: "pr-700",
    publicCode: "PR-700",
    title: "Closed Q1 packaging buy",
    status: "closed",
    priority: "low",
    currencyCode: "USD",
    rowVersion: 9,
    requesterName: "Ada Okonkwo",
    assigneeName: "James Nwosu",
    createdAt: days(90),
    updatedAt: days(40),
    items: [
      {
        id: "li5",
        description: "Stretch wrap rolls",
        quantity: 200,
        unit: "rolls",
      },
    ],
    timeline: [
      {
        id: "t8",
        toStatus: "closed",
        command: "close",
        actorName: "James Nwosu",
        createdAt: days(40),
      },
    ],
    comments: [],
    attachments: [],
    internalNotes: [],
    history: [],
    approvals: [
      {
        id: "ap3",
        kind: "approve",
        status: "approved",
        actorName: "Ada Okonkwo",
        decidedAt: days(55),
      },
    ],
    notifications: [],
    activity: [
      {
        id: "a8",
        type: "status",
        title: "Request closed",
        createdAt: days(40),
        actorName: "James Nwosu",
      },
    ],
  },
  {
    id: "pr-512",
    publicCode: "PR-512",
    title: "Cancelled steel trial",
    status: "cancelled",
    priority: "normal",
    currencyCode: "USD",
    rowVersion: 3,
    requesterName: "Leo Mensah",
    createdAt: days(60),
    updatedAt: days(55),
    items: [
      {
        id: "li6",
        description: "HR coil sample",
        quantity: 2,
        unit: "tons",
      },
    ],
    timeline: [
      {
        id: "t9",
        fromStatus: "submitted",
        toStatus: "cancelled",
        command: "cancel",
        reason: "Budget freeze",
        actorName: "Leo Mensah",
        createdAt: days(55),
      },
    ],
    comments: [],
    attachments: [],
    internalNotes: [],
    history: [],
    approvals: [],
    notifications: [],
    activity: [
      {
        id: "a9",
        type: "status",
        title: "Cancelled - Budget freeze",
        createdAt: days(55),
        actorName: "Leo Mensah",
      },
    ],
  },
];

// Mirror timeline into history where empty for UI demos
for (const row of procurementRequestsFixture) {
  if (!row.history.length) {
    row.history = [...row.timeline];
  }
}
