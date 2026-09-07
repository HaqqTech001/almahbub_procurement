import { ButtonLink, Section } from "@hamd/ui/primitives";
import { SITE } from "../content/site.js";

export type ContactCtaProps = {
  title?: string | undefined;
  description?: string | undefined;
  href?: string | undefined;
  label?: string | undefined;
};

/** Reusable contact CTA band for public pages. */
export function ContactCta({
  title = "Ready to start a qualified request?",
  description = "Share your brief. Clarification, sourcing, and quotation stay on one governed record.",
  href = "/contact",
  label = "Contact specialist",
}: ContactCtaProps) {
  return (
    <Section
      id="contact-cta"
      title={title}
      description={description}
      tone="cta"
      actions={
        <ButtonLink href={href} variant="primary">
          {label}
        </ButtonLink>
      }
    >
      <p className="hamd-prose">
        Prefer email?{" "}
        <a href={`mailto:${SITE.contactEmail}`}>
          {SITE.contactEmail}
        </a>
      </p>
    </Section>
  );
}
