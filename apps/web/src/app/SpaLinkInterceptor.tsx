import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  IE_BASE_PATH,
  resolveIeHashPath,
} from "../integrated-export/ie-paths.js";

function isInternalPath(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (href.startsWith("#")) return false;
  return true;
}

function scrollWindowToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ block: "start" });
    return;
  }
  scrollWindowToTop();
}

/**
 * Client-side navigation for in-app `<a href="/…">` clicks.
 * UI packages stay router-agnostic; this host adapter prevents full reloads.
 * Modified clicks, downloads, and external/mailto/tel links stay native.
 *
 * Legacy IE hash links (e.g. …/almahbub-integrated-export#commodities) are
 * rewritten to multi-page routes.
 */
export function SpaLinkInterceptor({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("http:") ||
        href.startsWith("https:")
      ) {
        return;
      }
      if (href.startsWith("#")) {
        return;
      }
      if (!isInternalPath(href)) return;

      const url = new URL(href, window.location.origin);
      let nextPath = `${url.pathname}${url.search}`;
      let hash = url.hash;

      if (
        (url.pathname === IE_BASE_PATH || url.pathname === `${IE_BASE_PATH}/`) &&
        url.hash
      ) {
        const rewritten = resolveIeHashPath(url.hash);
        if (rewritten) {
          nextPath = rewritten;
          hash = "";
        }
      }

      event.preventDefault();
      navigate(nextPath + hash);
      if (hash) {
        requestAnimationFrame(() => scrollToHash(hash));
        return;
      }
      scrollWindowToTop();
      if (
        nextPath === IE_BASE_PATH ||
        nextPath.startsWith(`${IE_BASE_PATH}/`)
      ) {
        requestAnimationFrame(scrollWindowToTop);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  return children;
}
