#!/usr/bin/env python3
"""Acquire conservative Wikimedia Commons primary-image candidates for the beta catalogue.

- Reads beta-product-media-manifest.json
- Searches Wikimedia Commons File namespace
- Accepts only clearly reusable Commons licences
- Rejects tiny/non-image assets and obvious logos/diagrams/screenshots
- Avoids reusing the same binary for unrelated products
- Writes original binaries to staging/
- Writes media-import-mapping.json for the existing import-catalog-media.ts
- Writes provenance.json and review.html

No external Python package is required.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import mimetypes
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "AlmahbubInternationalBetaMedia/1.0 (catalogue media acquisition; Wikimedia Commons)"

ALLOWED_LICENSE_MARKERS = (
    "cc by", "cc-by", "cc by-sa", "cc-by-sa", "cc0",
    "public domain", "pd-", "gfdl", "gnu free documentation",
)
BAD_TITLE_MARKERS = (
    "logo", "icon", "symbol", "diagram", "schematic", "drawing", "map",
    "manual", "brochure", "poster", "screenshot", "advertisement", "advert",
    "flag", "seal", "coat of arms", "qr code", "barcode sample",
)
BAD_DESCRIPTION_MARKERS = (
    "logo", "diagram", "schematic", "manual", "poster", "advertisement",
)
STOPWORDS = {
    "and", "for", "with", "the", "of", "a", "an", "system", "equipment",
    "commercial", "professional", "industrial", "business", "office",
    "portable", "digital", "electric", "electronic", "standard",
}


def clean_html_text(v: str) -> str:
    v = re.sub(r"<[^>]+>", " ", v or "")
    v = html.unescape(v)
    return re.sub(r"\s+", " ", v).strip()


def ext_value(meta: dict, key: str) -> str:
    v = meta.get(key)
    if isinstance(v, dict):
        return clean_html_text(str(v.get("value", "")))
    return clean_html_text(str(v or ""))


def request_json(params: dict, retries: int = 3) -> dict:
    params = dict(params)
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    err = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            err = e
            if attempt + 1 < retries:
                time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"Commons API failed: {err}")


def search_candidates(query: str, limit: int = 12) -> list[dict]:
    data = request_json({
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime|size",
    })
    pages = list((data.get("query") or {}).get("pages", {}).values())
    out = []
    for p in pages:
        ii = (p.get("imageinfo") or [None])[0]
        if not ii:
            continue
        out.append({"title": p.get("title", ""), **ii})
    return out


def product_tokens(name: str) -> set[str]:
    toks = re.findall(r"[a-z0-9]+", name.lower())
    return {t for t in toks if len(t) >= 3 and t not in STOPWORDS}


def candidate_score(product: dict, c: dict) -> float:
    title = c.get("title", "").lower()
    mime = (c.get("mime") or "").lower()
    width = int(c.get("width") or 0)
    height = int(c.get("height") or 0)
    meta = c.get("extmetadata") or {}
    lic = (ext_value(meta, "LicenseShortName") + " " + ext_value(meta, "UsageTerms")).lower()
    desc = (ext_value(meta, "ImageDescription") + " " + ext_value(meta, "ObjectName")).lower()

    if not mime.startswith("image/"):
        return -999
    if mime in {"image/svg+xml", "image/gif"}:
        return -999
    if width < 800 or height < 600:
        return -999
    if any(x in title for x in BAD_TITLE_MARKERS):
        return -999
    if any(x in desc for x in BAD_DESCRIPTION_MARKERS):
        return -999
    if not any(x in lic for x in ALLOWED_LICENSE_MARKERS):
        return -999

    toks = product_tokens(product["name"])
    hay = title + " " + desc
    overlap = sum(1 for t in toks if t in hay)
    score = overlap * 6
    if product["name"].lower() in hay:
        score += 20
    # Prefer ordinary photos.
    if mime in {"image/jpeg", "image/png", "image/webp"}:
        score += 3
    if width >= 1200 and height >= 800:
        score += 2
    # Penalize people-heavy/contextual images where product object may be unclear.
    if any(x in hay for x in ("people using", "person using", "woman using", "man using")):
        score -= 4
    return score


def query_variants(product: dict) -> list[str]:
    name = product["name"].strip()
    variants = [name]
    # Remove common procurement adjectives to improve Commons recall.
    simplified = re.sub(
        r"\b(professional|commercial|industrial|portable|digital|electric|electronic|automatic|heavy[- ]duty|single|double)\b",
        "", name, flags=re.I,
    )
    simplified = re.sub(r"\s+", " ", simplified).strip()
    if simplified and simplified.lower() != name.lower():
        variants.append(simplified)
    # Last conservative fallback: key noun tokens only.
    toks = list(product_tokens(name))
    if len(toks) >= 2:
        nounish = " ".join(toks[-3:])
        if nounish.lower() not in {v.lower() for v in variants}:
            variants.append(nounish)
    return variants[:3]


def magic_ok(data: bytes, mime: str) -> bool:
    if mime == "image/jpeg":
        return data.startswith(b"\xff\xd8\xff")
    if mime == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if mime == "image/webp":
        return len(data) > 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    if mime in {"image/tiff", "image/x-tiff"}:
        return data.startswith((b"II*\x00", b"MM\x00*"))
    return False


def extension_for(mime: str, url: str) -> str:
    by_mime = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/tiff": ".tif", "image/x-tiff": ".tif"}
    if mime in by_mime:
        return by_mime[mime]
    ext = Path(urllib.parse.urlparse(url).path).suffix.lower()
    return ext if ext in {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"} else ".img"


def download(url: str) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as r:
        mime = (r.headers.get_content_type() or "").lower()
        data = r.read(25 * 1024 * 1024 + 1)
    if len(data) > 25 * 1024 * 1024:
        raise ValueError("file exceeds 25 MiB beta acquisition cap")
    if not magic_ok(data, mime):
        raise ValueError(f"downloaded body is not a supported real image ({mime})")
    return data, mime


def page_url(title: str) -> str:
    return "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"), safe=":()_-.'")


def acquire_one(product: dict, staging: Path, seen_hashes: dict[str, str]) -> tuple[dict | None, list[str]]:
    notes = []
    all_candidates = {}
    for q in query_variants(product):
        try:
            for c in search_candidates(q):
                all_candidates[c.get("url") or c.get("title")] = c
            time.sleep(0.15)
        except Exception as e:
            notes.append(f"search '{q}' failed: {e}")
    ranked = sorted(all_candidates.values(), key=lambda c: candidate_score(product, c), reverse=True)
    for c in ranked:
        score = candidate_score(product, c)
        if score < 3:
            continue
        url = c.get("url")
        if not url:
            continue
        try:
            data, mime = download(url)
            digest = hashlib.sha256(data).hexdigest()
            if digest in seen_hashes and seen_hashes[digest] != product["slug"]:
                notes.append(f"duplicate binary rejected: {c.get('title')} already used by {seen_hashes[digest]}")
                continue
            ext = extension_for(mime, url)
            filename = product["slug"] + "-primary" + ext
            path = staging / filename
            path.write_bytes(data)
            seen_hashes[digest] = product["slug"]
            meta = c.get("extmetadata") or {}
            lic = ext_value(meta, "LicenseShortName") or ext_value(meta, "UsageTerms")
            lic_url = ext_value(meta, "LicenseUrl")
            creator = ext_value(meta, "Artist") or ext_value(meta, "Credit")
            attribution = ext_value(meta, "Attribution") or creator
            return {
                "filename": filename,
                "productSlug": product["slug"],
                "kind": "image",
                "position": 0,
                "altText": product.get("targetAltText") or f"{product['name']} product view",
                "caption": f"Primary catalogue view of {product['name']}.",
                "sourcePageUrl": page_url(c.get("title", "")),
                "sourceAssetUrl": url,
                "license": lic,
                "licenseUrl": lic_url,
                "creator": creator,
                "attribution": attribution,
                "sha256": digest,
                "mimeType": mime,
                "width": c.get("width"),
                "height": c.get("height"),
                "score": score,
                "commonsTitle": c.get("title", ""),
            }, notes
        except Exception as e:
            notes.append(f"candidate {c.get('title')} rejected: {e}")
    return None, notes


def write_review_html(path: Path, products: list[dict], provenance: list[dict]) -> None:
    by_slug = {p["productSlug"]: p for p in provenance if p.get("status") == "acquired"}
    cards = []
    for prod in products:
        r = by_slug.get(prod["slug"])
        if not r:
            cards.append(f"<article class='missing'><h3>{html.escape(prod['name'])}</h3><p>Needs review/source. Category fallback should remain.</p></article>")
            continue
        rel = "staging/" + urllib.parse.quote(r["filename"])
        cards.append("""
        <article>
          <img src="%s" alt="%s" loading="lazy">
          <h3>%s</h3>
          <p><strong>%s</strong> · %s</p>
          <p class="small">%s</p>
          <p><a href="%s">Source page</a></p>
        </article>
        """ % (
            rel, html.escape(prod.get("targetAltText", prod["name"])), html.escape(prod["name"]),
            html.escape(r.get("license") or "Licence on source page"), html.escape(r.get("creator") or "Creator on source page"),
            html.escape(r.get("commonsTitle") or ""), html.escape(r.get("sourcePageUrl") or "#")
        ))
    path.write_text("""<!doctype html><meta charset='utf-8'><title>Almahbub beta media review</title>
