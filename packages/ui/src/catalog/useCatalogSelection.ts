import { useCallback, useMemo, useState } from "react";
import { COMPARE_LIMIT } from "./types.js";

/**
 * Bookmarks + compare selection with accessible announcements.
 * Hosts persist via optional callbacks.
 */
export function useCatalogSelection(options?: {
  initialBookmarks?: string[] | undefined;
  initialCompare?: string[] | undefined;
  onBookmarkChange?: ((ids: string[]) => void | Promise<void>) | undefined;
  onCompareChange?: ((ids: string[]) => void | Promise<void>) | undefined;
}) {
  const [bookmarks, setBookmarks] = useState<string[]>(
    options?.initialBookmarks ?? [],
  );
  const [compare, setCompare] = useState<string[]>(options?.initialCompare ?? []);
  const [announce, setAnnounce] = useState("");

  const toggleBookmark = useCallback(
    (id: string) => {
      setBookmarks((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        setAnnounce(
          next.includes(id) ? "Product saved to bookmarks" : "Product removed from bookmarks",
        );
        void options?.onBookmarkChange?.(next);
        return next;
      });
    },
    [options],
  );

  const toggleCompare = useCallback(
    (id: string) => {
      setCompare((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((x) => x !== id);
          setAnnounce("Product removed from compare");
          void options?.onCompareChange?.(next);
          return next;
        }
        if (prev.length >= COMPARE_LIMIT) {
          setAnnounce(`Compare limit is ${COMPARE_LIMIT} products`);
          return prev;
        }
        const next = [...prev, id];
        setAnnounce(`Product added to compare (${next.length} of ${COMPARE_LIMIT})`);
        void options?.onCompareChange?.(next);
        return next;
      });
    },
    [options],
  );

  const clearCompare = useCallback(() => {
    setCompare([]);
    setAnnounce("Compare cleared");
    void options?.onCompareChange?.([]);
  }, [options]);

  const bookmarked = useMemo(() => new Set(bookmarks), [bookmarks]);
  const comparing = useMemo(() => new Set(compare), [compare]);

  return {
    bookmarks,
    compare,
    bookmarked,
    comparing,
    announce,
    toggleBookmark,
    toggleCompare,
    clearCompare,
    compareFull: compare.length >= COMPARE_LIMIT,
  };
}
