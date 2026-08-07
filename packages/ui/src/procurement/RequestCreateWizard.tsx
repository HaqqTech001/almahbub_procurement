/**
 * Request create / edit wizard — V1 parity + V2 improvements.
 * Drafts, autosave, templates, multi-product, validation, review.
 */

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import type {
  ProcurementAttachment,
  ProcurementDraftPatch,
  ProcurementLineItem,
  ProcurementPriority,
  ProcurementRequestRecord,
} from "./types.js";
import { PROCUREMENT_PRIORITIES } from "./types.js";

export const REQUEST_WIZARD_STEPS = [
  { id: "basics", label: "Basics" },
  { id: "products", label: "Products" },
  { id: "delivery", label: "Delivery" },
  { id: "documents", label: "Documents" },
  { id: "review", label: "Review" },
] as const;

export type RequestWizardStepId = (typeof REQUEST_WIZARD_STEPS)[number]["id"];

export type CatalogProductOption = {
  id: string;
  name: string;
  category: string;
  unit?: string | undefined;
  sku?: string | undefined;
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
    id: "tpl-industrial",
    name: "Industrial components",
    description: "Valves, fittings, and plant spare parts.",
    draft: {
      title: "Industrial components order",
      priority: "normal",
      currencyCode: "USD",
      budgetAmount: null,
      notes: "Prefer ISO-certified suppliers.",
      internalNotes: "",
      destinationCountryCode: "NG",
      destinationAddress: "",
      requiredByDate: "",
      restrictedGoodsDeclared: false,
      items: [
        {
          id: "tpl-i1",
          description: "",
          quantity: 1,
          unit: "pcs",
          category: "Industrial",
          specifications: "",
        },
      ],
    },
  },
  {
    id: "tpl-electrical",
    name: "Electrical supply",
    description: "Panels, breakers, and cable assemblies.",
    draft: {
      title: "Electrical supply request",
      priority: "high",
      currencyCode: "USD",
      budgetAmount: null,
      notes: "",
      internalNotes: "",
      destinationCountryCode: "NG",
      destinationAddress: "",
      requiredByDate: "",
      restrictedGoodsDeclared: false,
      items: [
        {
          id: "tpl-e1",
          description: "",
          quantity: 1,
          unit: "pcs",
          category: "Electrical",
          specifications: "",
        },
      ],
    },
  },
];

export const defaultCatalogProducts: CatalogProductOption[] = [
  {
    id: "cat-valve-dn50",
    name: "Gate valve DN50 PN16",
    category: "Industrial",
    unit: "pcs",
    sku: "VLV-DN50",
  },
  {
    id: "cat-valve-dn80",
    name: "Ball valve DN80",
    category: "Industrial",
    unit: "pcs",
    sku: "VLV-DN80",
  },
  {
    id: "cat-breaker-63",
    name: "MCCB 63A 3P",
    category: "Electrical",
    unit: "pcs",
    sku: "BRK-63",
  },
  {
    id: "cat-cable-4c",
    name: "Armoured cable 4×25mm²",
    category: "Electrical",
    unit: "m",
    sku: "CBL-4C25",
  },
  {
    id: "cat-ppe-helmet",
    name: "Safety helmet (EN 397)",
    category: "Safety",
    unit: "pcs",
    sku: "PPE-HLM",
  },
];

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

function validateStep(
  step: RequestWizardStepId,
  draft: RequestWizardDraft,
): string[] {
  const errors: string[] = [];
  if (step === "basics" || step === "review") {
    if (!draft.title.trim()) errors.push("Enter a request title.");
  }
  if (step === "products" || step === "review") {
    if (draft.items.length === 0) errors.push("Add at least one product line.");
    draft.items.forEach((item, index) => {
      if (!item.description.trim()) {
        errors.push(`Line ${index + 1}: product description is required.`);
      }
      if (!(item.quantity > 0)) {
        errors.push(`Line ${index + 1}: quantity must be greater than zero.`);
      }
    });
  }
  if (step === "delivery" || step === "review") {
    if (!draft.destinationAddress.trim()) {
      errors.push("Enter a delivery location.");
    }
    if (!draft.destinationCountryCode.trim()) {
      errors.push("Select a destination country.");
    }
  }
  return errors;
}

/**
 * Multi-step procurement request wizard with drafts, templates, and review.
 */
