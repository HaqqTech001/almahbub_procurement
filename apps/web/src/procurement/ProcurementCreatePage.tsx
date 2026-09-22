import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  RequestCreateWizard,
  type CatalogProductOption,
  type ProcurementRequestRecord,
  type RequestWizardDraft,
  type RequestWizardSubmitPayload,
} from "@hamd/ui/procurement";

import { useToast } from "../app/providers/ToastProvider.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import {
  getPublicProduct,
  listPublicCategories,
  listPublicProducts,
} from "../api/catalog-api.js";
import {
  HostAlert,
  HostLoading,
  HostPage,
} from "../components/HostChrome.js";
import { RequestCoach } from "../copilot/RequestCoach.js";
import { guideRequestDraft } from "../copilot/copilot-api.js";
import { resolveMediaUrl } from "../lib/media-url.js";
import { getPublishedIeCommodityBySlug, getPublishedIeCommodityFromApi, mapApiCommodityToIeCommodity } from "../integrated-export/commodities/index.js";
import {
  createAndMaybeSubmit,
  getProcurementRequest,
  listProcurementRequests,
  ProcurementApiError,
  requireProcurementToken,
} from "./procurement-api.js";
import {
  clearWizardDraft,
  loadWizardDraft,
  saveWizardDraft,
} from "./procurement-store.js";

