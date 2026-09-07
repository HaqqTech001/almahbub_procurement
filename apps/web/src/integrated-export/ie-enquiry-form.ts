/** Build a mailto URL for the verified Group contact channel - not a persisted enquiry. */

export type IeEnquiryFormValues = {
  companyName: string;
  email: string;
  phone: string;
  commodity: string;
  quantity: string;
  unit: string;
  destination: string;
  packaging: string;
  specification: string;
  deliveryWindow: string;
  additional: string;
};

export type IeEnquiryFormErrors = Partial<
  Record<keyof IeEnquiryFormValues, string>
>;

export const IE_ENQUIRY_EMPTY: IeEnquiryFormValues = {
  companyName: "",
  email: "",
  phone: "",
  commodity: "",
  quantity: "",
  unit: "",
  destination: "",
  packaging: "",
  specification: "",
  deliveryWindow: "",
  additional: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SHORT = 200;
const MAX_LONG = 2000;

function trim(value: string): string {
  return value.trim();
}

export function validateIeEnquiry(
  values: IeEnquiryFormValues,
): IeEnquiryFormErrors {
  const errors: IeEnquiryFormErrors = {};
  const companyName = trim(values.companyName);
  const email = trim(values.email);
  const commodity = trim(values.commodity);

  if (!companyName) {
    errors.companyName = "Enter your company or buyer name.";
  } else if (companyName.length > MAX_SHORT) {
    errors.companyName = `Use ${MAX_SHORT} characters or fewer.`;
  }

  if (!email) {
    errors.email = "Enter a business email address.";
  } else if (!EMAIL_RE.test(email) || email.length > MAX_SHORT) {
    errors.email = "Enter a valid email address.";
  }

  if (!commodity) {
    errors.commodity = "Describe the commodity or requirement.";
  } else if (commodity.length > MAX_LONG) {
    errors.commodity = `Use ${MAX_LONG} characters or fewer.`;
  }

  const optionalShort: (keyof IeEnquiryFormValues)[] = [
    "phone",
    "quantity",
    "unit",
    "destination",
    "packaging",
    "deliveryWindow",
  ];
  for (const key of optionalShort) {
    const value = trim(values[key]);
    if (value.length > MAX_SHORT) {
      errors[key] = `Use ${MAX_SHORT} characters or fewer.`;
    }
  }

  for (const key of ["specification", "additional"] as const) {
    const value = trim(values[key]);
    if (value.length > MAX_LONG) {
      errors[key] = `Use ${MAX_LONG} characters or fewer.`;
    }
  }

  return errors;
}

/** Build a mailto URL for the verified Group contact channel - not a persisted enquiry. */
export function buildIeEnquiryMailto(
  toEmail: string,
  values: IeEnquiryFormValues,
): string {
  const lines = [
    "Integrated Export enquiry",
    "",
    `Company / buyer: ${trim(values.companyName)}`,
    `Email: ${trim(values.email)}`,
    trim(values.phone) ? `Phone / WhatsApp: ${trim(values.phone)}` : null,
    "",
    `Commodity / requirement: ${trim(values.commodity)}`,
    trim(values.quantity) ? `Quantity: ${trim(values.quantity)}` : null,
    trim(values.unit) ? `Unit: ${trim(values.unit)}` : null,
    trim(values.destination) ? `Destination: ${trim(values.destination)}` : null,
    trim(values.packaging) ? `Packaging: ${trim(values.packaging)}` : null,
    "",
    trim(values.specification)
      ? `Specification:\n${trim(values.specification)}`
      : null,
    trim(values.deliveryWindow)
      ? `Delivery window: ${trim(values.deliveryWindow)}`
      : null,
    trim(values.additional)
      ? `Additional requirements:\n${trim(values.additional)}`
      : null,
  ].filter((line): line is string => line !== null);

  const subject = "Integrated Export quote enquiry";
  return `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export type IeProcurementCreateBody = {
  title: string;
  lob: "integrated_export";
  notes: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
  }>;
  destinationAddress?: string;
};

/**
 * Map the IE enquiry form onto ProcurementRequest create (IE-10 LOB).
 * Does not invent ISO country codes, prices, or commodity catalogue records.
 */
export function buildIeProcurementCreateBody(
  values: IeEnquiryFormValues,
): IeProcurementCreateBody {
  const commodity = trim(values.commodity);
  const quantityRaw = trim(values.quantity);
  const parsedQty = Number.parseFloat(quantityRaw.replace(/,/g, ""));
  const quantity =
    Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;
  const unit = trim(values.unit).slice(0, 32) || "lot";
  const destination = trim(values.destination);
  const notes = [
    `Company / buyer: ${trim(values.companyName)}`,
    `Email: ${trim(values.email)}`,
    trim(values.phone) ? `Phone / WhatsApp: ${trim(values.phone)}` : null,
    trim(values.packaging) ? `Packaging: ${trim(values.packaging)}` : null,
    trim(values.specification)
      ? `Specification:\n${trim(values.specification)}`
      : null,
    trim(values.deliveryWindow)
      ? `Delivery window: ${trim(values.deliveryWindow)}`
      : null,
    trim(values.additional)
      ? `Additional requirements:\n${trim(values.additional)}`
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const title = `IE enquiry: ${commodity}`.slice(0, 200);
  const body: IeProcurementCreateBody = {
    title: title.length >= 3 ? title : "IE enquiry",
    lob: "integrated_export",
    notes,
    items: [
      {
        id: "ie-line-1",
        description: commodity,
        quantity,
        unit,
      },
    ],
  };
  if (destination.length >= 5) {
    body.destinationAddress = destination.slice(0, 1000);
  }
  return body;
}
