import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Button,
  ButtonLink,
  Field,
  Section,
  Select,
  SuccessState,
  TextArea,
  TextInput,
} from "../components/index.js";
import { PageHero } from "../components/PageHero.js";
import { useToast } from "../app/providers/ToastProvider.js";
import { contactContent } from "../content/pages.js";
import { SITE } from "../content/site.js";
import { applyPageSeo } from "../lib/seo.js";
import { browserApiBase } from "../lib/api-origin.js";

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  inquiryType: string;
  subject: string;
  message: string;
};

function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function mapEmbedUrl(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

/**
 * Contact intake - posts to marketing contact API when available; otherwise
 * records a local outbox entry for operations pickup (same pattern as newsletter).
 */
async function submitContact(payload: FormState): Promise<void> {
  const apiBase = browserApiBase();

  const body = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone || undefined,
    company: payload.company || undefined,
    inquiryType: payload.inquiryType || undefined,
    subject: payload.subject || undefined,
    message: payload.message,
  };

  if (apiBase) {
    const response = await fetch(`${apiBase}/api/v1/marketing/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) return;
  } else {
    const response = await fetch(`/api/v1/marketing/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) return;
  }

  try {
    const key = "hamd.web.contact.outbox";
    const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
    existing.push({ ...body, at: new Date().toISOString() });
    window.localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    throw new Error("Unable to save your message locally. Email us directly.");
  }
}