<style>body{font-family:system-ui;margin:24px;background:#111827;color:#f9fafb}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}article{border:1px solid #374151;border-radius:14px;padding:12px;background:#1f2937}img{width:100%%;aspect-ratio:4/3;object-fit:contain;background:#fff;border-radius:10px}.small{font-size:12px;color:#cbd5e1}.missing{opacity:.7}a{color:#93c5fd}</style><h1>Almahbub beta product media review</h1><div class='grid'>%s</div>""" % "".join(cards), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", default="beta-product-media-manifest.json")
    ap.add_argument("--out", default="staging")
    ap.add_argument("--mapping", default="media-import-mapping.json")
    ap.add_argument("--provenance", default="provenance.json")
    ap.add_argument("--limit", type=int, default=100)
    ap.add_argument("--start", type=int, default=0)
    args = ap.parse_args()

    manifest_path = Path(args.manifest).resolve()
    base = manifest_path.parent
    staging = (base / args.out).resolve() if not Path(args.out).is_absolute() else Path(args.out)
    staging.mkdir(parents=True, exist_ok=True)
    mapping_path = (base / args.mapping).resolve() if not Path(args.mapping).is_absolute() else Path(args.mapping)
    prov_path = (base / args.provenance).resolve() if not Path(args.provenance).is_absolute() else Path(args.provenance)

    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    products = data["products"]
    selected = products[args.start: args.start + args.limit]

    # Resume safely from existing provenance.
    provenance = []
    seen_hashes = {}
    acquired_by_slug = {}
    if prov_path.exists():
        try:
            provenance = json.loads(prov_path.read_text(encoding="utf-8"))
            for r in provenance:
                if r.get("status") == "acquired" and r.get("sha256"):
                    seen_hashes[r["sha256"]] = r["productSlug"]
                    acquired_by_slug[r["productSlug"]] = r
        except Exception:
            provenance = []

    for idx, prod in enumerate(selected, start=args.start + 1):
        if prod["slug"] in acquired_by_slug:
            print(f"[{idx}/{len(products)}] SKIP {prod['name']} (already acquired)")
            continue
        print(f"[{idx}/{len(products)}] {prod['name']} ...", flush=True)
        rec, notes = acquire_one(prod, staging, seen_hashes)
        if rec:
            rec["status"] = "acquired"
            rec["productName"] = prod["name"]
            rec["categorySlug"] = prod["categorySlug"]
            rec["notes"] = notes[-5:]
            provenance.append(rec)
            acquired_by_slug[prod["slug"]] = rec
            print(f"  OK {rec['filename']} | {rec['license']} | score={rec['score']}")
        else:
            provenance.append({
                "status": "needs_review",
                "productSlug": prod["slug"],
                "productName": prod["name"],
                "categorySlug": prod["categorySlug"],
                "notes": notes[-8:],
            })
            print("  NO SAFE HIGH-CONFIDENCE COMMONS CANDIDATE; keep category fallback")
        prov_path.write_text(json.dumps(provenance, indent=2, ensure_ascii=False), encoding="utf-8")

    mapping = []
    # Use latest acquired record per slug.
    latest = {}
    for r in provenance:
        if r.get("status") == "acquired":
            latest[r["productSlug"]] = r
    for prod in products:
        r = latest.get(prod["slug"])
        if not r:
            continue
        file_path = staging / r["filename"]
        if not file_path.exists():
            continue
        mapping.append({
            "filename": r["filename"],
            "productSlug": prod["slug"],
            "kind": "image",
            "position": 0,
            "altText": prod.get("targetAltText") or f"{prod['name']} product view",
            "caption": f"Primary catalogue view of {prod['name']}.",
        })
    mapping_path.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
    write_review_html(base / "review.html", products, provenance)
    print(f"\nAcquired and import-ready: {len(mapping)}/{len(products)}")
    print(f"Staging: {staging}")
    print(f"Mapping: {mapping_path}")
    print(f"Review gallery: {base / 'review.html'}")
    print("Items with no safe high-confidence candidate remain on category fallback; they are not force-matched.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
