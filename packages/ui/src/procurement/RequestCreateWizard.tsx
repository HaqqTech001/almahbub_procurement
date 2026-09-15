/**
 * Request create / edit wizard - V1 parity + V2 improvements.
 * Drafts, autosave, templates, multi-product, validation, review.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cx } from "../utils/cx.js";
import type {
  ProcurementAttachment,
  ProcurementDraftPatch,
  ProcurementLineItem,
  ProcurementPriority,
  ProcurementRequestRecord,
} from "./types.js";
import { PROCUREMENT_PRIORITIES } from "./types.js";
import { ProcurementProgress } from "./ProcurementProgress.js";
import { AttachmentBoard } from "../primitives/AuthenticatedMedia.js";

const QUANTITY_UNITS = [
  "pcs",
  "units",
  "cartons",
  "boxes",
  "kg",
  "tonnes",
  "litres",
  "sets",
] as const;

function QuantityStepper({
  value,
  invalid,
  fieldKey,
  onChange,
}: {
  value: number;
  invalid: boolean;
  fieldKey: WizardFieldKey;
  onChange: (next: number) => void;
}) {
  return (
    <div className="hamd-qty">
      <button
        type="button"
        className="hamd-qty__btn"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        −
      </button>
      <input
        className="hamd-qty__input"
        inputMode="numeric"
        aria-label="Quantity required"
        value={Number.isFinite(value) && value > 0 ? String(value) : ""}
        onChange={(e) => {
          const next = Number.parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
          onChange(Number.isFinite(next) ? next : 0);
        }}
        data-wizard-field={fieldKey}
        aria-required="true"
        required
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        className="hamd-qty__btn"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

export const REQUEST_WIZARD_STEPS = [
  { id: "products", label: "Products", compactLabel: "Items" },
  { id: "basics", label: "Requirements", compactLabel: "Needs" },
  { id: "delivery", label: "Delivery" },
  { id: "documents", label: "Media" },
  { id: "review", label: "Review" },
] as const;

export type RequestWizardStepId = (typeof REQUEST_WIZARD_STEPS)[number]["id"];

export type CatalogProductOption = {
  id: string;
  name: string;
  category: string;
  unit?: string | undefined;
  sku?: string | undefined;
  description?: string | undefined;
  imageSrc?: string | undefined;
  imageAlt?: string | undefined;
  manufacturer?: string | undefined;
};

export type WizardFieldKey =
  | "title"
  | "budgetAmount"
  | "currencyCode"
  | "notes"
  | "requiredByDate"
  | "items"
  | `item:${string}:description`
  | `item:${string}:quantity`
  | `item:${string}:unit`
  | `item:${string}:category`
  | "destinationAddress"
  | "destinationCountryCode";

export function wizardStepForField(field: WizardFieldKey): RequestWizardStepId {
  if (["title", "budgetAmount", "currencyCode", "notes"].includes(field)) return "basics";
  if (["destinationAddress", "destinationCountryCode", "requiredByDate"].includes(field)) return "delivery";
  return "products";
}

export type WizardValidationResult = {
  messages: string[];
  fields: WizardFieldKey[];
};

export type RequestTemplate = {
  id: string;
  name: string;
  description: string;
  draft: Omit<RequestWizardDraft, "attachments" | "rowVersion">;
};

export type RequestWizardDraft = {
  title: string;
  priority: ProcurementPriority;
  currencyCode: string;
  budgetAmount: number | null;
  notes: string;
  internalNotes: string;
  destinationCountryCode: string;
  destinationAddress: string;
  requiredByDate: string;
  restrictedGoodsDeclared: boolean;
  items: Array<
    ProcurementLineItem & {
      category?: string | undefined;
      specifications?: string | undefined;
    }
  >;
  attachments: Array<{
    id: string;
    name: string;
    sizeLabel: string;
    file?: File | undefined;
    previewUrl?: string | undefined;
    kind?: "image" | "file" | undefined;
  }>;
  rowVersion: number;
};

export type RequestWizardSubmitPayload = ProcurementDraftPatch & {
  submit: boolean;
  internalNotes?: string | undefined;
  attachmentFiles?: File[] | undefined;
};

export type RequestCreateWizardProps = {
  className?: string | undefined;
  initial?: Partial<RequestWizardDraft> | undefined;
  /** Prefill from an existing request (duplicate). */
  duplicateFrom?: ProcurementRequestRecord | undefined;
  catalogProducts?: readonly CatalogProductOption[] | undefined;
  templates?: readonly RequestTemplate[] | undefined;
  categories?: readonly string[] | undefined;
  recentRequests?: readonly ProcurementRequestRecord[] | undefined;
  autosaveMs?: number | undefined;
  onAutosave?: ((draft: RequestWizardDraft) => void | Promise<void>) | undefined;
  onSubmit?: ((payload: RequestWizardSubmitPayload) => void | Promise<void>) | undefined;
  onSaveDraft?: ((payload: RequestWizardSubmitPayload) => void | Promise<void>) | undefined;
  onCancel?: (() => void) | undefined;
  onCatalogSearch?: ((query: string) => Promise<readonly CatalogProductOption[]>) | undefined;
  onNotify?:
    | ((toast: {
        tone: "success" | "warning" | "danger" | "info";
        title: string;
        description?: string;
      }) => void)
    | undefined;
};

const emptyItem = (): RequestWizardDraft["items"][number] => ({
  id: `li-${crypto.randomUUID?.() ?? String(Date.now())}`,
  description: "",
  quantity: 1,
  unit: "pcs",
  category: "",
  specifications: "",
  targetUnitAmount: null,
});

