import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MediaLightbox, type MediaLightboxItem } from "@hamd/ui/primitives";

import { HostPage } from "../components/HostChrome.js";
import { usePublishedIeCommodity } from "../integrated-export/commodities/use-published-ie-catalogue.js";
import { IeCommodityImage } from "../integrated-export/IeCommodityImage.js";
import { IeCommodityMediaPlaceholder } from "../integrated-export/IeCommodityMediaPlaceholder.js";
import { ieProcurementCreatePath } from "../integrated-export/ie-paths.js";

export function BuyerCommodityDetailPage() {
  const { slug = "" } = useParams();
  const { commodity } = usePublishedIeCommodity(slug);
  const [lightbox, setLightbox] = useState<{ items: MediaLightboxItem[]; index: number } | null>(
    null,
  );

  const media = useMemo(() => {
    if (!commodity) return [] as MediaLightboxItem[];
    const items: MediaLightboxItem[] = [];
    if (commodity.heroMedia) {
      items.push({
        src: commodity.heroMedia.src,
        kind: "image",
        alt: commodity.heroMedia.alt,
      });
    }
    for (const asset of commodity.gallery ?? []) {
      items.push({ src: asset.src, kind: "image", alt: asset.alt });
    }
    return items;
  }, [commodity]);

  if (!commodity) {
    return (
      <HostPage>
        <p>Commodity not found.</p>
        <Link to="/app/agro-produce">Back to Agro Produce</Link>
      </HostPage>
    );
  }

  const quoteHref = ieProcurementCreatePath(commodity.slug);

  return (
    <HostPage className="hamd-agro-detail">
      <p className="hamd-catalog-page__crumb">
        <Link to="/app/agro-produce">Agro Produce</Link>
        <span aria-hidden="true"> / </span>
        <span>{commodity.name}</span>
      </p>
      <div className="hamd-agro-detail__layout">
        <div>
          {commodity.heroMedia ? (
            <button
              type="button"
              className="hamd-agro-detail__hero"
              onClick={() => setLightbox({ items: media, index: 0 })}
            >
              <IeCommodityImage
                className="hamd-aie-commodity-detail__hero"
                src={commodity.heroMedia.src}
                alt={commodity.heroMedia.alt}
                loading="eager"
                hero
              />
            </button>
          ) : (
            <IeCommodityMediaPlaceholder className="hamd-aie-commodity-detail__hero" />
          )}
          {commodity.gallery && commodity.gallery.length > 0 ? (
            <ul className="hamd-aie-commodity-detail__gallery">
              {commodity.gallery.map((asset, index) => (
                <li key={asset.src} className="hamd-aie-commodity-detail__gallery-item">
                  <button
                    type="button"
                    className="hamd-aie-commodity-detail__gallery-tile"
                    onClick={() =>
                      setLightbox({
                        items: media,
                        index: commodity.heroMedia ? index + 1 : index,
                      })
                    }
                  >
                    <IeCommodityImage src={asset.src} alt={asset.alt} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          {commodity.category ? <p className="hamd-product-detail__tag">{commodity.category}</p> : null}
          <h1>{commodity.name}</h1>
          {commodity.shortDescription ? <p>{commodity.shortDescription}</p> : null}
          {commodity.description ? <p>{commodity.description}</p> : null}
          {commodity.specifications && commodity.specifications.length > 0 ? (
            <dl className="hamd-aie-commodity-detail__specs">
              {commodity.specifications.map((row) => (
                <div key={`${row.label}:${row.value}`}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="hamd-product-detail__actions">
            <Link className="hamd-btn hamd-btn--primary" to={quoteHref}>
              Request a Quote
            </Link>
            <Link className="hamd-btn hamd-btn--secondary" to="/app/agro-produce">
              All commodities
            </Link>
          </div>
        </div>
      </div>
      <MediaLightbox
        open={Boolean(lightbox)}
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
        onIndexChange={(index) =>
          setLightbox((current) => (current ? { ...current, index } : current))
        }
      />
    </HostPage>
  );
}
