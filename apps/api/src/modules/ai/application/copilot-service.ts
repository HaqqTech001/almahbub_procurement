import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import type {
  OrderAdviseInput,
  ProductAdviseInput,
  QuotationCompareInput,
  QuotationExplainInput,
  RequestDraftGuidanceInput,
  RequestGuidanceInput,
} from "../api/copilot-schemas.js";
import type { LlmProvider } from "../providers/llm-provider.js";
import { LlmProviderError } from "../providers/llm-provider.js";
import {
  assertAiUse,
  assertAuthenticated,
  requireConfiguredProvider,
} from "./copilot-policy.js";
import {
  buildSystemPrompt,
  parseCopilotJson,
  responseJsonSchemaHint,
  type CopilotCitation,
  type CopilotResponse,
} from "./copilot-prompts.js";

function notFound(message: string): AppError {
  return new AppError({ statusCode: 404, code: "NOT_FOUND", message });
}

function decimal(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return String(value);
  }
  return String(value);
}

/**
 * Workflow-embedded AI Procurement Copilot - grounded in live domain records.
 */
export class CopilotService {
  public constructor(
    private readonly database: DatabaseClient,
    private readonly provider: LlmProvider | null,
  ) {}

  public status() {
    return {
      configured: Boolean(this.provider),
      provider: this.provider?.id ?? null,
      model: this.provider?.model ?? null,
      workflows: ["product", "request", "quotation", "order"] as const,
    };
  }

  public async adviseProduct(
    context: AuthContext | undefined,
    input: ProductAdviseInput,
  ): Promise<CopilotResponse> {
    const auth = assertAuthenticated(context);
    assertAiUse(auth);
    const provider = requireConfiguredProvider(this.provider);

    const focusProduct = await this.resolveProduct(input);
    const catalog = await this.database.product.findMany({
      where: { status: "published" },
      take: 24,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        manufacturer: { select: { legalName: true, countryCode: true } },
        variants: {
          take: 5,
          select: { id: true, name: true, sku: true, specifications: true },
        },
      },
    });