export function emptyRequestWizardDraft(): RequestWizardDraft {
  return {
    title: "",
    priority: "normal",
    currencyCode: "USD",
    budgetAmount: null,
    notes: "",
    internalNotes: "",
    destinationCountryCode: "NG",
    destinationAddress: "",
    requiredByDate: "",
    restrictedGoodsDeclared: false,
    items: [emptyItem()],
    attachments: [],
    rowVersion: 0,
  };
}

export const defaultRequestTemplates: RequestTemplate[] = [
  {
    id: "tpl-restock",
    name: "Business restocking",
    description: "Repeat supply of known catalogue items for an operating site.",
    draft: {
      title: "Business restocking",
      priority: "normal",
      currencyCode: "USD",
      budgetAmount: null,
      notes: "Please match previous supply quality. Confirm packing and lead time.",
      internalNotes: "",
      destinationCountryCode: "NG",
      destinationAddress: "",
      requiredByDate: "",
      restrictedGoodsDeclared: false,
      items: [
        {
          id: "tpl-restock-1",
          description: "",
          quantity: 10,
          unit: "pcs",
          category: "",
          specifications: "Same specification as the last fulfilled order where possible.",
        },
      ],
    },
  },
  {
    id: "tpl-equipment",
    name: "Equipment procurement",
    description: "Capital equipment with installation and specification notes.",
    draft: {
      title: "Equipment procurement",
      priority: "high",
      currencyCode: "USD",
      budgetAmount: null,
      notes: "Include brand options, warranty, and commissioning requirements.",
      internalNotes: "",
      destinationCountryCode: "NG",
      destinationAddress: "",
      requiredByDate: "",
      restrictedGoodsDeclared: false,
      items: [
        {
          id: "tpl-equip-1",
          description: "",
          quantity: 1,
          unit: "set",
          category: "",
          specifications: "Include voltage, capacity, and installation constraints.",
        },
      ],
    },
  },
  {
    id: "tpl-office",
    name: "Office setup",
    description: "Furniture, IT, and workplace supplies for a new or expanded office.",
    draft: {
      title: "Office setup",
      priority: "normal",
      currencyCode: "USD",
      budgetAmount: null,
      notes: "Deliver as a coordinated set. Confirm access hours for the site.",
      internalNotes: "",
      destinationCountryCode: "NG",
      destinationAddress: "",
      requiredByDate: "",
      restrictedGoodsDeclared: false,
      items: [
        {
          id: "tpl-office-1",
          description: "Workplace furniture and supplies",
          quantity: 1,
          unit: "lot",
          category: "",
          specifications: "List desks, seating, and storage needed.",
        },
      ],
    },
  },
  {
    id: "tpl-bulk",
    name: "Bulk product sourcing",
    description: "Volume purchase with packing, unit, and delivery constraints.",
    draft: {
      title: "Bulk product sourcing",
      priority: "normal",
      currencyCode: "USD",
      budgetAmount: null,
      notes: "Quote by carton or tonne as appropriate. Confirm origin and packing.",
      internalNotes: "",
      destinationCountryCode: "NG",
      destinationAddress: "",
      requiredByDate: "",
      restrictedGoodsDeclared: false,
      items: [
        {
          id: "tpl-bulk-1",
          description: "",
          quantity: 20,
          unit: "cartons",
          category: "",
          specifications: "Confirm pack size, net weight, and labelling.",
        },
      ],
    },
  },
  {
    id: "tpl-custom",
    name: "Custom requirement",
    description: "A specification-led request when the catalogue item is not yet known.",
    draft: {
      title: "Custom procurement requirement",
      priority: "normal",
      currencyCode: "USD",
      budgetAmount: null,
      notes: "Our team will source options from your specification.",
      internalNotes: "",
      destinationCountryCode: "NG",
      destinationAddress: "",
      requiredByDate: "",
      restrictedGoodsDeclared: false,
      items: [
        {
          id: "tpl-custom-1",
          description: "Custom sourced item",
          quantity: 1,
          unit: "pcs",
          category: "",
          specifications: "Describe the performance, size, material, and standards required.",
        },
      ],
    },
  },
];

export const defaultCatalogProducts: CatalogProductOption[] = [];

function draftFromRecord(record: ProcurementRequestRecord): RequestWizardDraft {
  return {
    title: `${record.title} (copy)`,
    priority: (PROCUREMENT_PRIORITIES.includes(
      record.priority as ProcurementPriority,
    )
      ? record.priority
      : "normal") as ProcurementPriority,
    currencyCode: record.currencyCode || "USD",
    budgetAmount: record.budgetAmount ?? null,
    notes: record.notes ?? "",
    internalNotes: "",
    destinationCountryCode: record.destinationCountryCode ?? "NG",
    destinationAddress: record.destinationAddress ?? "",
    requiredByDate: record.requiredByDate
      ? record.requiredByDate.slice(0, 10)
      : "",
    restrictedGoodsDeclared: Boolean(record.restrictedGoodsDeclared),
    items:
      record.items.length > 0
        ? record.items.map((item) => ({
            ...item,
            id: `li-${crypto.randomUUID?.() ?? item.id}`,
            category: "",
            specifications: "",
          }))
        : [emptyItem()],
    attachments: [],
    rowVersion: 0,
  };
}

function isBlankLine(item: RequestWizardDraft["items"][number]): boolean {
  return (
    !item.description.trim() &&
    !item.category?.trim() &&
    !item.specifications?.trim() &&
    !(item.quantity > 1) &&
    (!item.unit.trim() || item.unit.trim() === "pcs")
  );
}

