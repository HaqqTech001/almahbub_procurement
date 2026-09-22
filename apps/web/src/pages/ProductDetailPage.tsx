import { useEffect, useState, type KeyboardEvent } from "react";
import { orderedProductImages } from "@hamd/constants";
import { Link, useLocation, useParams } from "react-router-dom";
import { MediaLightbox, OptimizedImage, type MediaLightboxItem } from "@hamd/ui/primitives";
import { ButtonLink, EmptyState, ErrorState, Section } from "../components/index.js";
import {
  CatalogApiError,
  getPublicProduct,
  type PublicCatalogProduct,
} from "../api/catalog-api.js";
import { applyJsonLd, applyPageSeo } from "../lib/seo.js";
import { SITE } from "../content/site.js";
import { resolveMediaUrl } from "../lib/media-url.js";
import {
  availabilityLabel,
  entryTypeLabel,
  productRequestHref,
  formatSpecificationLabel,
  sourcingStatusLabel,
} from "../lib/catalog-display.js";
import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import { procurementServiceVisual } from "../lib/procurement-service-visuals.js";

function specificationValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

function visibleSpecifications(value: Record<string, unknown> | undefined) {
  return Object.entries(value ?? {}).filter(
    ([, item]) =>
      item !== null &&
      item !== undefined &&
      specificationValue(item).trim().length > 0,
  );
}