    const suppliers = await this.database.supplier.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        legalName: true,
        countryCode: true,
        status: true,
      },
    });

    const citations: CopilotCitation[] = [
      {
        id: focusProduct.id,
        label: focusProduct.name,
        kind: "product",
        ...(focusProduct.slug ? { href: `/product/${focusProduct.slug}` } : {}),
      },
      ...catalog.slice(0, 8).map((row) => ({
        id: row.id,
        label: row.name,
        kind: "catalog_product" as const,
        href: `/product/${row.slug}`,
      })),
      ...suppliers.slice(0, 5).map((row) => ({
        id: row.id,
        label: row.legalName,
        kind: "supplier" as const,
      })),
    ];

    const userPrompt = [
      `Workflow: product`,
      `Focus: ${input.focus}`,
      `Mode: ${input.mode}`,
      input.question ? `Buyer question: ${input.question}` : "",
      `Tasks: recommend alternatives, explain the product, answer specifications.`,
      responseJsonSchemaHint("product"),
      `structured should include: alternatives[{id,name,reason}], specificationAnswers[{question,answer}], explanation.`,
      `Focus product JSON:\n${JSON.stringify(focusProduct)}`,
      `Catalog candidates JSON:\n${JSON.stringify(
        catalog.map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          category: row.category?.name,
          manufacturer: row.manufacturer?.legalName,
          variants: row.variants,
        })),
      )}`,
      `Suppliers JSON:\n${JSON.stringify(suppliers)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return this.complete({
      workflow: "product",
      mode: input.mode,
      provider,
      citations,
      userPrompt,
    });
  }

  public async guideRequest(
    context: AuthContext | undefined,
    requestId: string,
    input: RequestGuidanceInput,
  ): Promise<CopilotResponse> {
    const auth = assertAuthenticated(context);
    assertAiUse(auth);
    const provider = requireConfiguredProvider(this.provider);

    const request = await this.database.procurementRequest.findFirst({
      where: { id: requestId, organizationId: auth.organizationId },
      include: {
        items: true,
        quotations: {
          take: 5,
          select: {
            id: true,
            publicCode: true,
            status: true,
            totalAmount: true,
            currencyCode: true,
          },
        },
      },
    });
    if (!request) throw notFound("Procurement request not found.");

    const suppliers = await this.database.supplier.findMany({
      take: 25,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        legalName: true,
        countryCode: true,
        status: true,
      },
    });

    const citations: CopilotCitation[] = [
      {
        id: request.id,
        label: request.publicCode,
        kind: "procurement_request",
        href: `/app/requests`,
      },
      ...suppliers.slice(0, 8).map((row) => ({
        id: row.id,
        label: row.legalName,
        kind: "supplier" as const,
      })),
    ];

    const userPrompt = [
      `Workflow: procurement_request`,
      `Focus: ${input.focus}`,
      `Mode: ${input.mode}`,
      input.question ? `Buyer question: ${input.question}` : "",
      `Tasks: detect missing information, recommend suppliers, suggest quantities, improve descriptions.`,
      responseJsonSchemaHint("request"),
      `structured should include: missingFields[], supplierRecommendations[{id,name,reason}], quantitySuggestions[{itemIndex,suggestedQuantity,reason}], improvedDescriptions[{itemIndex,improved}].`,
      `Request JSON:\n${JSON.stringify({
        id: request.id,
        publicCode: request.publicCode,
        status: request.status,
        title: request.title,
        notes: request.notes,
        currencyCode: request.currencyCode,
        destinationCountryCode: request.destinationCountryCode,
        destinationAddress: request.destinationAddress,
        requiredByDate: request.requiredByDate?.toISOString() ?? null,
        budgetAmount: decimal(request.budgetAmount),
        priority: request.priority,
        items: request.items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: decimal(item.quantity),
          unit: item.unit,
        })),
        relatedQuotations: request.quotations.map((row) => ({
          ...row,
          totalAmount: decimal(row.totalAmount),
        })),
      })}`,
      `Supplier roster JSON:\n${JSON.stringify(suppliers)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return this.complete({
      workflow: "request",
      mode: input.mode,
      provider,
      citations,
      userPrompt,
    });
  }

  public async guideRequestDraft(
    context: AuthContext | undefined,
    input: RequestDraftGuidanceInput,
  ): Promise<CopilotResponse> {
    const auth = assertAuthenticated(context);
    assertAiUse(auth);
    const provider = requireConfiguredProvider(this.provider);

    const suppliers = await this.database.supplier.findMany({
      take: 25,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        legalName: true,
        countryCode: true,
        status: true,
      },
    });

    const citations: CopilotCitation[] = suppliers.slice(0, 8).map((row) => ({
      id: row.id,
      label: row.legalName,
      kind: "supplier",
    }));

    const userPrompt = [
      `Workflow: procurement_request_draft`,
      `Focus: ${input.focus}`,
      `Mode: ${input.mode}`,
      input.question ? `Buyer question: ${input.question}` : "",
      `Tasks: detect missing information, recommend suppliers, suggest quantities, improve descriptions for a draft RFQ.`,
      responseJsonSchemaHint("request"),
      `structured should include: missingFields[], supplierRecommendations[{id,name,reason}], quantitySuggestions[], improvedDescriptions[], improvedTitle, improvedDescription.`,
      `Draft JSON:\n${JSON.stringify(input.draft)}`,
      `Supplier roster JSON:\n${JSON.stringify(suppliers)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return this.complete({
      workflow: "request",
      mode: input.mode,
      provider,
      citations,
      userPrompt,
    });
  }

  public async explainQuotation(
    context: AuthContext | undefined,
    quotationId: string,
    input: QuotationExplainInput,
  ): Promise<CopilotResponse> {
    const auth = assertAuthenticated(context);
    assertAiUse(auth);
    const provider = requireConfiguredProvider(this.provider);
    const quotation = await this.loadQuotation(auth.organizationId, quotationId);

    const citations: CopilotCitation[] = [
      {
        id: quotation.id,
        label: quotation.publicCode,
        kind: "quotation",
        href: `/app/quotations/${quotation.id}`,
      },
    ];
    if (quotation.supplier) {
      citations.push({
        id: quotation.supplier.id,
        label: quotation.supplier.legalName,
        kind: "supplier",
      });
    }

    const userPrompt = [
      `Workflow: quotation_explain`,
      `Mode: ${input.mode}`,
      input.question ? `Buyer question: ${input.question}` : "",
      `Tasks: summarize the quotation, explain pricing components, highlight commercial risks.`,
      responseJsonSchemaHint("quotation"),
      `structured should include: summary, pricingBreakdown[{label,amount}], risks[], pricingDrivers[].`,
      `Quotation JSON:\n${JSON.stringify(quotation)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return this.complete({
      workflow: "quotation",
      mode: input.mode,
      provider,
      citations,
      userPrompt,
    });
  }

  public async compareQuotations(
    context: AuthContext | undefined,
    input: QuotationCompareInput,
  ): Promise<CopilotResponse> {
    const auth = assertAuthenticated(context);
    assertAiUse(auth);
    const provider = requireConfiguredProvider(this.provider);

    const quotations = [];
    for (const id of input.quotationIds) {
      quotations.push(await this.loadQuotation(auth.organizationId, id));
    }

    const citations: CopilotCitation[] = quotations.map((row) => ({
      id: row.id,
      label: row.publicCode,
      kind: "quotation",
      href: `/app/quotations/${row.id}`,
    }));

    const userPrompt = [
      `Workflow: quotation_compare`,
      `Focus: ${input.focus}`,
      `Mode: recommend`,
      input.question ? `Buyer question: ${input.question}` : "",
      `Tasks: summarize each quotation, compare them, highlight risks, explain pricing differences. Do not auto-accept a quote.`,
      responseJsonSchemaHint("quotation"),
      `structured should include: insights[{quotationId,strengths[],risks[],summary,score?}], narrative, recommendationQuotationId (or null), pricingDifferences[].`,
      `Quotations JSON:\n${JSON.stringify(quotations)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return this.complete({
      workflow: "quotation",
      mode: "recommend",
      provider,
      citations,
      userPrompt,
    });
  }

  public async adviseOrder(
    context: AuthContext | undefined,
    input: OrderAdviseInput,
  ): Promise<CopilotResponse> {
    const auth = assertAuthenticated(context);
    assertAiUse(auth);
    const provider = requireConfiguredProvider(this.provider);

    const orderContext = await this.loadOrderContext(
      auth.organizationId,
      input,
    );

    const citations: CopilotCitation[] = [];
    if (orderContext.purchaseOrder) {
      citations.push({
        id: orderContext.purchaseOrder.id,
        label: orderContext.purchaseOrder.publicCode,
        kind: "purchase_order",
      });
    }
    for (const shipment of orderContext.shipments) {
      citations.push({
        id: shipment.id,
        label: shipment.publicCode,
        kind: "shipment",
        href: `/app/shipments/${shipment.id}`,
      });
    }

    const userPrompt = [
      `Workflow: order_fulfillment`,
      `Focus: ${input.focus}`,
      `Mode: ${input.mode}`,
      input.question ? `Buyer question: ${input.question}` : "",
      `Tasks: explain delays, estimate delivery based on milestones/ETA in context, suggest safe next actions. Never invent carrier events.`,
      responseJsonSchemaHint("order"),
      `structured should include: delayExplanation, deliveryEstimate, suggestedActions[], riskFlags[].`,
      `Order context JSON:\n${JSON.stringify(orderContext)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return this.complete({
      workflow: "order",
      mode: input.mode,
      provider,
      citations,
      userPrompt,
    });
  }

  private async complete(input: {
    workflow: CopilotResponse["workflow"];
    mode: CopilotResponse["mode"];
    provider: LlmProvider;
    citations: CopilotCitation[];
    userPrompt: string;
  }): Promise<CopilotResponse> {
    try {
      const completion = await input.provider.complete({
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: input.userPrompt },
        ],
        temperature: 0.2,
        maxTokens: 2_500,
        responseFormat: "json",
      });
      const parsed = parseCopilotJson(completion.content);
      return {
        workflow: input.workflow,
        mode: input.mode,
        answer: parsed.answer,
        confidence: parsed.confidence,
        citations: input.citations,
        assumptions: parsed.assumptions,
        missingData: parsed.missingData,
        nextActions: parsed.nextActions,
        structured: parsed.structured,
        provider: completion.provider,
        model: completion.model,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof LlmProviderError) {
        throw new AppError({
          statusCode: error.statusCode,
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }

  private async resolveProduct(input: ProductAdviseInput) {
    if (input.productId) {
      const row = await this.database.product.findUnique({
        where: { id: input.productId },
        include: {
          category: { select: { name: true, slug: true } },
          manufacturer: { select: { legalName: true, countryCode: true } },
          variants: {
            take: 10,
            select: { id: true, name: true, sku: true, specifications: true },
          },
        },
      });
      if (!row) throw notFound("Product not found.");
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        summary: row.description,
        category: row.category?.name,
        manufacturer: row.manufacturer?.legalName,
        country: row.manufacturer?.countryCode,
        variants: row.variants,
        source: "database",
      };
    }

    if (input.productSlug) {
      const row = await this.database.product.findUnique({
        where: { slug: input.productSlug },
        include: {
          category: { select: { name: true, slug: true } },
          manufacturer: { select: { legalName: true, countryCode: true } },
          variants: {
            take: 10,
            select: { id: true, name: true, sku: true, specifications: true },
          },
        },
      });
      if (row) {
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          summary: row.description,
          category: row.category?.name,
          manufacturer: row.manufacturer?.legalName,
          country: row.manufacturer?.countryCode,
          variants: row.variants,
          source: "database",
        };
      }
    }

    if (input.product) {
      return {
        id: `catalog:${input.product.slug}`,
        ...input.product,
        source: "catalog_snapshot",
      };
    }

    throw notFound("Product not found.");
  }

  private async loadQuotation(organizationId: string, quotationId: string) {
    const quotation = await this.database.quotation.findFirst({
      where: { id: quotationId, organizationId },
      include: {
        items: true,
        supplier: {
          select: { id: true, legalName: true, countryCode: true },
        },
        request: {
          select: {
            id: true,
            publicCode: true,
            title: true,
            status: true,
          },
        },
      },
    });
    if (!quotation) throw notFound("Quotation not found.");
    return {
      id: quotation.id,
      publicCode: quotation.publicCode,
      status: quotation.status,
      currencyCode: quotation.currencyCode,
      subtotalAmount: decimal(quotation.subtotalAmount),
      discountAmount: decimal(quotation.discountAmount),
      taxAmount: decimal(quotation.taxAmount),
      shippingAmount: decimal(quotation.shippingAmount),
      dutyAmount: decimal(quotation.dutyAmount),
      otherAmount: decimal(quotation.otherAmount),
      totalAmount: decimal(quotation.totalAmount),
      deliveryLeadTimeDays: quotation.deliveryLeadTimeDays,
      minimumOrderQuantity: decimal(quotation.minimumOrderQuantity),
      paymentTerms: quotation.paymentTerms,
      commercialTerms: quotation.commercialTerms,
      expiresAt: quotation.expiresAt?.toISOString() ?? null,
      supplier: quotation.supplier,
      request: quotation.request,
      items: quotation.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: decimal(item.quantity),
        unitAmount: decimal(item.unitAmount),
        lineAmount: decimal(item.lineAmount),
      })),
    };
  }

  private async loadOrderContext(
    organizationId: string,
    input: OrderAdviseInput,
  ) {
    let purchaseOrder = null as null | {
      id: string;
      publicCode: string;
      status: string;
      currencyCode: string;
      totalAmount: string | null;
      supplier: { id: string; legalName: string } | null;
      quotation: {
        id: string;
        publicCode: string;
        deliveryLeadTimeDays: number | null;
      } | null;
    };

    if (input.purchaseOrderId) {
      const row = await this.database.purchaseOrder.findFirst({
        where: { id: input.purchaseOrderId, organizationId },
        include: {
          supplier: { select: { id: true, legalName: true } },
          quotation: {
            select: {
              id: true,
              publicCode: true,
              deliveryLeadTimeDays: true,
            },
          },
        },
      });
      if (!row) throw notFound("Purchase order not found.");
      purchaseOrder = {
        id: row.id,
        publicCode: row.publicCode,
        status: row.status,
        currencyCode: row.currencyCode,
        totalAmount: decimal(row.totalAmount),
        supplier: row.supplier,
        quotation: row.quotation,
      };
    }

    const shipmentWhere = input.shipmentId
      ? { id: input.shipmentId, organizationId }
      : purchaseOrder
        ? { organizationId, purchaseOrderId: purchaseOrder.id }
        : null;

    if (!shipmentWhere) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Provide purchaseOrderId and/or shipmentId.",
      });
    }

    const shipments = await this.database.shipment.findMany({
      where: shipmentWhere,
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        milestones: {
          orderBy: { occurredAt: "asc" },
          take: 30,
        },
        containers: { take: 10 },
      },
    });

    if (input.shipmentId && shipments.length === 0) {
      throw notFound("Shipment not found.");
    }

    if (!purchaseOrder && shipments[0]?.purchaseOrderId) {
      const row = await this.database.purchaseOrder.findFirst({
        where: {
          id: shipments[0].purchaseOrderId,
          organizationId,
        },
        include: {
          supplier: { select: { id: true, legalName: true } },
          quotation: {
            select: {
              id: true,
              publicCode: true,
              deliveryLeadTimeDays: true,
            },
          },
        },
      });
      if (row) {
        purchaseOrder = {
          id: row.id,
          publicCode: row.publicCode,
          status: row.status,
          currencyCode: row.currencyCode,
          totalAmount: decimal(row.totalAmount),
          supplier: row.supplier,
          quotation: row.quotation,
        };
      }
    }

    return {
      purchaseOrder,
      shipments: shipments.map((shipment) => ({
        id: shipment.id,
        publicCode: shipment.publicCode,
        status: shipment.status,
        carrierName: shipment.carrierName,
        trackingNumber: shipment.trackingNumber,
        transportMode: shipment.transportMode,
        estimatedArrivalAt:
          shipment.estimatedArrivalAt?.toISOString() ?? null,
        actualDeliveryAt: shipment.actualDeliveryAt?.toISOString() ?? null,
        milestones: shipment.milestones.map((milestone) => ({
          id: milestone.id,
          type: milestone.type,
          confidence: milestone.confidence,
          occurredAt: milestone.occurredAt?.toISOString() ?? null,
          estimatedAt: milestone.estimatedAt?.toISOString() ?? null,
          location: milestone.location,
        })),
        containers: shipment.containers.map((container) => ({
          id: container.id,
          containerNumber: container.containerNumber,
          containerType: container.containerType,
        })),
      })),
    };
  }
}