function serverValidation(error: unknown, draft: RequestWizardDraft): WizardValidationResult {
  const result: WizardValidationResult = { messages: [], fields: [] };
  const details = error && typeof error === "object" && "details" in error ? error.details : null;
  if (Array.isArray(details)) for (const detail of details) {
    if (!detail || typeof detail.field !== "string" || typeof detail.message !== "string") continue;
    let field: WizardFieldKey | undefined;
    if (["title", "items", "destinationAddress", "destinationCountryCode", "budgetAmount", "currencyCode", "notes", "requiredByDate"].includes(detail.field)) {
      field = detail.field as WizardFieldKey;
    } else {
      const match = /^items(?:\[|\.)(\d+)\]?\.(description|quantity|unit)$/.exec(detail.field);
      const item = match ? draft.items.filter((row) => !isBlankLine(row))[Number(match[1])] : undefined;
      if (item && match) field = `item:${item.id}:${match[2]}` as WizardFieldKey;
    }
    if (field) { result.fields.push(field); result.messages.push(detail.message); }
  }
  if (!result.messages.length) result.messages.push(error instanceof Error ? error.message : "Could not submit request. Please try again.");
  return result;
}

export function validateStep(
  step: RequestWizardStepId,
  draft: RequestWizardDraft,
): WizardValidationResult {
  const messages: string[] = [];
  const fields: WizardFieldKey[] = [];

  if (step === "basics" || step === "review") {
    if (!draft.title.trim()) {
      messages.push("Request title is required.");
      fields.push("title");
    } else if (draft.title.trim().length < 3) {
      messages.push("Request title must be at least 3 characters.");
      fields.push("title");
    } else if (draft.title.trim().length > 200) {
      messages.push("Request title must be 200 characters or fewer."); fields.push("title");
    }
    if (draft.budgetAmount != null && (!Number.isFinite(draft.budgetAmount) || draft.budgetAmount < 0 || draft.budgetAmount > 999_999_999_999)) {
      messages.push("Enter a budget between 0 and 999,999,999,999, or leave it blank."); fields.push("budgetAmount");
    }
    if (!/^[A-Z]{3}$/.test(draft.currencyCode?.trim().toUpperCase() ?? "")) {
      messages.push("Select a valid currency."); fields.push("currencyCode");
    }
    if ((draft.notes?.trim().length ?? 0) > 10_000) {
      messages.push("Shorten the description to 10,000 characters or fewer."); fields.push("notes");
    }
  }

  if (step === "products" || step === "review") {
    const active = draft.items.filter((item) => !isBlankLine(item));
    const rows = active.length > 0 ? active : draft.items.slice(0, 1);
    if (active.length > 100) { messages.push("Include no more than 100 products in one request."); fields.push("items"); }
    if (active.length === 0) {
      messages.push(
        "Add at least one product with a description, or select catalog products and click Add selected.",
      );
      fields.push("items");
    }
    rows.forEach((item) => {
      const index = Math.max(0, draft.items.findIndex((row) => row.id === item.id));
      const label = `Line ${index + 1}`;
      if (item.description.trim().length < 2 || item.description.trim().length > 2_000) {
        messages.push(item.description.trim().length < 2 ? `${label}: product description must be at least 2 characters.` : `${label}: product description must be 2,000 characters or fewer.`);
        fields.push(`item:${item.id}:description`);
      }
      if (!(item.quantity > 0) || !Number.isFinite(item.quantity) || item.quantity > 1_000_000) {
        messages.push(`${label}: enter a quantity greater than zero and no more than 1,000,000.`);
        fields.push(`item:${item.id}:quantity`);
      }
      if (!item.unit.trim() || item.unit.trim().length > 32) {
        messages.push(`${label}: enter a unit of 1 to 32 characters.`);
        fields.push(`item:${item.id}:unit`);
      }
    });
  }

  if (step === "delivery" || step === "review") {
    if (draft.requiredByDate && Number.isNaN(Date.parse(draft.requiredByDate))) {
      messages.push("Enter a valid required-by date, or leave it blank."); fields.push("requiredByDate");
    }
    const address = draft.destinationAddress.trim();
    const country = draft.destinationCountryCode.trim().toUpperCase();
    if (!country) {
      messages.push("Select a destination country.");
      fields.push("destinationCountryCode");
    } else if (!/^[A-Z]{2}$/.test(country)) {
      messages.push("Enter a valid two-letter country code.");
      fields.push("destinationCountryCode");
    }
    if (!address) {
      messages.push("Delivery location is required.");
      fields.push("destinationAddress");
    } else if (address.length < 5 || address.length > 1_000) {
      messages.push("Delivery location must be between 5 and 1,000 characters.");
      fields.push("destinationAddress");
    }
  }

  return { messages, fields };
}

