import { useMemo, useState, type FormEvent } from "react";
import { ProductCard } from "../catalog/ProductCard.js";
import type { CatalogProduct } from "../catalog/types.js";
import { ButtonLink } from "../primitives/ButtonLink.js";
import { Section } from "../primitives/Section.js";

export type TrustIndicator = {
  id: string;
  label: string;
  detail?: string;
};

export type TrustPartner = {
  id: string;
  name: string;
  href?: string;
  logoSrc?: string;
  relationship: string;
};

export type TrustStat = {
  id: string;
  value: string;
  label: string;
  source: string;
  sourceHref?: string;
};

export type TrustSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  indicators: readonly TrustIndicator[];
  partners?: readonly TrustPartner[];
  stats?: readonly TrustStat[];
};

export function TrustSection({
  id = "trust",
  eyebrow = "Trust",
  title,
  description,
  indicators,
  partners = [],
  stats = [],
}: TrustSectionProps) {
  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      spacing="compact"
      tone="subtle"
    >
      <ul className="hamd-trust__indicators" aria-label="Trust indicators">
        {indicators.map((item) => (
          <li key={item.id} className="hamd-trust__indicator">
            <span className="hamd-trust__indicator-label">{item.label}</span>
            {item.detail ? (
              <span className="hamd-trust__indicator-detail">{item.detail}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {partners.length > 0 ? (
        <div className="hamd-trust__partners">
          <h3 className="hamd-trust__subheading">Trusted partners</h3>
          <ul className="hamd-trust__partner-grid">
            {partners.map((partner) => {
              const content = (
                <>
                  {partner.logoSrc ? (
                    <img
                      src={partner.logoSrc}
                      alt=""
                      className="hamd-trust__partner-logo"
                      width={120}
                      height={40}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <span className="hamd-trust__partner-name">{partner.name}</span>
                  <span className="hamd-trust__partner-rel">{partner.relationship}</span>
                </>
              );
              return (
                <li key={partner.id} className="hamd-trust__partner">
                  {partner.href ? (
                    <a href={partner.href} className="hamd-trust__partner-link">
                      {content}
                    </a>
                  ) : (
                    <div className="hamd-trust__partner-link">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {stats.length > 0 ? (
        <dl className="hamd-trust__stats">
          {stats.map((stat) => (
            <div key={stat.id} className="hamd-trust__stat">
              <dt className="hamd-trust__stat-value">{stat.value}</dt>
              <dd className="hamd-trust__stat-label">{stat.label}</dd>
              <dd className="hamd-trust__stat-source">
                {stat.sourceHref ? (
                  <a href={stat.sourceHref}>{stat.source}</a>
                ) : (
                  stat.source
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Section>
  );
}

export type ServicesItem = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type ServicesSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  services: readonly ServicesItem[];
  primaryCta?: { href: string; label: string };
};

function ServiceGlyph({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "import-export") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 7h11M15 7l-3-3M15 7l-3 3" />
        <path d="M20 17H9M9 17l3-3M9 17l3 3" />
      </svg>
    );
  }
  if (id === "logistics") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M3 16V8h11v8H3z" />
        <path d="M14 11h4l3 3v2h-7" />
        <circle cx="7" cy="17.5" r="1.5" />
        <circle cx="17" cy="17.5" r="1.5" />
      </svg>
    );
  }
  if (id === "warehousing") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M3 10.5 12 4l9 6.5V20H3v-9.5z" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h10" />
      <path d="M16 15.5 18 17.5 22 13" />
    </svg>
  );
}

function ServiceChevron() {
  return (
    <svg
      className="hamd-services__chevron-icon"
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

/** Separate bordered service cards — Pattern A. No list markers. */
export function ServiceLinks({
  services,
  className,
}: {
  services: readonly ServicesItem[];
  className?: string | undefined;
}) {
  return (
    <ul className={className ? `hamd-services__grid ${className}` : "hamd-services__grid"}>
      {services.map((service) => (
        <li key={service.id} className="hamd-services__item">
          <a className="hamd-services__card" href={service.href}>
            <span className="hamd-services__icon" aria-hidden="true">
              <ServiceGlyph id={service.id} />
            </span>
            <span className="hamd-services__copy">
              <h3 className="hamd-services__card-title">{service.title}</h3>
              <p className="hamd-services__card-body">{service.description}</p>
            </span>
            <span className="hamd-services__chevron" aria-hidden="true">
              <ServiceChevron />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ServicesSection({
  id = "services",
  eyebrow = "Services",
  title,
  description,
  services,
  primaryCta,
}: ServicesSectionProps) {
  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      spacing="spacious"
      actions={
        primaryCta ? (
          <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
        ) : undefined
      }
    >
      <ServiceLinks services={services} />
    </Section>
  );
}

export type ProductCategoryItem = {
  id: string;
  name: string;
  description: string;
  href: string;
  imageSrc?: string;
  imageAlt?: string;
};

export type ProductCategoriesSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  categories: readonly ProductCategoryItem[];
  viewAllHref?: string;
};

export function ProductCategoriesSection({
  id = "product-categories",
  eyebrow = "Product categories",
  title,
  description,
  categories,
  viewAllHref,
}: ProductCategoriesSectionProps) {
  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={
        viewAllHref ? (
          <ButtonLink href={viewAllHref} variant="primary">
            Explore Full Catalogue
          </ButtonLink>
        ) : undefined
      }
    >
      <ul className="hamd-categories__grid">
        {categories.map((category) => (
          <li key={category.id}>
            <a href={category.href} className="hamd-categories__card">
              <div className="hamd-categories__media">
                {category.imageSrc ? (
                  <img
                    src={category.imageSrc}
                    alt={category.imageAlt ?? ""}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : (
                  <div className="hamd-categories__media-fallback" aria-hidden="true" />
                )}
              </div>
              <div className="hamd-categories__content">
                <h3 className="hamd-categories__name">{category.name}</h3>
                <p className="hamd-categories__desc">{category.description}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** @deprecated Prefer CatalogProduct - kept for fixture migration. */
export type FeaturedProductItem = {
  id: string;
  name: string;
  href: string;
  manufacturer: string;
  country: string;
  moq: string;
  leadTime: string;
  availability: string;
  imageSrc?: string;
  imageAlt?: string;
  requestHref: string;
  slug?: string;
  categoryName?: string;
  description?: string;
};

export type FeaturedProductCategory = {
  id: string;
  name: string;
  href?: string;
};

export type FeaturedProductsSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Catalog-shaped products - API or content adapter. */
  products: readonly CatalogProduct[] | readonly FeaturedProductItem[];
  categories?: readonly FeaturedProductCategory[];
  catalogHref?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onQuickQuote?: ((product: CatalogProduct) => void) | undefined;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyHref?: string;
  emptyLabel?: string;
};

function normalizeProduct(
  item: CatalogProduct | FeaturedProductItem,
): CatalogProduct {
  if ("slug" in item && typeof (item as CatalogProduct).slug === "string") {
    const candidate = item as CatalogProduct;
    if (candidate.href && candidate.requestHref) {
      return candidate;
    }
  }
  const legacy = item as FeaturedProductItem;
  return {
    id: legacy.id,
    slug: legacy.slug ?? legacy.id,
    name: legacy.name,
    href: legacy.href,
    requestHref: legacy.requestHref,
    manufacturer: legacy.manufacturer,
    country: legacy.country,
    moq: legacy.moq,
    leadTime: legacy.leadTime,
    availability: legacy.availability,
    ...(legacy.imageSrc !== undefined ? { imageSrc: legacy.imageSrc } : {}),
    ...(legacy.imageAlt !== undefined ? { imageAlt: legacy.imageAlt } : {}),
    ...(legacy.categoryName !== undefined
      ? { categoryName: legacy.categoryName }
      : {}),
    ...(legacy.description !== undefined
      ? { description: legacy.description }
      : {}),
  };
}

/**
 * Featured products - ProductCard grid with optional category chips + search.
 * Host supplies CatalogProduct[] from API or content adapter (no mocks).
 */
export function FeaturedProductsSection({
  id = "featured-products",
  eyebrow = "Featured products",
  title,
  description,
  products,
  categories = [],
  catalogHref,
  enableSearch = true,
  searchPlaceholder = "Search featured capabilities",
  onQuickQuote,
  emptyTitle = "Can't find what you're looking for?",
  emptyDescription = "Tell us what you need and our procurement team can help source it.",
  emptyHref = "/contact",
  emptyLabel = "Request Procurement",
}: FeaturedProductsSectionProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const normalized = useMemo(
    () => products.map((item) => normalizeProduct(item)),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized.filter((product) => {
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.manufacturer.toLowerCase().includes(q) ||
        (product.categoryName?.toLowerCase().includes(q) ?? false) ||
        (product.description?.toLowerCase().includes(q) ?? false);
      const matchesCategory =
        !categoryId ||
        product.categoryName?.toLowerCase().replace(/\s+/g, "-") === categoryId ||
        product.categoryName === categories.find((c) => c.id === categoryId)?.name;
      return matchesQuery && matchesCategory;
    });
  }, [normalized, query, categoryId, categories]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <Section
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      tone="subtle"
      actions={
        catalogHref ? (
          <ButtonLink href={catalogHref} variant="secondary">
            Browse catalog
          </ButtonLink>
        ) : undefined
      }
    >
      {enableSearch ? (
        <form className="hamd-products__search" role="search" onSubmit={onSearch}>
          <label className="hamd-products__search-label" htmlFor={`${id}-search`}>
            Search products
          </label>
          <input
            id={`${id}-search`}
            className="hamd-products__search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
          />
        </form>
      ) : null}

      {categories.length > 0 ? (
        <div className="hamd-products__chips" role="group" aria-label="Product categories">
          {categories.map((category) =>
            category.href ? (
              <a
                key={category.id}
                className="hamd-products__chip"
                href={category.href}
              >
                {category.name}
              </a>
            ) : (
              <button
                key={category.id}
                type="button"
                className={
                  categoryId === category.id
                    ? "hamd-products__chip hamd-products__chip--active"
                    : "hamd-products__chip"
                }
                aria-pressed={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </button>
            ),
          )}
          {categories.some((category) => category.href) && catalogHref ? (
            <a className="hamd-products__chip" href={catalogHref}>
              All categories
            </a>
          ) : (
            <button
              type="button"
              className={
                categoryId === null
                  ? "hamd-products__chip hamd-products__chip--active"
                  : "hamd-products__chip"
              }
              aria-pressed={categoryId === null}
              onClick={() => setCategoryId(null)}
            >
              All
            </button>
          )}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="hamd-products__empty" role="status">
          <h3 className="hamd-products__empty-title">{emptyTitle}</h3>
          <p>{emptyDescription}</p>
          <p>
            <a className="hamd-btn hamd-btn--primary" href={emptyHref}>
              {emptyLabel}
            </a>
            {catalogHref ? (
              <>
                {" "}
                <a className="hamd-btn hamd-btn--secondary" href={catalogHref}>
                  Browse catalogue
                </a>
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <ul className="hamd-products__grid">
          {filtered.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                onQuickQuote={
                  onQuickQuote ??
                  ((item) => {
                    window.location.assign(item.requestHref);
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
