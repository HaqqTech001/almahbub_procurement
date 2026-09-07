import { availabilityLabel } from "../catalog/types.js";
import type { ProductCertificate, ProductDetailModel, ProductDownload, ProductSpecRow } from "./types.js";

export function ProductSourcingFacts({
  product,
}: {
  product: Pick<
    ProductDetailModel,
    | "manufacturer"
    | "manufacturerHref"
    | "supplier"
    | "supplierHref"
    | "country"
    | "moq"
    | "leadTime"
    | "availability"
  >;
}) {
  const avail = availabilityLabel(String(product.availability));
  const rows: Array<{ label: string; value: string; href?: string }> = [
    {
      label: "Manufacturer",
      value: product.manufacturer || "Not provided",
      ...(product.manufacturerHref ? { href: product.manufacturerHref } : {}),
    },
    {
      label: "Supplier",
      value: product.supplier?.trim() ? product.supplier : "Managed sourcing",
      ...(product.supplierHref ? { href: product.supplierHref } : {}),
    },
    { label: "Country of origin", value: product.country || "Not provided" },
    { label: "MOQ", value: product.moq || "Not provided" },
    { label: "Lead time", value: product.leadTime || "Not provided" },
    { label: "Availability", value: avail },
  ];

  return (
    <section className="hamd-pd-facts" aria-labelledby="pd-facts-title">
      <h2 id="pd-facts-title" className="hamd-pd-section__title">
        Sourcing facts
      </h2>
      <dl className="hamd-pd-facts__grid">
        {rows.map((row) => (
          <div key={row.label} className="hamd-pd-facts__item" data-label={row.label}>
            <dt>{row.label}</dt>
            <dd>
              {row.href ? (
                <a href={row.href}>{row.value}</a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="hamd-pd-facts__note">
        Lead times are indicative unless contractual. Availability means available
        to source - not live stock.
      </p>
    </section>
  );
}

export function ProductSpecifications({
  specifications,
}: {
  specifications: ProductSpecRow[];
}) {
  const groups = specifications.reduce<Record<string, ProductSpecRow[]>>((acc, row) => {
    const list = acc[row.group] ?? [];
    list.push(row);
    acc[row.group] = list;
    return acc;
  }, {});

  return (
    <section className="hamd-pd-specs" aria-labelledby="pd-specs-title" id="specifications">
      <h2 id="pd-specs-title" className="hamd-pd-section__title">
        Specifications
      </h2>
      {specifications.length === 0 ? (
        <p className="hamd-pd-empty" role="status">
          Specifications not provided.
        </p>
      ) : (
        Object.entries(groups).map(([group, rows]) => (
          <div key={group} className="hamd-pd-specs__group">
            <h3 className="hamd-pd-specs__group-title">{group}</h3>
            <table className="hamd-pd-specs__table">
              <caption className="hamd-sr-only">{group} specifications</caption>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.label}</th>
                    <td>
                      {row.value}
                      {row.unit ? ` ${row.unit}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </section>
  );
}

export function ProductDownloads({ downloads }: { downloads: ProductDownload[] }) {
  return (
    <section className="hamd-pd-downloads" aria-labelledby="pd-downloads-title" id="downloads">
      <h2 id="pd-downloads-title" className="hamd-pd-section__title">
        Downloads
      </h2>
      {downloads.length === 0 ? (
        <p className="hamd-pd-empty" role="status">
          No downloads available.
        </p>
      ) : (
        <ul className="hamd-pd-downloads__list">
          {downloads.map((doc) => (
            <li key={doc.id}>
              <a href={doc.href} className="hamd-pd-downloads__link">
                <span className="hamd-pd-downloads__name">{doc.title}</span>
                <span className="hamd-pd-downloads__meta">
                  {[doc.mimeType, doc.sizeLabel].filter(Boolean).join(" · ") || "Document"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ProductCertificates({
  certificates,
}: {
  certificates: ProductCertificate[];
}) {
  return (
    <section
      className="hamd-pd-certs"
      aria-labelledby="pd-certs-title"
      id="certificates"
    >
      <h2 id="pd-certs-title" className="hamd-pd-section__title">
        Certificates
      </h2>
      {certificates.length === 0 ? (
        <p className="hamd-pd-empty" role="status">
          Certificates not provided.
        </p>
      ) : (
        <ul className="hamd-pd-certs__list">
          {certificates.map((cert) => (
            <li key={cert.id} className="hamd-pd-certs__item">
              {cert.href ? (
                <a href={cert.href}>{cert.name}</a>
              ) : (
                <span>{cert.name}</span>
              )}
              <span className="hamd-pd-certs__meta">
                {[cert.issuer, cert.validThrough ? `Valid through ${cert.validThrough}` : null]
                  .filter(Boolean)
                  .join(" · ") || "Certificate"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ProductProcurementCta({
  requestHref,
  productName,
  onRequest,
  bookmarked,
  comparing,
  compareDisabled,
  onBookmark,
  onCompare,
}: {
  requestHref: string;
  productName: string;
  onRequest?: (() => void) | undefined;
  bookmarked?: boolean | undefined;
  comparing?: boolean | undefined;
  compareDisabled?: boolean | undefined;
  onBookmark?: (() => void) | undefined;
  onCompare?: (() => void) | undefined;
}) {
  return (
    <section className="hamd-pd-cta" aria-labelledby="pd-cta-title">
      <h2 id="pd-cta-title" className="hamd-sr-only">
        Procurement actions
      </h2>
      <a
        className="hamd-pd-btn hamd-pd-btn--primary hamd-pd-cta__primary"
        href={requestHref}
        data-primary-action="request-product"
        onClick={(event) => {
          if (onRequest) {
            event.preventDefault();
            onRequest();
          }
        }}
      >
        Request this product
      </a>
      <p className="hamd-pd-cta__help">
        Starts a procurement request with this product identity preserved - not a
        checkout.
      </p>
      <div className="hamd-pd-cta__secondary">
        {onBookmark ? (
          <button
            type="button"
            className="hamd-pd-btn"
            aria-pressed={bookmarked}
            aria-label={
              bookmarked
                ? `Remove ${productName} from bookmarks`
                : `Save ${productName} to bookmarks`
            }
            onClick={onBookmark}
          >
            {bookmarked ? "Saved" : "Save"}
          </button>
        ) : null}
        {onCompare ? (
          <button
            type="button"
            className="hamd-pd-btn"
            aria-pressed={comparing}
            disabled={!comparing && compareDisabled}
            aria-label={
              comparing
                ? `Remove ${productName} from compare`
                : compareDisabled
                  ? `Cannot compare ${productName}; limit reached`
                  : `Compare ${productName}`
            }
            onClick={onCompare}
          >
            Compare
          </button>
        ) : null}
      </div>
    </section>
  );
}
