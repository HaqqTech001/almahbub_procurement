export type CuratedProductMedia = {
  src: string;
  alt: string;
  sourceUrl: string;
  source: "manufacturer" | "wikimedia";
};

/**
 * Verified catalogue fallbacks for products whose durable ProductImage media
 * has not yet been imported. Database-backed ProductImage rows always win.
 */
export const CURATED_PRODUCT_MEDIA: Readonly<Record<string, CuratedProductMedia>> = {
  "google-pixel-11-pro-series": {
    src: "https://lh3.googleusercontent.com/LP4fWGXX_e-7i7cl_8Zs3qlFq6n92rxXO0az_SOV3wc2LP5mP9wxkm0Jjdu8urbOJOLaGdzdoeXWf5CVAvsIeH3xwljO28AUvnlq=w720-h900-rw-nu",
    alt: "Google Pixel 11 Pro official product image",
    sourceUrl: "https://store.google.com/jp/magazine/meet-google-pixel-11-pro?hl=ja",
    source: "manufacturer",
  },
  "apple-macbook-air-m5-series": {
    src: "https://www.apple.com/newsroom/images/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-13-inch-and-15-inch-260303_big.jpg.large.jpg",
    alt: "Apple MacBook Air with M5 13-inch and 15-inch models",
    sourceUrl: "https://www.apple.com/newsroom/2026/03/apple-introduces-the-new-macbook-air-with-m5/",
    source: "manufacturer",
  },
  "abbott-i-stat-alinity": {
    src: "https://www.globalpointofcare.abbott/us/en/product-details/apoc/istat-alinity/_jcr_content/root/container/columncontrol/tab_item_no_1/image.coreimg.jpeg/1777040758041/istat-alinity-pp-imga-375.jpeg",
    alt: "Abbott i-STAT Alinity handheld blood analyzer",
    sourceUrl: "https://www.globalpointofcare.abbott/us/en/product-details/apoc/istat-alinity.html",
    source: "manufacturer",
  },
  "hamilton-c6": {
    src: "https://media.ffycdn.net/eu/hamilton-medical-ag/PQt7kGy8xH6iDpTzdvn8.png?quality=50&width=640",
    alt: "HAMILTON-C6 ICU ventilator",
    sourceUrl: "https://www.hamilton-medical.com/en_US/Products/HAMILTON-C6.html",
    source: "manufacturer",
  },
  "adidas-samba-og": {
    src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Adidas_Samba_OG.jpg",
    alt: "adidas Samba OG shoe",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Adidas_Samba_OG.jpg",
    source: "wikimedia",
  },
};

export function curatedProductMedia(slug: string): CuratedProductMedia | null {
  return CURATED_PRODUCT_MEDIA[slug] ?? null;
}