export function RequestCreateWizard({
  className,
  initial,
  duplicateFrom,
  catalogProducts = defaultCatalogProducts,
  templates = defaultRequestTemplates,
  categories = ["Industrial", "Electrical", "Construction", "Healthcare", "Safety", "Other"],
  recentRequests = [],
  autosaveMs = 1200,
  onAutosave,
  onSubmit,
  onSaveDraft,
  onCancel,
}: RequestCreateWizardProps) {
  const formId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<RequestWizardDraft>(() => {
    if (duplicateFrom) return draftFromRecord(duplicateFrom);
    return { ...emptyRequestWizardDraft(), ...initial };
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const step = REQUEST_WIZARD_STEPS[stepIndex]!;
  const progress = Math.round(((stepIndex + 1) / REQUEST_WIZARD_STEPS.length) * 100);

  const filteredCatalog = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return catalogProducts.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.sku?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [catalogProducts, categoryFilter, productQuery]);

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

  const patch = useCallback((partial: Partial<RequestWizardDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setErrors([]);
  }, []);

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
    setErrors([]);
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
    setDraft((prev) => ({
      ...emptyRequestWizardDraft(),
      ...template.draft,
      items: template.draft.items.map((item) => ({
        ...item,
        id: `li-${crypto.randomUUID?.() ?? String(Date.now())}`,
      })),
      attachments: [],
      rowVersion: prev.rowVersion,
    }));
    setStatus(`Template “${template.name}” applied`);
    setStepIndex(0);
  };

  const applyRecent = (requestId: string) => {
    const row = recentRequests.find((item) => item.id === requestId);
    if (!row) return;
    setDraft(draftFromRecord(row));
    setStatus(`Copied from ${row.publicCode}`);
    setStepIndex(0);
  };

  const toggleCatalog = (id: string) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addSelectedProducts = () => {
    const chosen = catalogProducts.filter((p) =>
      selectedCatalogIds.includes(p.id),
    );
    if (chosen.length === 0) return;
    setDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items.filter((item) => item.description.trim()),
        ...chosen.map((product) => ({
          id: `li-${crypto.randomUUID?.() ?? product.id}`,
          description: product.name,
          quantity: 1,
          unit: product.unit ?? "pcs",
          category: product.category,
          specifications: product.sku ? `SKU ${product.sku}` : "",
          productVariantId: product.id,
          targetUnitAmount: null,
        })),
      ],
    }));
    setSelectedCatalogIds([]);
    setStatus(`${chosen.length} product(s) added`);
  };

  const goNext = () => {
    const stepErrors = validateStep(step.id, draft);
    if (stepErrors.length) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setStepIndex((i) => Math.min(i + 1, REQUEST_WIZARD_STEPS.length - 1));
  };

  const goPrev = () => {
    setErrors([]);
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
    items: draft.items.map((row) => {
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
    if (stepErrors.length) {
      setErrors(stepErrors);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      await onSaveDraft?.(toPayload(false));
      setStatus("Saved. You can continue later from Drafts.");
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Could not save draft."]);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const allErrors = REQUEST_WIZARD_STEPS.flatMap((s) =>
      validateStep(s.id, draft),
    );
    const unique = [...new Set(allErrors)];
    if (unique.length) {
      setErrors(unique);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      await onSubmit?.(toPayload(true));
      setStatus("Request submitted for review.");
    } catch (err) {
      setErrors([
        err instanceof Error ? err.message : "Could not submit request.",
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const maxBytes = 10 * 1024 * 1024;
    const incoming = Array.from(fileList).filter((file) => file.size <= maxBytes);
    setDraft((prev) => {
      const room = Math.max(0, 5 - prev.attachments.length);
      const next = incoming.slice(0, room).map((file) => ({
        id: `att-${crypto.randomUUID?.() ?? file.name}`,
        name: file.name,
        sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        file,
      }));
      return {
        ...prev,
        attachments: [...prev.attachments, ...next],
      };
    });
  };

  return (
    <div className={cx("hamd-pr-wizard", className)}>
      <header className="hamd-pr-wizard__header">
        <div>
          <h1 className="hamd-pr-wizard__title">New procurement request</h1>
          <p className="hamd-pr-wizard__subtitle">
            Build a clear request your sourcing team can act on — save a draft
            any time and submit when the line items are complete.
          </p>
        </div>
        <div className="hamd-pr-wizard__meta" aria-live="polite">
          {saving ? "Saving…" : status}
        </div>
      </header>

      <nav className="hamd-pr-wizard__steps" aria-label="Request progress">
        <ol>
          {REQUEST_WIZARD_STEPS.map((item, index) => (
            <li
              key={item.id}
              className={cx(
                index === stepIndex && "is-current",
                index < stepIndex && "is-done",
              )}
            >
              <button
                type="button"
                onClick={() => {
                  if (index <= stepIndex) setStepIndex(index);
                }}
                aria-current={index === stepIndex ? "step" : undefined}
              >
                <span className="hamd-pr-wizard__step-index">{index + 1}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>
        <div
          className="hamd-pr-wizard__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Form completion"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </nav>

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
                  {row.publicCode} — {row.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {errors.length > 0 ? (
        <div className="hamd-pr-wizard__errors" role="alert">
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        id={formId}
        className="hamd-pr-wizard__panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (step.id === "review") void submit();
          else goNext();
        }}
      >
        {step.id === "basics" ? (
          <fieldset className="hamd-pr-wizard__fieldset">
            <legend>Request basics</legend>
            <label>
              Title
              <input
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="e.g. Valves for Lagos warehouse expansion"
                aria-required="true"
              />
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
                  onChange={(e) => patch({ currencyCode: e.target.value })}
                >
                  {["USD", "NGN", "EUR", "GBP", "CNY"].map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Budget
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.budgetAmount ?? ""}
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
            <fieldset className="hamd-pr-wizard__fieldset">
              <legend>Product search & bulk add</legend>
              <div className="hamd-pr-wizard__grid">
                <label>
                  Search catalog
                  <input
                    type="search"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
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
              <ul className="hamd-pr-wizard__catalog" role="list">
                {filteredCatalog.map((product) => (
                  <li key={product.id}>
                    <label className="hamd-pr-wizard__check">
                      <input
                        type="checkbox"
                        checked={selectedCatalogIds.includes(product.id)}
                        onChange={() => toggleCatalog(product.id)}
                      />
                      <span>
                        <strong>{product.name}</strong>
                        <small>
                          {product.category}
                          {product.sku ? ` · ${product.sku}` : ""}
                        </small>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
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
                      />
                    </label>
                    <label>
                      Category
                      <select
                        value={item.category ?? ""}
                        onChange={(e) =>
                          updateItem(item.id, { category: e.target.value })
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
                      Qty
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity: Number(e.target.value) || 1,
                          })
                        }
                      />
                    </label>
                    <label>
                      Unit
                      <input
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(item.id, { unit: e.target.value })
                        }
                      />
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
                />
              </label>
              <label>
                Required by
                <input
                  type="date"
                  value={draft.requiredByDate}
                  onChange={(e) => patch({ requiredByDate: e.target.value })}
                />
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
                />
              </label>
              <label className="hamd-pr-wizard__span-2">
                Notes for sourcing
                <textarea
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                  placeholder="Commercial constraints, preferred brands, inspection needs"
                />
              </label>
              <label className="hamd-pr-wizard__span-2">
                Internal notes
                <textarea
                  rows={2}
                  value={draft.internalNotes}
                  onChange={(e) => patch({ internalNotes: e.target.value })}
                  placeholder="Visible to your team only"
                />
              </label>
            </div>
          </fieldset>
        ) : null}

        {step.id === "documents" ? (
          <fieldset className="hamd-pr-wizard__fieldset">
            <legend>Attachments</legend>
            <p className="hamd-pr-wizard__help">
              Attach drawings, packing lists, or RFQ references. Files stay with
              this draft until you submit.
            </p>
            <label className="hamd-pr-wizard__file">
              <span>Upload files</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/*"
                aria-describedby="hamd-pr-wizard-file-help"
                onChange={(e) => {
                  onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <p id="hamd-pr-wizard-file-help" className="hamd-pr-wizard__help">
              Up to 5 files, 10&nbsp;MB each. PDF, Word, text, and images.
            </p>
            <ul className="hamd-pr-wizard__attachments" role="list">
              {draft.attachments.length === 0 ? (
                <li>No attachments yet.</li>
              ) : (
                draft.attachments.map((file) => (
                  <li key={file.id}>
                    <span>
                      {file.name} · {file.sizeLabel}
                    </span>
                    <button
                      type="button"
                      className="hamd-btn hamd-btn--ghost"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          attachments: prev.attachments.filter(
                            (item) => item.id !== file.id,
                          ),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
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
                <dd>{draft.title || "—"}</dd>
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
                  {draft.destinationAddress || "—"}
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
            <h3>Approval preview</h3>
            <ol className="hamd-pr-wizard__approval">
              <li>Buyer submits request (you)</li>
              <li>Ops reviews scope and accepts for sourcing</li>
              <li>Quote issued for commercial approval</li>
              <li>Approved request moves to purchase and delivery</li>
            </ol>
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

        <div className="hamd-pr-wizard__actions">
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
            className="hamd-btn hamd-btn--secondary"
            onClick={() => void saveLater()}
            disabled={busy}
          >
            Save and continue later
          </button>
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
              disabled={busy}
            >
              {busy ? "Submitting…" : "Submit request"}
            </button>
          ) : (
            <button type="submit" className="hamd-btn hamd-btn--primary">
              Next
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export type { ProcurementAttachment };
