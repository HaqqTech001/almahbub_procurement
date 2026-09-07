import { useId, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import {
  Button,
  ButtonLink,
  Container,
  Field,
  TextArea,
  TextInput,
} from "../../components/index.js";
import { INTEGRATED_EXPORT_PORTAL } from "../../content/group.js";
import { SITE } from "../../content/site.js";
import { useOptionalAuth } from "../../auth/session/AuthProvider.js";
import { getPublishedIeCommodityBySlug } from "../commodities/index.js";
import {
  buildIeEnquiryMailto,
  buildIeProcurementCreateBody,
  IE_ENQUIRY_EMPTY,
  validateIeEnquiry,
  type IeEnquiryFormErrors,
  type IeEnquiryFormValues,
} from "../ie-enquiry-form.js";
import { IE_PATHS } from "../ie-paths.js";
import {
  createProcurementRequest,
  ProcurementApiError,
} from "../../procurement/procurement-api.js";
import { getAccessToken } from "../../auth/session/token-store.js";

/**
 * IE request - authenticated create with lob=integrated_export.
 * Anonymous visitors must sign in (V1 also required auth to create).
 * Mailto is a contact fallback only, not a stored request.
 */
export function IeRequestPage() {
  const page = INTEGRATED_EXPORT_PORTAL.requestPage;
  const formId = useId();
  const location = useLocation();
  const auth = useOptionalAuth();
  const [params] = useSearchParams();
  const commoditySlug = (params.get("commodity") ?? "").trim();
  const publishedCommodity = useMemo(
    () =>
      commoditySlug ? getPublishedIeCommodityBySlug(commoditySlug) : null,
    [commoditySlug],
  );
  const loginHref = `/login?returnTo=${encodeURIComponent(
    `${location.pathname}${location.search}`,
  )}`;

  const [values, setValues] = useState<IeEnquiryFormValues>(() => ({
    ...IE_ENQUIRY_EMPTY,
    commodity: publishedCommodity?.name ?? "",
  }));
  const [errors, setErrors] = useState<IeEnquiryFormErrors>({});
  const [mailtoHref, setMailtoHref] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    id: string;
    publicCode: string;
  } | null>(null);

  function updateField<K extends keyof IeEnquiryFormValues>(
    key: K,
    value: IeEnquiryFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setMailtoHref(null);
    setCreated(null);
    setSubmitError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateIeEnquiry(values);
    setErrors(nextErrors);
    setCreated(null);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) {
      setMailtoHref(null);
      return;
    }
    setMailtoHref(buildIeEnquiryMailto(SITE.contactEmail, values));

    const token = getAccessToken() ?? (await auth?.ensureSession());
    if (!token) {
      return;
    }

    setSubmitting(true);
    try {
      const record = await createProcurementRequest(token, {
        ...buildIeProcurementCreateBody(values),
        rowVersion: 0,
      });
      setCreated({ id: record.id, publicCode: record.publicCode });
    } catch (err) {
      setSubmitError(
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to store this Integrated Export enquiry.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const signedIn = auth?.status === "authenticated";

  return (
    <div className="hamd-aie-request">
      <section className="hamd-aie-request__hero" aria-labelledby="aie-request-hero-title">
        <Container>
          <p className="hamd-aie-request__eyebrow">Enquiry</p>
          <h1 id="aie-request-hero-title" className="hamd-aie-request__title">
            {page.heroTitle}
          </h1>
          <p className="hamd-aie-request__lead">{page.heroLead}</p>
          {publishedCommodity ? (
            <p className="hamd-aie-request__context" role="status">
              {page.requestingLabel}: <strong>{publishedCommodity.name}</strong>
            </p>
          ) : null}
          <div className="hamd-aie-request__actions">
            <ButtonLink href={IE_PATHS.commodities} variant="secondary">
              Browse Commodities
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-request__section"
        aria-labelledby="aie-request-form-title"
      >
        <Container>
          <div className="hamd-aie-request__layout">
            <div>
              <h2 id="aie-request-form-title" className="hamd-aie-request__section-title">
                Your requirement
              </h2>
              <form
                className="hamd-aie-request__form"
                onSubmit={(event) => void onSubmit(event)}
                noValidate
              >
                <fieldset className="hamd-aie-request__fieldset">
                  <legend className="hamd-aie-request__legend">Your details</legend>
                  <div className="hamd-aie-request__fields">
                    <Field
                      label="Company / buyer name"
                      htmlFor={`${formId}-company`}
                      error={errors.companyName}
                    >
                      <TextInput
                        id={`${formId}-company`}
                        name="companyName"
                        autoComplete="organization"
                        required
                        value={values.companyName}
                        invalid={Boolean(errors.companyName)}
                        onChange={(event) =>
                          updateField("companyName", event.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Business email"
                      htmlFor={`${formId}-email`}
                      error={errors.email}
                    >
                      <TextInput
                        id={`${formId}-email`}
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        value={values.email}
                        invalid={Boolean(errors.email)}
                        onChange={(event) => updateField("email", event.target.value)}
                      />
                    </Field>
                    <Field
                      label="Phone / WhatsApp"
                      htmlFor={`${formId}-phone`}
                      hint="Optional"
                      error={errors.phone}
                    >
                      <TextInput
                        id={`${formId}-phone`}
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={values.phone}
                        invalid={Boolean(errors.phone)}
                        onChange={(event) => updateField("phone", event.target.value)}
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className="hamd-aie-request__fieldset">
                  <legend className="hamd-aie-request__legend">Requirement</legend>
                  <div className="hamd-aie-request__fields">
                    <Field
                      label="Commodity / requirement"
                      htmlFor={`${formId}-commodity`}
                      hint={
                        publishedCommodity
                          ? "Prefilled from a published commodity record when available."
                          : "Describe the commodity or requirement. You can also open a published catalogue page and use Request a Quote from there."
                      }
                      error={errors.commodity}
                    >
                      <TextInput
                        id={`${formId}-commodity`}
                        name="commodity"
                        required
                        value={values.commodity}
                        invalid={Boolean(errors.commodity)}
                        onChange={(event) =>
                          updateField("commodity", event.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Quantity"
                      htmlFor={`${formId}-quantity`}
                      hint="Optional"
                      error={errors.quantity}
                    >
                      <TextInput
                        id={`${formId}-quantity`}
                        name="quantity"
                        value={values.quantity}
                        invalid={Boolean(errors.quantity)}
                        onChange={(event) =>
                          updateField("quantity", event.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Unit"
                      htmlFor={`${formId}-unit`}
                      hint="Optional - for example MT, kg, or containers"
                      error={errors.unit}
                    >
                      <TextInput
                        id={`${formId}-unit`}
                        name="unit"
                        value={values.unit}
                        invalid={Boolean(errors.unit)}
                        onChange={(event) => updateField("unit", event.target.value)}
                      />
                    </Field>
                    <Field
                      label="Destination country"
                      htmlFor={`${formId}-destination`}
                      hint="Optional - free text, not a published country list"
                      error={errors.destination}
                    >
                      <TextInput
                        id={`${formId}-destination`}
                        name="destination"
                        autoComplete="country-name"
                        value={values.destination}
                        invalid={Boolean(errors.destination)}
                        onChange={(event) =>
                          updateField("destination", event.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Packaging preference"
                      htmlFor={`${formId}-packaging`}
                      hint="Optional"
                      error={errors.packaging}
                    >
                      <TextInput
                        id={`${formId}-packaging`}
                        name="packaging"
                        value={values.packaging}
                        invalid={Boolean(errors.packaging)}
                        onChange={(event) =>
                          updateField("packaging", event.target.value)
                        }
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className="hamd-aie-request__fieldset">
                  <legend className="hamd-aie-request__legend">Specification</legend>
                  <div className="hamd-aie-request__fields hamd-aie-request__fields--stack">
                    <Field
                      label="Required specification"
                      htmlFor={`${formId}-specification`}
                      hint="Optional"
                      error={errors.specification}
                    >
                      <TextArea
                        id={`${formId}-specification`}
                        name="specification"
                        rows={4}
                        value={values.specification}
                        invalid={Boolean(errors.specification)}
                        onChange={(event) =>
                          updateField("specification", event.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Target delivery window"
                      htmlFor={`${formId}-delivery`}
                      hint="Optional"
                      error={errors.deliveryWindow}
                    >
                      <TextInput
                        id={`${formId}-delivery`}
                        name="deliveryWindow"
                        value={values.deliveryWindow}
                        invalid={Boolean(errors.deliveryWindow)}
                        onChange={(event) =>
                          updateField("deliveryWindow", event.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Additional requirements"
                      htmlFor={`${formId}-additional`}
                      hint="Optional"
                      error={errors.additional}
                    >
                      <TextArea
                        id={`${formId}-additional`}
                        name="additional"
                        rows={4}
                        value={values.additional}
                        invalid={Boolean(errors.additional)}
                        onChange={(event) =>
                          updateField("additional", event.target.value)
                        }
                      />
                    </Field>
                  </div>
                </fieldset>

                <p className="hamd-aie-request__note">{page.attachmentNote}</p>

                <div className="hamd-aie-request__actions">
                  <Button
                    type="submit"
                    className="hamd-aie-portal__cta"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : page.submitLabel}
                  </Button>
                </div>
              </form>

              {submitError ? (
                <p className="hamd-aie-request__copy" role="alert">
                  {submitError}
                </p>
              ) : null}

              {created ? (
                <div
                  className="hamd-aie-request__interim"
                  role="status"
                  aria-live="polite"
                >
                  <h3 className="hamd-aie-request__interim-title">
                    {page.submittedTitle}
                  </h3>
                  <p className="hamd-aie-request__copy">{page.submittedBody}</p>
                  <p className="hamd-aie-request__copy">
                    Reference {created.publicCode}
                  </p>
                  <div className="hamd-aie-request__actions">
                    <Link
                      className="hamd-btn hamd-btn--primary"
                      to={`/app/requests/${created.id}`}
                    >
                      {page.submittedCtaLabel}
                    </Link>
                  </div>
                </div>
              ) : null}

              {mailtoHref && !created ? (
                <div
                  className="hamd-aie-request__interim"
                  role="status"
                  aria-live="polite"
                >
                  <h3 className="hamd-aie-request__interim-title">
                    {signedIn ? page.interimTitle : page.signedOutTitle}
                  </h3>
                  <p className="hamd-aie-request__copy">
                    {signedIn ? page.interimBody : page.signedOutBody}
                  </p>
                  <div className="hamd-aie-request__actions">
                    {!signedIn ? (
                      <Link className="hamd-btn hamd-btn--primary" to={loginHref}>
                        {page.signedOutLoginLabel}
                      </Link>
                    ) : null}
                    <a className="hamd-btn hamd-btn--secondary" href={mailtoHref}>
                      {page.interimMailtoLabel}
                    </a>
                    <ButtonLink href={IE_PATHS.contact} variant="secondary">
                      Contact
                    </ButtonLink>
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="hamd-aie-request__aside">
              <h2 className="hamd-aie-request__section-title">{page.guidanceTitle}</h2>
              <p className="hamd-aie-request__copy">{page.guidance}</p>
              <h2 className="hamd-aie-request__section-title">{page.nextTitle}</h2>
              <p className="hamd-aie-request__copy">{page.nextNote}</p>
              <ol className="hamd-aie-request__next" aria-label="What happens next">
                {page.nextSteps.map((step, index) => (
                  <li key={step.title} className="hamd-aie-request__next-card">
                    <span className="hamd-aie-request__next-num" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="hamd-aie-request__next-title">{step.title}</h3>
                    <p className="hamd-aie-request__next-copy">{step.description}</p>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-request__section hamd-aie-request__section--cta"
        aria-labelledby="aie-request-alt-title"
      >
        <Container width="narrow">
          <h2 id="aie-request-alt-title" className="hamd-aie-request__section-title">
            {page.contactAltTitle}
          </h2>
          <p className="hamd-aie-request__copy">{page.contactAltBody}</p>
          <div className="hamd-aie-request__actions">
            <ButtonLink href={IE_PATHS.contact} variant="secondary">
              Contact
            </ButtonLink>
            <ButtonLink href={IE_PATHS.commodities} variant="secondary">
              Browse Commodities
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
