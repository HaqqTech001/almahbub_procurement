import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CollectionSkeleton, MediaLightbox, OptimizedImage } from "@hamd/ui/primitives";
import { DEFAULT_WEDDING_CAMPAIGN, type WeddingCampaignRecord } from "@hamd/constants";
import { fetchWeddingCampaign, listWeddingGallery, type WeddingGalleryItemDto } from "./wedding-api.js";
import "../styles/wedding-experience.css";

type Filter = "all" | "image" | "video";

export function WeddingGalleryPage() {
  const [campaign, setCampaign] = useState<WeddingCampaignRecord>(DEFAULT_WEDDING_CAMPAIGN);
  const [gallery, setGallery] = useState<WeddingGalleryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [lightbox, setLightbox] = useState<{ items: Array<{ src: string; kind: "image" | "video"; alt?: string | undefined }>; index: number } | null>(null);

  useEffect(() => {
    void fetchWeddingCampaign().then(setCampaign);
    void listWeddingGallery().then(setGallery).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => gallery.filter(item => filter === "all" || item.kind === filter), [filter, gallery]);
  const lightboxItems = useMemo(() => visible.map(item => ({ src: item.src, kind: item.kind, alt: item.title || item.caption || campaign.title })), [campaign.title, visible]);

  return <main className="hamd-wedding-gallery-page">
    <header className="hamd-wedding-gallery-page__hero">
      <Link to="/rowdotul-hamd-26">← Wedding home</Link>
      <p className="hamd-wedding-x__kicker">Rowdotul HAMD&apos;26</p>
      <h1>Gallery</h1>
      <p>Moments that tell our story.</p>
    </header>
    <div className="hamd-wedding-gallery-page__filters" role="group" aria-label="Filter gallery">
      {([["all","All"],["image","Photos"],["video","Videos"]] as const).map(([value,label]) => <button key={value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{label}</button>)}
    </div>
    {loading ? <CollectionSkeleton label="Loading wedding gallery" gridClassName="hamd-wedding-gallery-page__grid" aspectRatio="4 / 5" /> :
      failed ? <p className="hamd-wedding-gallery-page__empty">Unable to load the gallery right now.</p> :
      visible.length === 0 ? <p className="hamd-wedding-gallery-page__empty">The host has not published any {filter === "video" ? "videos" : filter === "image" ? "photos" : "memories"} yet.</p> :
      <ul className="hamd-wedding-gallery-page__grid">{visible.map((item,index) => <li key={item.id}>
        <button onClick={() => setLightbox({items:lightboxItems,index})} aria-label={`Open ${item.title || item.kind}`}>
          {item.kind === "video" ? <><video src={item.src} muted playsInline preload="metadata" /><span className="hamd-wedding-gallery-page__play">▶</span></> : <OptimizedImage src={item.src} alt={item.title || item.caption || "Wedding memory"} />}
          {(item.title || item.caption) ? <span>{item.title || item.caption}</span> : null}
        </button>
      </li>)}</ul>}
    <MediaLightbox open={Boolean(lightbox)} items={lightbox?.items ?? []} index={lightbox?.index ?? 0} onClose={() => setLightbox(null)} onIndexChange={index => setLightbox(current => current ? {...current,index} : current)} />
  </main>;
}