function toCatalogOption(product: {
  slug: string;
  name: string;
  description: string | null;
  category: { name: string } | null;
  brandName: string | null;
  manufacturerName: string | null;
  images: Array<{ url: string; altText: string | null; position?: number }>;
}): CatalogProductOption {
  const primary =
    product.images.find((image) => image.position === 0 && image.url.trim().length > 0) ??
    product.images.find((image) => image.url.trim().length > 0);
  const imageSrc = resolveMediaUrl(primary?.url);
  const manufacturer = product.manufacturerName ?? product.brandName ?? undefined;
  return {
    id: product.slug,
    name: product.name,
    category: product.category?.name ?? "Other",
    unit: "pcs",
    ...(product.description ? { description: product.description } : {}),
    ...(manufacturer ? { manufacturer } : {}),
    ...(imageSrc ? { imageSrc } : {}),
    imageAlt: primary?.altText?.trim() || product.name,
  };
}
export function ProcurementCreatePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { push: pushToast } = useToast();
  const [params] = useSearchParams();
  const duplicateId = params.get("duplicate");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(duplicateId));
  const [duplicateFrom, setDuplicateFrom] = useState<
    ProcurementRequestRecord | undefined
  >();
  const [recent, setRecent] = useState<ProcurementRequestRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<
    CatalogProductOption[] | undefined
  >();
  const [catalogCategories, setCatalogCategories] = useState<
    string[] | undefined
  >();
  const ieCommoditySlug = params.get("ieCommodity");
  const [ieCommodity, setIeCommodity] = useState(() =>
    ieCommoditySlug ? getPublishedIeCommodityBySlug(ieCommoditySlug) : null,
  );

  useEffect(() => {
    if (!ieCommoditySlug) {
      setIeCommodity(null);
      return;
    }
    void getPublishedIeCommodityFromApi(ieCommoditySlug)
      .then((row) => {
        setIeCommodity(mapApiCommodityToIeCommodity(row));
      })
      .catch(() => {
        /* keep static fallback */
      });
  }, [ieCommoditySlug]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      const [rows, categoriesResult] = await Promise.all([
        listProcurementRequests(token, { pageSize: 5 }),
        listPublicCategories({ page: 1, pageSize: 200 }).catch(() => null),
      ]);
      setRecent(rows.slice(0, 5));
      const productsResult = await listPublicProducts({
        page: 1,
        pageSize: 24,
        sort: "name",
      }).catch(() => null);
      setCatalogProducts((productsResult?.data ?? []).map(toCatalogOption));
      if (categoriesResult?.data.length) {
        setCatalogCategories(
          categoriesResult.data.map((category) => category.name),
        );
      }
      if (duplicateId) {
        setDuplicateFrom(await getProcurementRequest(token, duplicateId));
      }
      const productParam = params.get("product");
      if (productParam) {
        const detail = await getPublicProduct(productParam).catch(() => null);
        if (detail) {
          setCatalogProducts((prev) => {
            const mapped = toCatalogOption(detail);
            const rest = (prev ?? []).filter((item) => item.id !== mapped.id);
            return [mapped, ...rest];
          });
        }
      }
    } catch (err) {
      setError(
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to load procurement data.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, duplicateId, params]);

  useEffect(() => {
    void load();
  }, [load]);

  const productSlug = params.get("product");
  const productVariant = params.get("variant")?.trim() || null;
  const initial = useMemo(() => {
    if (duplicateFrom) return undefined;
    const fromDraft = loadWizardDraft<Partial<RequestWizardDraft>>() ?? undefined;
    const last = recent[0];
    const preference = {
      destinationAddress:
        fromDraft?.destinationAddress?.trim() ||
        last?.destinationAddress ||
        "",
      destinationCountryCode:
        fromDraft?.destinationCountryCode ||
        last?.destinationCountryCode ||
        "NG",
    };
    const commodity = ieCommodity;
    const catalogHit = productSlug
      ? catalogProducts?.find((item) => item.id === productSlug)
      : null;
    if (catalogHit) {
      return {
        ...fromDraft,
        ...preference,
        title: fromDraft?.title?.trim() ? fromDraft.title : catalogHit.name,
        items:
          fromDraft?.items && fromDraft.items.length > 0
            ? fromDraft.items
            : [
                {
                  id: `prod-${catalogHit.id}`,
                  description: productVariant
                    ? `${catalogHit.name} — ${productVariant}`
                    : catalogHit.name,
                  quantity: 1,
                  unit: catalogHit.unit ?? "pcs",
                  category: catalogHit.category,
                  specifications: [
                    productVariant ? `Selected variant: ${productVariant}` : "",
                    catalogHit.description ?? "",
                  ]
                    .filter(Boolean)
                    .join("\n"),
                },
              ],
      };
    }
    if (!commodity) return { ...fromDraft, ...preference };
    return {
      ...fromDraft,
      ...preference,
      title: fromDraft?.title?.trim()
        ? fromDraft.title
        : `${commodity.name} procurement request`,
      items:
        fromDraft?.items && fromDraft.items.length > 0
          ? fromDraft.items
          : [
              {
                id: `ie-${commodity.slug}`,
                description: commodity.name,
                quantity: 1,
                unit: "mt",
                category: commodity.category ?? "Integrated Export",
                specifications: "",
              },
            ],
    };
  }, [
    catalogProducts,
    duplicateFrom,
    ieCommodity,
    productSlug,
    productVariant,
    recent,
  ]);

  const persist = async (payload: RequestWizardSubmitPayload) => {
    setError(null);
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      const record = await createAndMaybeSubmit(token, payload);
      clearWizardDraft();
      if (payload.submit) {
        pushToast({
          title: `${record.publicCode} submitted.`,
          tone: "success",
        });
        navigate(`/app/requests/${record.id}`);
      } else {
        navigate(`/app/requests?focus=${record.id}`, {
          state: { flash: "Request created." },
        });
      }
    } catch (err) {
      setError(
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to save procurement request.",
      );
      throw err;
    }
  };

  return (
    <HostPage className="hamd-web-procurement">
      {error ? <HostAlert>{error}</HostAlert> : null}
      {loading ? <HostLoading label="Loading…" /> : null}
      {!loading ? (
        <>
          <RequestCoach
            actions={[
              {
                id: "missing",
                label: "Guide me through this request",
                run: async () => {
                  const token =
                    getAccessToken() ?? (await auth.ensureSession());
                  if (!token) throw new Error("Sign in required.");
                  const draft =
                    loadWizardDraft<Partial<RequestWizardDraft>>() ?? {};
                  return guideRequestDraft(token, {
                    mode: "assist",
                    focus: "missing_information",
                    draft: {
                      title: draft.title,
                      description: draft.notes,
                      currencyCode: draft.currencyCode,
                      destinationCountry: draft.destinationCountryCode,
                      budgetAmount: draft.budgetAmount,
                      priority: draft.priority,
                      items: draft.items,
                    },
                  });
                },
              },
              {
                id: "suppliers",
                label: "Help me choose a product",
                run: async () => {
                  const token =
                    getAccessToken() ?? (await auth.ensureSession());
                  if (!token) throw new Error("Sign in required.");
                  const draft =
                    loadWizardDraft<Partial<RequestWizardDraft>>() ?? {};
                  return guideRequestDraft(token, {
                    mode: "recommend",
                    focus: "suppliers",
                    draft: {
                      title: draft.title,
                      description: draft.notes,
                      items: draft.items,
                    },
                  });
                },
              },
              {
                id: "quantities",
                label: "Explain this step",
                run: async () => {
                  const token =
                    getAccessToken() ?? (await auth.ensureSession());
                  if (!token) throw new Error("Sign in required.");
                  const draft =
                    loadWizardDraft<Partial<RequestWizardDraft>>() ?? {};
                  return guideRequestDraft(token, {
                    mode: "assist",
                    focus: "quantities",
                    draft: {
                      title: draft.title,
                      items: draft.items,
                    },
                  });
                },
              },
              {
                id: "descriptions",
                label: "Review my information",
                run: async () => {
                  const token =
                    getAccessToken() ?? (await auth.ensureSession());
                  if (!token) throw new Error("Sign in required.");
                  const draft =
                    loadWizardDraft<Partial<RequestWizardDraft>>() ?? {};
                  return guideRequestDraft(token, {
                    mode: "assist",
                    focus: "descriptions",
                    draft: {
                      title: draft.title,
                      description: draft.notes,
                      items: draft.items,
                    },
                  });
                },
              },
            ]}
          />
          <RequestCreateWizard
            {...(initial ? { initial } : {})}
            {...(duplicateFrom ? { duplicateFrom } : {})}
            catalogProducts={catalogProducts ?? []}
            {...(catalogCategories?.length
              ? { categories: catalogCategories }
              : {})}
            onCatalogSearch={async (query) => {
              const result = await listPublicProducts({
                q: query || undefined,
                page: 1,
                pageSize: 24,
                sort: "name",
              });
              return result.data.map(toCatalogOption);
            }}
            onAutosave={async (draft) => {
              saveWizardDraft(draft);
            }}
            onSaveDraft={async (payload) => {
              await persist(payload);
            }}
            onSubmit={async (payload) => {
              await persist(payload);
            }}
            onCancel={() => navigate("/app/requests")}
            onNotify={(toast) =>
              pushToast({
                title: toast.title,
                ...(toast.description ? { description: toast.description } : {}),
                tone: toast.tone,
                durationMs: toast.tone === "warning" ? 8000 : 5200,
              })
            }
          />
        </>
      ) : null}
    </HostPage>
  );
}
