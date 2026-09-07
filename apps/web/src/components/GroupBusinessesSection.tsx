import { Link } from "react-router-dom";
import { ButtonLink, Section } from "./index.js";
import { GroupBusinessMark } from "./GroupBusinessSwitcher.js";
import {
  GROUP,
  GROUP_BUSINESSES,
  type GroupBusiness,
} from "../content/group.js";

export function GroupBusinessCard({
  business,
  showMedia = true,
}: {
  business: GroupBusiness;
  showMedia?: boolean;
}) {
  return (
    <article className="hamd-group-card">
      {showMedia ? (
        <div className="hamd-group-card__media" aria-hidden="true">
          <GroupBusinessMark business={business} size="lg" />
          <p className="hamd-group-card__media-label">{business.mediaLabel}</p>
        </div>
      ) : null}
      <p className="hamd-group-card__eyebrow">{GROUP.endorsement}</p>
      <h3 className="hamd-group-card__title">
        <Link
          to={business.href}
          {...(business.slug === "almahbub-integrated-export"
            ? { "data-testid": "aie-portal-entry" }
            : {})}
        >
          {business.name}
        </Link>
      </h3>
      <p className="hamd-group-card__focus">{business.focusShort}</p>
      <p className="hamd-group-card__summary">{business.summary}</p>
      <ul className="hamd-group-card__caps">
        {business.capabilities.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {business.note ? <p className="hamd-group-card__note">{business.note}</p> : null}
      <div className="hamd-group-card__actions">
        <ButtonLink
          href={business.href}
          variant="secondary"
          {...(business.slug === "almahbub-integrated-export"
            ? { "data-testid": "aie-portal-entry-cta" }
            : {})}
        >
          View profile
        </ButtonLink>
        <ButtonLink href={business.cta.href} variant="primary">
          {business.cta.label}
        </ButtonLink>
      </div>
    </article>
  );
}

export function GroupBusinessesSection({
  id = "almahbub-group",
}: {
  id?: string;
}) {
  return (
    <Section
      id={id}
      eyebrow={GROUP.endorsement}
      title={GROUP.name}
      description={GROUP.tagline}
    >
      <p className="hamd-prose">{GROUP.description}</p>
      <ul className="hamd-group-grid">
        {GROUP_BUSINESSES.map((business) => (
          <li key={business.id}>
            <GroupBusinessCard business={business} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