function ProductDetailSkeleton() {
  return (
    <Section id="product-loading" title="Product" description="Loading published details.">
      <div className="hamd-product-detail hamd-product-detail--skeleton" aria-busy="true" aria-label="Loading product">
        <div className="hamd-product-detail__gallery">
          <div className="hamd-product-detail__ph" />
        </div>
        <div className="hamd-product-detail__copy">
          <div className="hamd-disc-skel" />
          <div className="hamd-disc-skel hamd-disc-skel--short" />
          <div className="hamd-disc-skel hamd-disc-skel--desc" />
        </div>
      </div>
    </Section>
  );
}

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const auth = useOptionalAuth();
  const workspace = location.pathname.startsWith("/app/products");
  const authenticated = auth?.status === "authenticated";
  const [product, setProduct] = useState<PublicCatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedVariantName, setSelectedVariantName] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMissing(false);
    setProduct(null);
    setActiveImage(0);
    setFailedImages([]);
    setImageFailed(false);
    setSelectedVariantName("");
    void getPublicProduct(slug)
      .then((row) => {
        if (!cancelled) {
          setProduct(row);
          if (row.entryType === "PRODUCT_FAMILY") {
            setSelectedVariantName(row.variants[0]?.name ?? "");
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof CatalogApiError && err.status === 404) {
          setMissing(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load product.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (loading) return;
    if (!product) {
      applyPageSeo({
        title: missing ? "Product not found" : "Product unavailable",
        description: "The requested product was not found in the published catalogue.",
        path: `/product/${slug}`,
        noIndex: true,
      });
      return;
    }
    const primary = product.images[0]?.url;
    applyPageSeo({
      title: product.name,
      description:
        product.description ??
        "Request procurement for this published Almahbub International catalogue item.",
      path: `/product/${product.slug}`,
      ...(primary ? { ogImage: primary } : {}),
    });
    applyJsonLd(
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description ?? undefined,
        category: product.category?.name,
        brand: product.brandName
          ? { "@type": "Brand", name: product.brandName }
          : { "@type": "Brand", name: SITE.name },
        url: `https://almahbubinternational.com/product/${product.slug}`,
        ...(primary
          ? {
              image: primary.startsWith("http")
                ? primary
                : `https://almahbubinternational.com${primary}`,
            }
          : {}),
      },
      "hamd-product-jsonld",
    );
  }, [loading, missing, product, slug]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load product"
        description={error}
        actionHref="/products"
        actionLabel="Back to products"
      />
    );
  }

  if (missing || !product) {
    return (
      <EmptyState
        title="Product not found"
        description="This item is not in the published catalogue. It may be unpublished, or you can ask our team to source it."
        actionHref="/products"
        actionLabel="Back to products"
      >
        <div className="hamd-empty-state__actions">
          <ButtonLink href={productRequestHref(slug, { workspace, authenticated })} variant="primary">
            Request This Product
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact Almahbub
          </ButtonLink>
        </div>
      </EmptyState>
    );
  }

  const gallery = orderedProductImages(product.images);
  const videos = (product.videos ?? []).filter(
    (video) => video.url.trim().length > 0,
  );
  const selected = gallery[activeImage] ?? gallery[0];
  const current = selected && !failedImages.includes(selected.url) ? selected : gallery.find(image => !failedImages.includes(image.url));
  const serviceVisual =
    product.entryType === "PROCUREMENT_SERVICE"
      ? procurementServiceVisual(product.slug)
      : null;
  const imageSrc = resolveMediaUrl(current?.url) ?? serviceVisual?.src;
  const showImage = Boolean(imageSrc) && !imageFailed;
  const requestHref = productRequestHref(product.slug, {
    workspace,
    authenticated,
    variant:
      product.entryType === "PRODUCT_FAMILY" ? selectedVariantName : null,
  });
  const specificationVariant =
    (product.variants ?? []).find((variant) => variant.name === "Standard sourcing") ??
    product.variants?.[0];
  const specificationFields = specificationVariant?.typicalSpecificationFields ?? [];
  const sourcingLabel = sourcingStatusLabel(specificationVariant?.sourcingStatus);
  const keySpecifications = visibleSpecifications(product.keySpecifications);
  const productTypeLabel = entryTypeLabel(product.entryType);
  const familyVariants =
    product.entryType === "PRODUCT_FAMILY" ? product.variants ?? [] : [];
  const lightboxItems: MediaLightboxItem[] = gallery.flatMap((image) => {
    if (failedImages.includes(image.url)) return [];
    const src = resolveMediaUrl(image.url);
    return src
      ? [{ src, kind: "image" as const, alt: image.altText?.trim() || product.name }]
      : [];
  });

  const onGalleryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (gallery.length < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveImage((index) => (index + 1) % gallery.length);
      setImageFailed(false);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveImage((index) => (index - 1 + gallery.length) % gallery.length);
      setImageFailed(false);
    }
  };

  return (
    <div className="hamd-catalog-page hamd-product-detail-page">
      <header className="hamd-catalog-page__header">
        <p className="hamd-catalog-page__crumb">
          <Link to={workspace ? "/app/products" : "/products"}>Products</Link>
          {product.category ? (
            <>
              <span aria-hidden="true"> / </span>
              <Link
                to={`${workspace ? "/app/products" : "/products"}?category=${product.category.slug}`}
              >
                {product.category.name}
              </Link>
            </>
          ) : null}
        </p>
        <h1>{product.name}</h1>
        {product.summary ? <p className="hamd-prose">{product.summary}</p> : null}
        {product.description && product.description !== product.summary ? (
          <p className="hamd-prose">{product.description}</p>
        ) : null}
      </header>
      <div className="hamd-product-detail">
          <div
            className="hamd-product-detail__gallery"
            tabIndex={gallery.length > 1 ? 0 : undefined}
            role={gallery.length > 1 ? "group" : undefined}
            aria-label={gallery.length > 1 ? "Product image gallery" : undefined}
            onKeyDown={onGalleryKeyDown}
          >
            {showImage && serviceVisual && !current ? (
              <OptimizedImage
                key={imageSrc}
                src={imageSrc}
                alt={serviceVisual.alt}
                className="hamd-product-detail__media"
                width={960}
                height={720}
                priority
                onLoadError={() => setImageFailed(true)}
              />
            ) : showImage ? (
              <button
                type="button"
                className="hamd-product-detail__zoom"
                onClick={() => setLightboxOpen(true)}
              >
                <OptimizedImage
                  key={imageSrc}
                  src={imageSrc}
                  alt={current?.altText?.trim() || product.name}
                  className="hamd-product-detail__media"
                  width={960}
                  height={720}
                  priority
                  onLoadError={() => {
                    if (current) setFailedImages(previous => [...previous, current.url]);
                    setImageFailed(false);
                  }}
                />
              </button>
            ) : (
              <div className="hamd-product-detail__ph" role="img" aria-label="Catalogue image placeholder">
                <span className="hamd-disc-card__ph-mark">{product.name}</span>
                <span className="hamd-disc-card__ph-note">Image coming soon</span>
              </div>
            )}
            {current?.caption?.trim() ? (
              <p className="hamd-product-detail__media-credit">
                {current.caption}
              </p>
            ) : null}
            {gallery.length > 1 ? (
              <ul className="hamd-product-detail__thumbs" aria-label="Product images">
                {gallery.map((image, index) => (
                  <li key={`${image.url}-${image.position}`}>
                    <button
                      type="button"
                      className={
                        index === activeImage
                          ? "hamd-product-detail__thumb is-active"
                          : "hamd-product-detail__thumb"
                      }
                      aria-label={`Show image ${index + 1}`}
                      aria-pressed={index === activeImage}
                      onClick={() => {
                        setActiveImage(index);
                        setImageFailed(false);
                      }}
                    >
                      <OptimizedImage
                        src={resolveMediaUrl(image.url)}
                        alt=""
                        width={96}
                        height={72}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="hamd-product-detail__copy">
            <dl className="hamd-product-detail__meta">
              {product.brandName ? (
                <div>
                  <dt>Brand</dt>
                  <dd>{product.brandName}</dd>
                </div>
              ) : null}
              {product.manufacturerName ? (
                <div>
                  <dt>Manufacturer</dt>
                  <dd>{product.manufacturerName}</dd>
                </div>
              ) : null}
              {productTypeLabel ? (
                <div>
                  <dt>Type</dt>
                  <dd>{productTypeLabel}</dd>
                </div>
              ) : null}
              <div>
                <dt>Availability</dt>
                <dd>{availabilityLabel(product.availabilityStatus)}</dd>
              </div>
              {product.releaseDate ? (
                <div>
                  <dt>Release date</dt>
                  <dd>{product.releaseDate}</dd>
                </div>
              ) : null}
            </dl>

            {keySpecifications.length > 0 ? (
              <section className="hamd-product-specs" aria-labelledby="product-key-specs-heading">
                <h2 id="product-key-specs-heading">Key specifications</h2>
                <dl className="hamd-product-detail__meta">
                  {keySpecifications.map(([key, value]) => (
                    <div key={key}>
                      <dt>{formatSpecificationLabel(key.replace(/([a-z])([A-Z])/g, "$1 $2"))}</dt>
                      <dd>{specificationValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {familyVariants.length > 0 ? (
              <section className="hamd-product-specs" aria-labelledby="product-variants-heading">
                <h2 id="product-variants-heading">Available variants</h2>
                <label htmlFor="product-family-variant">Choose a variant for your request</label>
                <select
                  id="product-family-variant"
                  value={selectedVariantName}
                  onChange={(event) => setSelectedVariantName(event.target.value)}
                >
                  {familyVariants.map((variant) => (
                    <option key={variant.name} value={variant.name}>
                      {variant.name}
                    </option>
                  ))}
                </select>
                <ul>
                  {familyVariants.map((variant) => {
                    const details = visibleSpecifications(variant.specifications);
                    return (
                      <li key={variant.name}>
                        <strong>{variant.name}</strong>
                        {details.length > 0 ? (
                          <span>
                            {" — "}
                            {details
                              .map(
                                ([key, value]) =>
                                  `${formatSpecificationLabel(key)}: ${specificationValue(value)}`,
                              )
                              .join(" · ")}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {specificationVariant ? (
              <section className="hamd-product-specs" aria-labelledby="product-specs-heading">
                <h2 id="product-specs-heading">Specifications to include</h2>
                {specificationVariant.unit ? (
                  <p className="hamd-product-specs__unit">
                    Typical unit: {specificationVariant.unit}
                  </p>
                ) : null}
                {specificationFields.length > 0 ? (
                  <ul>
                    {specificationFields.map((field) => (
                      <li key={field}>{formatSpecificationLabel(field)}</li>
                    ))}
                  </ul>
                ) : null}
                {sourcingLabel ? (
                  <p className="hamd-product-specs__status">{sourcingLabel}</p>
                ) : null}
              </section>
            ) : null}
            <div className="hamd-product-detail__actions">
              <ButtonLink href={requestHref} variant="primary">
                {product.entryType === "PROCUREMENT_SERVICE"
                  ? "Submit Sourcing Request"
                  : product.entryType === "PRODUCT_FAMILY"
                    ? "Request This Series"
                    : "Request This Product"}
              </ButtonLink>
            </div>
          </div>
        </div>
      {videos.length > 0 ? (
        <Section
          id="product-videos"
          title="Product videos"
          description="Use the player controls. Videos do not autoplay with sound."
        >
          <ul className="hamd-product-videos">
            {videos.map((video) => {
              const src = resolveMediaUrl(video.url);
              return (
                <li key={`${video.url}-${video.position}`} className="hamd-product-videos__item">
                  <video
                    className="hamd-product-videos__player"
                    controls
                    preload="metadata"
                    playsInline
                    src={src}
                    title={video.title?.trim() || `${product.name} video`}
                  >
                    Your browser does not support embedded video.
                  </video>
                  {video.title?.trim() ? (
                    <h3 className="hamd-product-videos__title">{video.title}</h3>
                  ) : null}
                  {video.caption?.trim() ? (
                    <p className="hamd-product-videos__caption">{video.caption}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
      <MediaLightbox
        open={lightboxOpen && lightboxItems.length > 0}
        items={lightboxItems}
        index={Math.max(0, lightboxItems.findIndex(item => item.src === imageSrc))}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={index => setActiveImage(gallery.findIndex(image => resolveMediaUrl(image.url) === lightboxItems[index]?.src))}
      />
    </div>
  );
}