export function ContactPage() {
  const [params] = useSearchParams();
  const toast = useToast();
  const formId = useId();
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const productHint = params.get("product");
  const faqHint = params.get("topic") === "faq";
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: faqHint ? "faq" : "general",
    subject: productHint
      ? `Request: ${productHint}`
      : faqHint
        ? "FAQ question"
        : "",
    message: productHint
      ? `I would like to request: ${productHint}`
      : faqHint
        ? "I couldn't find this in the FAQ:\n"
        : "",
  });

  const office = contactContent.office;
  const waUrl = useMemo(
    () =>
      whatsappHref(contactContent.whatsapp.number, contactContent.whatsapp.message),
    [],
  );
  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waUrl)}`,
    [waUrl],
  );
  const mapsSearchUrl = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`,
    [office.address],
  );
  const osmLinkUrl = useMemo(
    () =>
      `https://www.openstreetmap.org/search?query=${encodeURIComponent(office.address)}`,
    [office.address],
  );

  useEffect(() => {
    applyPageSeo(contactContent.seo);
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Partial<FormState> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email.";
    }
    if (!form.inquiryType) next.inquiryType = "Select an inquiry type.";
    if (!form.subject.trim()) next.subject = "Subject is required.";
    if (!form.message.trim()) next.message = "Tell us what you need.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        inquiryType: form.inquiryType,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSubmitted(true);
      toast.push({
        tone: "success",
        title: "Message received",
        description: contactContent.responseNote,
      });
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Unable to send",
        description:
          error instanceof Error ? error.message : "Try emailing us directly.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessState
        title="Thank you, we have your message"
        description={`${contactContent.responseNote} You can also email ${SITE.contactEmail}.`}
        actionHref="/"
        actionLabel="Return to homepage"
      />
    );
  }

  return (
    <div className="hamd-contact-page">
      <PageHero
        eyebrow={contactContent.hero.eyebrow}
        title={contactContent.hero.title}
        description={contactContent.hero.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contact" },
        ]}
      />

      <Section
        id="contact-channels"
        title="Get in touch"
        description="Multiple ways to reach the Almahbub International team."
        width="default"
      >
        <div className="hamd-contact-page__layout">
          <aside className="hamd-contact-page__aside" aria-label="Contact channels">
            <div className="hamd-contact-page__card">
              <h3 className="hamd-contact-page__card-title">Channels</h3>
              <ul className="hamd-contact-page__channels">
                <li>
                  <p className="hamd-contact-page__channel-label">Phone</p>
                  {contactContent.phones.map((phone) => (
                    <a key={phone.href} className="hamd-contact-page__channel-link" href={phone.href}>
                      {phone.label}
                    </a>
                  ))}
                </li>
                <li>
                  <p className="hamd-contact-page__channel-label">Email</p>
                  <a
                    className="hamd-contact-page__channel-link"
                    href={`mailto:${contactContent.email}`}
                  >
                    {contactContent.email}
                  </a>
                  <a
                    className="hamd-contact-page__channel-link"
                    href={`mailto:${contactContent.legacyEmail}`}
                  >
                    {contactContent.legacyEmail}
                  </a>
                </li>
                <li>
                  <p className="hamd-contact-page__channel-label">WeChat</p>
                  <p className="hamd-contact-page__channel-text">{contactContent.wechat}</p>
                </li>
                <li>
                  <p className="hamd-contact-page__channel-label">Office</p>
                  {office.lines.map((line) => (
                    <p key={line} className="hamd-contact-page__channel-text">
                      {line}
                    </p>
                  ))}
                </li>
              </ul>
            </div>

            <div className="hamd-contact-page__card">
              <h3 className="hamd-contact-page__card-title">Quick actions</h3>
              <div className="hamd-contact-page__actions">
                <a className="hamd-btn hamd-btn--secondary" href={contactContent.phones[0]!.href}>
                  Call now
                </a>
                <a className="hamd-btn hamd-btn--secondary" href={`mailto:${contactContent.email}`}>
                  Send email
                </a>
                <a
                  className="hamd-btn hamd-btn--secondary"
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp chat
                </a>
                <ButtonLink href="/app/chat" variant="secondary">
                  Live chat
                </ButtonLink>
              </div>
            </div>
          </aside>

          <div className="hamd-contact-page__form-wrap">
            <form className="hamd-form hamd-contact-page__form" onSubmit={onSubmit} noValidate>
              <h3 className="hamd-contact-page__card-title">Send us a message</h3>
              <p className="hamd-contact-page__form-lead">{contactContent.responseNote}</p>
              <div className="hamd-contact-page__form-grid">
                <Field label="Full name" htmlFor={`${formId}-name`} error={errors.name}>
                  <TextInput
                    id={`${formId}-name`}
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    invalid={Boolean(errors.name)}
                    onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                  />
                </Field>
                <Field label="Work email" htmlFor={`${formId}-email`} error={errors.email}>
                  <TextInput
                    id={`${formId}-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    invalid={Boolean(errors.email)}
                    onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
                  />
                </Field>
                <Field label="Phone" htmlFor={`${formId}-phone`} hint="Optional">
                  <TextInput
                    id={`${formId}-phone`}
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
                  />
                </Field>
                <Field
                  label="Inquiry type"
                  htmlFor={`${formId}-inquiry`}
                  error={errors.inquiryType}
                >
                  <Select
                    id={`${formId}-inquiry`}
                    name="inquiryType"
                    value={form.inquiryType}
                    invalid={Boolean(errors.inquiryType)}
                    onChange={(event) =>
                      setForm((f) => ({ ...f, inquiryType: event.target.value }))
                    }
                  >
                    {contactContent.inquiryTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Company" htmlFor={`${formId}-company`} hint="Optional">
                <TextInput
                  id={`${formId}-company`}
                  name="company"
                  autoComplete="organization"
                  value={form.company}
                  onChange={(event) => setForm((f) => ({ ...f, company: event.target.value }))}
                />
              </Field>
              <Field label="Subject" htmlFor={`${formId}-subject`} error={errors.subject}>
                <TextInput
                  id={`${formId}-subject`}
                  name="subject"
                  value={form.subject}
                  invalid={Boolean(errors.subject)}
                  onChange={(event) => setForm((f) => ({ ...f, subject: event.target.value }))}
                />
              </Field>
              <Field label="Message" htmlFor={`${formId}-message`} error={errors.message}>
                <TextArea
                  id={`${formId}-message`}
                  name="message"
                  rows={5}
                  value={form.message}
                  invalid={Boolean(errors.message)}
                  onChange={(event) => setForm((f) => ({ ...f, message: event.target.value }))}
                />
              </Field>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          </div>
        </div>
      </Section>

      <Section
        id="contact-social"
        title="Chat with us on social"
        description="Follow Almahbub International and message the team on the channels you already use."
        width="default"
      >
        <ul className="hamd-contact-page__social">
          {contactContent.social.map((item) => (
            <li key={item.id}>
              <a
                className="hamd-contact-page__social-link"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              className="hamd-contact-page__social-link hamd-contact-page__social-link--whatsapp"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </li>
        </ul>
      </Section>

      <Section
        id={office.id}
        title="WhatsApp & office map"
        description="Start a WhatsApp chat instantly, or open our Ilorin office location."
        width="default"
      >
        <div className="hamd-contact-page__media">
          <article className="hamd-contact-page__panel hamd-contact-page__panel--whatsapp">
            <header className="hamd-contact-page__panel-head">
              <h3>Chat on WhatsApp</h3>
              <p>Scan the QR code or open WhatsApp directly.</p>
            </header>
            <div className="hamd-contact-page__panel-body">
              <img
                className="hamd-contact-page__qr"
                src={qrUrl}
                alt="QR code to open WhatsApp chat with Almahbub International"
                width={200}
                height={200}
                loading="lazy"
              />
              <a
                className="hamd-btn hamd-btn--primary"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open WhatsApp
              </a>
              <p className="hamd-contact-page__panel-note">
                Number: +{contactContent.whatsapp.number}
              </p>
            </div>
          </article>

          <article className="hamd-contact-page__panel hamd-contact-page__panel--map">
            <header className="hamd-contact-page__panel-head">
              <h3>{office.title}</h3>
              <p>Visit for in-person assistance.</p>
            </header>
            <div className="hamd-contact-page__map-frame">
              <iframe
                title="Almahbub International office map"
                src={mapEmbedUrl(office.address)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="hamd-contact-page__panel-body hamd-contact-page__panel-body--map">
              <p className="hamd-contact-page__address">{office.address}</p>
              <div className="hamd-contact-page__actions">
                <a
                  className="hamd-btn hamd-btn--secondary"
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
                <a
                  className="hamd-btn hamd-btn--secondary"
                  href={osmLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in OpenStreetMap
                </a>
              </div>
            </div>
          </article>
        </div>
      </Section>

      <p className="hamd-contact-page__footer-note">
        Prefer the workspace inbox?{" "}
        <Link to="/app/chat">Open live chat</Link> after signing in.
      </p>
    </div>
  );
}