function mergeItemsFromCatalog(
  prevItems: RequestWizardDraft["items"],
  chosen: readonly CatalogProductOption[],
): RequestWizardDraft["items"] {
  return [
    ...prevItems.filter((item) => item.description.trim()),
    ...chosen.map((product) => ({
      id: `li-${crypto.randomUUID?.() ?? product.id}`,
      description: product.name,
      quantity: 1,
      unit: product.unit ?? "pcs",
      category: product.category,
      specifications: [
        product.description?.trim(),
        product.sku ? `SKU ${product.sku}` : "",
        product.manufacturer ? `Maker ${product.manufacturer}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      productVariantId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        product.id,
      )
        ? product.id
        : undefined,
      targetUnitAmount: null,
    })),
  ];
}

/**
 * Multi-step procurement request wizard with drafts, templates, and review.
 */
export function RequestCreateWizard({
  className,
  initial,
  duplicateFrom,
  catalogProducts = [],
  templates = defaultRequestTemplates,
  categories = ["Industrial", "Electrical", "Construction", "Healthcare", "Safety", "Other"],
  recentRequests = [],
  autosaveMs = 1200,
  onAutosave,
  onSubmit,
  onSaveDraft,
  onCancel,
  onCatalogSearch,
  onNotify,
}: RequestCreateWizardProps) {
  const formId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<RequestWizardDraft>(() => {
    if (duplicateFrom) return draftFromRecord(duplicateFrom);
    return { ...emptyRequestWizardDraft(), ...initial };
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<Set<WizardFieldKey>>(
    () => new Set(),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [remoteCatalog, setRemoteCatalog] = useState<readonly CatalogProductOption[] | null>(
    null,
  );
  const searchSeq = useRef(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [errorFields, setErrorFields] = useState<WizardFieldKey[]>([]);
  const [focusRequest, setFocusRequest] = useState<{ field?: WizardFieldKey } | null>(null);
  const navigateToError = useCallback((field?: WizardFieldKey) => {
    if (field) setStepIndex(REQUEST_WIZARD_STEPS.findIndex((row) => row.id === wizardStepForField(field)));
    setFocusRequest(field ? { field } : {});
  }, []);
  useEffect(() => {
    if (!focusRequest) return;
    const nodes = Array.from(formRef.current?.querySelectorAll<HTMLElement>("[data-wizard-field]") ?? []);
    const field = focusRequest.field === "items"
      ? nodes.find((node) => node.dataset.wizardField?.endsWith(":description"))
      : nodes.find((node) => node.dataset.wizardField === focusRequest.field);
    const target = field ?? errorRef.current;
    target?.scrollIntoView?.({ block: "center", behavior: "auto" });
    target?.focus({ preventScroll: true });
    setFocusRequest(null);
  }, [focusRequest, stepIndex]);
  const footerRef = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef(draft.attachments);
  attachmentsRef.current = draft.attachments;

  const step = REQUEST_WIZARD_STEPS[stepIndex]!;

  const fieldInvalid = (key: WizardFieldKey) => invalidFields.has(key);
  const fieldError = (key: WizardFieldKey) => fieldInvalid(key)
    ? <span className="hamd-pr-wizard__field-error">{errors[errorFields.indexOf(key)]}</span> : null;

  useEffect(() => {
    if (!onCatalogSearch) {
      setRemoteCatalog(null);
      return;
    }
    const q = productQuery.trim();
    const seq = ++searchSeq.current;
    const handle = window.setTimeout(() => {
      void onCatalogSearch(q)
        .then((rows) => {
          if (seq !== searchSeq.current) return;
          setRemoteCatalog(rows);
        })
        .catch(() => {
          if (seq !== searchSeq.current) return;
          setRemoteCatalog([]);
        });
    }, 280);
    return () => window.clearTimeout(handle);
  }, [onCatalogSearch, productQuery]);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer || typeof ResizeObserver === "undefined") return;
    const found = footer.closest(".hamd-web-procurement");
    const host = found instanceof HTMLElement ? found : document.documentElement;
    const apply = () => {
      const height = Math.ceil(footer.getBoundingClientRect().height);
      host.style.setProperty("--request-action-footer-height", `${height}px`);
    };
    const observer = new ResizeObserver(apply);
    observer.observe(footer);
    apply();
    return () => {
      observer.disconnect();
      host.style.removeProperty("--request-action-footer-height");
    };
  }, [stepIndex, onCancel, busy]);

  const filteredCatalog = useMemo(() => {
    const source = remoteCatalog ?? catalogProducts;
    const q = productQuery.trim().toLowerCase();
    return source.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }
      if (remoteCatalog || !q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.sku?.toLowerCase().includes(q) ?? false) ||
        (product.description?.toLowerCase().includes(q) ?? false) ||
        (product.manufacturer?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [catalogProducts, categoryFilter, productQuery, remoteCatalog]);


  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  /* Autosave */
  useEffect(() => {
    if (!onAutosave) return;
    const timer = window.setTimeout(() => {
      setSaving(true);
      void Promise.resolve(onAutosave(draft))
        .then(() => setStatus("Draft saved"))
        .catch(() => setStatus("Could not save draft"))
        .finally(() => setSaving(false));
    }, autosaveMs);
    return () => window.clearTimeout(timer);
  }, [autosaveMs, draft, onAutosave]);

  const clearValidation = useCallback(() => {
    setErrors([]);
    setInvalidFields(new Set());
  }, []);

  const applyValidation = useCallback((result: WizardValidationResult) => {
    setErrors(result.messages);
    setErrorFields(result.fields);
    setInvalidFields(new Set(result.fields));
    navigateToError(result.fields[0]);
  }, [navigateToError]);

  const patch = useCallback(
    (partial: Partial<RequestWizardDraft>) => {
      setDraft((prev) => ({ ...prev, ...partial }));
      clearValidation();
    },
    [clearValidation],
  );

  const updateItem = (
    id: string,
    partial: Partial<RequestWizardDraft["items"][number]>,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    }));
    clearValidation();
  };

  const addItem = () => {
    setDraft((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      items:
        prev.items.length <= 1
          ? prev.items
          : prev.items.filter((item) => item.id !== id),
    }));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setDraft((prev) => {
      prev.attachments.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return {
        ...emptyRequestWizardDraft(),
        ...template.draft,
        items: template.draft.items.map((item) => ({
          ...item,
          id: `li-${crypto.randomUUID?.() ?? String(Date.now())}`,
        })),
        destinationAddress:
          template.draft.destinationAddress.trim() || prev.destinationAddress,
        destinationCountryCode:
          template.draft.destinationCountryCode || prev.destinationCountryCode,
        attachments: [],
        rowVersion: prev.rowVersion,
      };
    });
    setStatus(`Template “${template.name}” applied`);
    setStepIndex(0);
    clearValidation();
  };

  const applyRecent = (requestId: string) => {
    const row = recentRequests.find((item) => item.id === requestId);
    if (!row) return;
    setDraft(draftFromRecord(row));
    setStatus(`Copied from ${row.publicCode}`);
    setStepIndex(0);
    clearValidation();
  };

  const toggleCatalog = (id: string) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    clearValidation();
  };

  const addSelectedProducts = () => {
    const chosen = catalogProducts.filter((p) =>
      selectedCatalogIds.includes(p.id),
    );
    if (chosen.length === 0) return;
    setDraft((prev) => ({
      ...prev,
      items: mergeItemsFromCatalog(prev.items, chosen),
    }));
    setSelectedCatalogIds([]);
    setStatus(`${chosen.length} product(s) added`);
    clearValidation();
  };

  const goNext = () => {
    if (step.id === "products" && selectedCatalogIds.length > 0) {
      const active = draft.items.filter((item) => !isBlankLine(item));
      if (active.length === 0) {
        applyValidation({
          messages: [
            "Click Add selected to add catalog products, or complete a custom line item before continuing.",
          ],
          fields: ["items"],
        });
        onNotify?.({
          tone: "warning",
          title: "Please complete the required fields.",
        });
        return;
      }
    }

    const stepErrors = validateStep(step.id, draft);
    if (stepErrors.messages.length) {
      applyValidation(stepErrors);
      onNotify?.({
        tone: "warning",
        title: "Please complete the required fields.",
      });
      return;
    }
    clearValidation();
    setStepIndex((i) => Math.min(i + 1, REQUEST_WIZARD_STEPS.length - 1));
  };

  const goPrev = () => {
    clearValidation();
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const toPayload = (submit: boolean): RequestWizardSubmitPayload => ({
    title: draft.title.trim(),
    notes: draft.notes.trim() || null,
    destinationCountryCode: draft.destinationCountryCode || null,
    destinationAddress: draft.destinationAddress.trim() || null,
    requiredByDate: draft.requiredByDate || null,
    budgetAmount: draft.budgetAmount,
    priority: draft.priority,
    currencyCode: draft.currencyCode,
    restrictedGoodsDeclared: draft.restrictedGoodsDeclared,
    items: draft.items
      .filter((row) => row.description.trim())
      .map((row) => {
        const { category: _category, specifications: _specifications, ...item } =
          row;
        void _category;
        void _specifications;
        return item;
      }),
    rowVersion: draft.rowVersion,
    submit,
    internalNotes: draft.internalNotes.trim() || undefined,
    attachmentFiles: draft.attachments
      .map((a) => a.file)
      .filter((f): f is File => Boolean(f)),
  });

  const saveLater = async () => {
    const stepErrors = validateStep("basics", draft);
    if (stepErrors.messages.length) {
      applyValidation(stepErrors);
      return;
    }
    setBusy(true);
    clearValidation();
    try {
      await onSaveDraft?.(toPayload(false));
      setStatus("Saved. You can continue later from Drafts.");
    } catch (err) {
      applyValidation({
        messages: [
          err instanceof Error ? err.message : "Could not save draft.",
        ],
        fields: [],
      });
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const results = REQUEST_WIZARD_STEPS.filter((step) => step.id !== "review")
      .map((step) => validateStep(step.id, draft));
    const messages = results.flatMap((result) => result.messages);
    if (messages.length) {
      applyValidation({ messages, fields: results.flatMap((result) => result.fields) });
      return;
    }
    setBusy(true);
    clearValidation();
    try {
      await onAutosave?.(draft);
      await onSubmit?.(toPayload(true));
      setStatus("Request submitted for review.");
    } catch (err) {
      applyValidation(serverValidation(err, draft));
    } finally {
      setBusy(false);
    }
  };

  const revokePreview = (url: string | undefined) => {
    if (url) URL.revokeObjectURL(url);
  };

  const removeAttachment = (id: string) => {
    setDraft((prev) => {
      const item = prev.attachments.find((row) => row.id === id);
      revokePreview(item?.previewUrl);
      return {
        ...prev,
        attachments: prev.attachments.filter((row) => row.id !== id),
      };
    });
  };

  const onFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const maxBytes = 10 * 1024 * 1024;
    const incoming = Array.from(fileList).filter(
      (file) =>
        file instanceof File &&
        typeof file.name === "string" &&
        file.name.length > 0 &&
        file.size > 0 &&
        file.size <= maxBytes,
    );
    if (incoming.length === 0) {
      onNotify?.({
        tone: "warning",
        title: "Some attachments could not be uploaded.",
        description: "Please remove invalid files and try again.",
      });
      return;
    }
    setDraft((prev) => {
      const room = Math.max(0, 5 - prev.attachments.length);
      const next = incoming.slice(0, room).map((file) => {
        const isImage = file.type.startsWith("image/");
        return {
          id: `att-${crypto.randomUUID?.() ?? `${file.name}-${file.size}`}`,
          name: file.name,
          sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          file,
          kind: isImage ? ("image" as const) : ("file" as const),
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
        };
      });
      return {
        ...prev,
        attachments: [...prev.attachments, ...next],
      };
    });
  };

  return (
    <div className={cx("hamd-pr", "hamd-pr-wizard", className)}>
      <header className="hamd-pr-wizard__header">
        <div>
          <h1 className="hamd-pr-wizard__title">New procurement request</h1>
          <p className="hamd-pr-wizard__subtitle">
            Build a clear request your sourcing team can act on - save a draft
            any time and submit when the line items are complete.
          </p>
        </div>
        <div className="hamd-pr-wizard__meta" aria-live="polite">
          {saving ? "Saving…" : status}
        </div>
      </header>

      <div className="hamd-pr-wizard__steps" data-tour="wizard-steps" data-guide="wizard-steps">
        <ProcurementProgress
          variant="wizard"
          wizardSteps={REQUEST_WIZARD_STEPS}
          wizardIndex={stepIndex}
          wizardErrorSteps={errorFields.map((field) => REQUEST_WIZARD_STEPS.findIndex((item) => item.id === wizardStepForField(field)))}
          onWizardStepSelect={(index) => {
            if (index >= stepIndex) return;
            clearValidation();
            setStepIndex(index);
          }}
        />
      </div>

      <div className="hamd-pr-wizard__toolbar">
        <label>
          Start from template
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyTemplate(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">Choose template…</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        {recentRequests.length > 0 ? (
          <label>
            Duplicate recent
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) applyRecent(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Choose request…</option>
              {recentRequests.slice(0, 8).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.publicCode} - {row.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <form
        ref={formRef}
        id={formId}
        className="hamd-pr-wizard__panel"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step.id === "review") void submit();
          else goNext();
        }}
      >
        {errors.length > 0 ? (
          <div
            ref={errorRef}
            className="hamd-pr-wizard__errors"
            role="alert"
            tabIndex={-1}
          >
            <p className="hamd-pr-wizard__errors-title">
              Please complete the required fields before continuing.
            </p>
            <ul>
              {errors.map((error, index) => (
                <li key={`${index}-${error}`}>
                  {errorFields[index] ? <button type="button" onClick={() => navigateToError(errorFields[index])}>{error}</button> : error}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {step.id === "basics" ? (
          <fieldset className="hamd-pr-wizard__fieldset">
            <legend>Request basics</legend>
            <label>
              Request title *
              <input
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="e.g. Valves for Lagos warehouse expansion"
                data-wizard-field="title"
                aria-label="title"
                aria-required="true"
                aria-invalid={fieldInvalid("title") || undefined}
                required
              />
              {fieldInvalid("title") ? (
                <span className="hamd-pr-wizard__field-error">
                  {errors[errorFields.indexOf("title")]}
                </span>
              ) : null}
            </label>
            <label>
              Description
              <textarea
                rows={4}
                value={draft.notes}
                data-wizard-field="notes"
                aria-invalid={fieldInvalid("notes") || undefined}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Optional commercial context for sourcing"
              />
              {fieldError("notes")}
            </label>
            <div className="hamd-pr-wizard__grid">
              <label>
                Priority
                <select
                  value={draft.priority}
                  onChange={(e) =>
                    patch({
                      priority: e.target.value as ProcurementPriority,
                    })
                  }
                >
                  {PROCUREMENT_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Currency
                <select
                  value={draft.currencyCode}
                  data-wizard-field="currencyCode"
                  aria-invalid={fieldInvalid("currencyCode") || undefined}
                  onChange={(e) => patch({ currencyCode: e.target.value })}
                >
                  {["USD", "NGN", "EUR", "GBP", "CNY"].map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                {fieldError("currencyCode")}
              </label>
              <label>
                Budget
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.budgetAmount ?? ""}
                  data-wizard-field="budgetAmount"
                  aria-invalid={fieldInvalid("budgetAmount") || undefined}
                  onChange={(e) =>
                    patch({
                      budgetAmount:
                        e.target.value === ""
                          ? null
                          : Number(e.target.value),
                    })
                  }
                  placeholder="Optional"
                />
                {fieldError("budgetAmount")}
              </label>
            </div>
            <label className="hamd-pr-wizard__check">
              <input
                type="checkbox"
                checked={draft.restrictedGoodsDeclared}
                onChange={(e) =>
                  patch({ restrictedGoodsDeclared: e.target.checked })
                }
              />
              This request may include restricted or controlled goods
            </label>
          </fieldset>
        ) : null}

        {step.id === "products" ? (
          <div className="hamd-pr-wizard__products">
            <fieldset
              className={cx(
                "hamd-pr-wizard__fieldset",
                fieldInvalid("items") && "is-invalid",
              )}
              data-wizard-field="items"
              tabIndex={fieldInvalid("items") ? -1 : undefined}
            >
              <legend>Product search & bulk add</legend>
              <p className="hamd-pr-wizard__help">
                Select catalog products below, then add them to your line items.
                Required fields must be complete before you can continue.
              </p>
              <div className="hamd-pr-wizard__grid">
                <label>
                  Search catalog
                  <input
                    type="search"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    placeholder="Name, SKU, or category"
                  />
                </label>
                <label>
                  Category
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {filteredCatalog.length === 0 ? (
                <p className="hamd-pr-wizard__help" role="status">
                  No products match this search. Adjust filters or add a custom
                  line item below.
                </p>
              ) : (
                <ul className="hamd-pr-wizard__catalog" role="list">
                  {filteredCatalog.map((product) => {
                    const selected = selectedCatalogIds.includes(product.id);
                    return (
                      <li key={product.id}>
                        <label
                          className={cx(
                            "hamd-pr-wizard__product-card",
                            selected && "is-selected",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="hamd-pr-wizard__product-card-check"
                            checked={selected}
                            onChange={() => toggleCatalog(product.id)}
                            aria-label={`Select ${product.name}`}
                          />
                          <span
                            className="hamd-pr-wizard__product-card-media"
                            aria-hidden="true"
                          >
                            {product.imageSrc ? (
                              <img
                                src={product.imageSrc}
                                alt=""
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <span className="hamd-pr-wizard__product-card-ph">
                                Catalogue placeholder
                              </span>
                            )}
                          </span>
                          <span className="hamd-pr-wizard__product-card-body">
                            <span className="hamd-pr-wizard__product-card-eyebrow">
                              {product.category}
                              {product.sku ? ` · ${product.sku}` : ""}
                            </span>
                            <strong className="hamd-pr-wizard__product-card-title">
                              {product.name}
                            </strong>
                            {product.manufacturer ? (
                              <span className="hamd-pr-wizard__product-card-maker">
                                {product.manufacturer}
                              </span>
                            ) : null}
                            <span className="hamd-pr-wizard__product-card-meta">
                              Select to add this product
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                className="hamd-btn hamd-btn--secondary"
                onClick={addSelectedProducts}
                disabled={selectedCatalogIds.length === 0}
              >
                Add selected ({selectedCatalogIds.length})
              </button>
            </fieldset>

            <fieldset className="hamd-pr-wizard__fieldset">
              <legend>Line items</legend>
              {draft.items.map((item, index) => (
                <div key={item.id} className="hamd-pr-wizard__line">
                  <p className="hamd-pr-wizard__line-title">Line {index + 1}</p>
                  <div className="hamd-pr-wizard__grid">
                    <label className="hamd-pr-wizard__span-2">
                      Description
                      <input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, { description: e.target.value })
                        }
                        placeholder="Product or specification"
                        data-wizard-field={`item:${item.id}:description`}
                        aria-required="true"
                        required
                        aria-invalid={
                          fieldInvalid(`item:${item.id}:description`) ||
                          undefined
                        }
                      />
                      {fieldError(`item:${item.id}:description`)}
                    </label>
                    <label>
                      Category
                      <select
                        value={item.category ?? ""}
                        onChange={(e) =>
                          updateItem(item.id, { category: e.target.value })
                        }
                        data-wizard-field={`item:${item.id}:category`}
                        aria-invalid={
                          fieldInvalid(`item:${item.id}:category`) || undefined
                        }
                      >
                        <option value="">Select…</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Quantity
                      <QuantityStepper
                        value={item.quantity}
                        invalid={fieldInvalid(`item:${item.id}:quantity`)}
                        fieldKey={`item:${item.id}:quantity`}
                        onChange={(quantity) => updateItem(item.id, { quantity })}
                      />
                      {fieldError(`item:${item.id}:quantity`)}
                    </label>
                    <label>
                      Unit
                      <select
                        value={
                          QUANTITY_UNITS.includes(
                            item.unit as (typeof QUANTITY_UNITS)[number],
                          )
                            ? item.unit
                            : item.unit || "pcs"
                        }
                        onChange={(e) =>
                          updateItem(item.id, { unit: e.target.value })
                        }
                        data-wizard-field={`item:${item.id}:unit`}
                        aria-required="true"
                        required
                        aria-invalid={
                          fieldInvalid(`item:${item.id}:unit`) || undefined
                        }
                      >
                        {item.unit &&
                        !QUANTITY_UNITS.includes(
                          item.unit as (typeof QUANTITY_UNITS)[number],
                        ) ? (
                          <option value={item.unit}>{item.unit}</option>
                        ) : null}
                        {QUANTITY_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit === "pcs"
                              ? "Pieces"
                              : unit === "kg"
                                ? "Kilograms"
                                : unit.charAt(0).toUpperCase() + unit.slice(1)}
                          </option>
                        ))}
                      </select>
                      {fieldError(`item:${item.id}:unit`)}
                    </label>
                    <label className="hamd-pr-wizard__span-2">
                      Specifications
                      <textarea
                        rows={2}
                        value={item.specifications ?? ""}
                        onChange={(e) =>
                          updateItem(item.id, {
                            specifications: e.target.value,
                          })
                        }
                        placeholder="Standards, materials, tolerances…"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--ghost"
                    onClick={() => removeItem(item.id)}
                    disabled={draft.items.length <= 1}
                  >
                    Remove line
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="hamd-btn hamd-btn--secondary"
                onClick={addItem}
              >
                Add product line
              </button>
            </fieldset>
          </div>
        ) : null}

        {step.id === "delivery" ? (
          <fieldset className="hamd-pr-wizard__fieldset">
            <legend>Delivery & notes</legend>
            <div className="hamd-pr-wizard__grid">
              <label>
                Country
                <input
                  value={draft.destinationCountryCode}
                  onChange={(e) =>
                    patch({
                      destinationCountryCode: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={2}
                  placeholder="NG"
                  data-wizard-field="destinationCountryCode"
                  aria-required="true"
                  required
                  aria-invalid={
                    fieldInvalid("destinationCountryCode") || undefined
                  }
                />
              </label>
              <label>
                Required by
                <input
                  type="date"
                  value={draft.requiredByDate}
                  data-wizard-field="requiredByDate"
                  aria-invalid={fieldInvalid("requiredByDate") || undefined}
                  onChange={(e) => patch({ requiredByDate: e.target.value })}
                />
                {fieldError("requiredByDate")}
              </label>
              <label className="hamd-pr-wizard__span-2">
                Delivery location
                <textarea
                  rows={3}
                  value={draft.destinationAddress}
                  onChange={(e) =>
                    patch({ destinationAddress: e.target.value })
                  }
                  placeholder="Site address, warehouse, or receiving contact"
                  data-wizard-field="destinationAddress"
                  aria-required="true"
                  required
                  minLength={5}
                  aria-invalid={
                    fieldInvalid("destinationAddress") || undefined
                  }
                />
                {fieldInvalid("destinationAddress") ? (
                  <span className="hamd-pr-wizard__field-error">
                    {errors[errorFields.indexOf("destinationAddress")]}
                  </span>
                ) : null}
              </label>
            </div>
          </fieldset>
        ) : null}

        {step.id === "documents" ? (
          <fieldset className="hamd-pr-wizard__fieldset">
            <legend>Attachments</legend>
            <p className="hamd-pr-wizard__help">
              Add photos, drawings, packing lists, or RFQ references. You can
              select several files at once.
            </p>
            <label
              className={cx(
                "hamd-pr-wizard__dropzone",
                draft.attachments.length >= 5 && "is-full",
              )}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (draft.attachments.length >= 5) return;
                onFiles(event.dataTransfer.files);
              }}
            >
              <span className="hamd-pr-wizard__dropzone-title">
                {draft.attachments.length >= 5
                  ? "Maximum of 5 files reached"
                  : "Drop files here or browse"}
              </span>
              <span className="hamd-pr-wizard__dropzone-copy">
                Images show a preview. PDF, Word, and text are listed by name.
              </span>
              <span className="hamd-pr-wizard__dropzone-btn">
                {draft.attachments.length >= 5 ? "Limit reached" : "Select images & files"}
              </span>
              <input
                type="file"
                multiple
                disabled={draft.attachments.length >= 5}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/*"
                aria-label="Select images and files"
                aria-describedby="hamd-pr-wizard-file-help"
                onChange={(e) => {
                  onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <p id="hamd-pr-wizard-file-help" className="hamd-pr-wizard__help">
              {draft.attachments.length}/5 files · 10&nbsp;MB each · PDF, Word,
              text, and images.
            </p>
            <AttachmentBoard
              files={draft.attachments.map((file) => ({
                id: file.id,
                name: file.name,
                previewUrl: file.previewUrl,
                kind: file.kind,
                sizeLabel: file.sizeLabel,
              }))}
              mediaTitle="Media"
              documentsTitle="Documents"
              emptyLabel="No attachments yet. Add one or more photos or documents."
              onRemove={removeAttachment}
            />
          </fieldset>
        ) : null}

        {step.id === "review" ? (
          <div className="hamd-pr-wizard__review">
            <h2>Review before submit</h2>
            <p>
              Confirm the commercial facts below. After submit, sourcing owns
              the next action and you will see status on the request timeline.
            </p>
            <dl className="hamd-pr-wizard__summary">
              <div>
                <dt>Title</dt>
                <dd>{draft.title || "-"}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{draft.priority}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>
                  {draft.budgetAmount != null
                    ? `${draft.currencyCode} ${draft.budgetAmount.toLocaleString()}`
                    : "Not set"}
                </dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  {draft.destinationAddress || "-"}
                  {draft.destinationCountryCode
                    ? ` (${draft.destinationCountryCode})`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Required by</dt>
                <dd>{draft.requiredByDate || "Flexible"}</dd>
              </div>
              <div>
                <dt>Lines</dt>
                <dd>{draft.items.length}</dd>
              </div>
              <div>
                <dt>Attachments</dt>
                <dd>{draft.attachments.length}</dd>
              </div>
            </dl>
            <h3>What happens after you submit</h3>
            <ProcurementProgress variant="preview" status="draft" />
            <ul className="hamd-pr-wizard__line-preview">
              {draft.items.map((item) => (
                <li key={item.id}>
                  <strong>{item.description || "Untitled line"}</strong>
                  <span>
                    {item.quantity} {item.unit}
                    {item.category ? ` · ${item.category}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="hamd-pr-wizard__footer" ref={footerRef}>
          <div className="hamd-pr-wizard__actions">
            <div className="hamd-pr-wizard__actions-secondary">
              {onCancel ? (
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="button"
                className="hamd-btn hamd-btn--outline"
                data-tour="save-draft"
                data-guide="save-draft"
                onClick={() => void saveLater()}
                disabled={busy}
              >
                Save for later
              </button>
            </div>
            <div className="hamd-pr-wizard__actions-nav">
              <button
                type="button"
                className="hamd-btn hamd-btn--secondary"
                onClick={goPrev}
                disabled={stepIndex === 0 || busy}
              >
                Previous
              </button>
              {step.id === "review" ? (
                <button
                  type="submit"
                  className="hamd-btn hamd-btn--primary"
                  data-tour="submit-request"
                  data-guide="submit-request"
                  disabled={busy}
                >
                  {busy ? "Submitting…" : "Submit request"}
                </button>
              ) : (
                <button
                  type="submit"
                  className="hamd-btn hamd-btn--primary"
                  disabled={busy}
                >
                  {busy ? "Checking…" : "Next"}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export type { ProcurementAttachment };
