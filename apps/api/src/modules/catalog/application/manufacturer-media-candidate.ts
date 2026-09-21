export type ManufacturerMediaCandidate = {
  pageUrl: string;
  imageUrl: string;
  title: string | null;
};

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attribute(tag: string, name: string): string | null {
  const expression = new RegExp(
    name + "\\s*=\\s*[\\\"']([^\\\"']+)[\\\"']",
    "i",
  );
  return tag.match(expression)?.[1]?.trim() ?? null;
}

function metaContent(html: string, key: string): string | null {
  for (const match of html.matchAll(/<meta\\b[^>]*>/gi)) {
    const tag = match[0];
    const property = attribute(tag, "property") ?? attribute(tag, "name");
    if (property?.toLowerCase() !== key.toLowerCase()) continue;
    const content = attribute(tag, "content");
    if (content) return decodeBasicEntities(content);
  }
  return null;
}

export function parseManufacturerMediaCandidate(
  html: string,
  pageUrl: string,
): ManufacturerMediaCandidate | null {
  const rawImage =
    metaContent(html, "og:image") ??
    metaContent(html, "twitter:image") ??
    metaContent(html, "twitter:image:src");
  if (!rawImage) return null;

  let imageUrl: string;
  try {
    imageUrl = new URL(rawImage, pageUrl).href;
  } catch {
    return null;
  }
  if (!/^https?:\\/\\//i.test(imageUrl)) return null;

  const titleMatch = html.match(/<title\\b[^>]*>([^<]+)<\\/title>/i);
  const rawTitle = metaContent(html, "og:title") ?? titleMatch?.[1]?.trim() ?? null;

  return {
    pageUrl,
    imageUrl,
    title: rawTitle ? decodeBasicEntities(rawTitle) : null,
  };
}
