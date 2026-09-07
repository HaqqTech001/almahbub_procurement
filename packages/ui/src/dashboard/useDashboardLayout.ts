import { useCallback, useEffect, useMemo, useState } from "react";
import type { WidgetLayoutHint } from "./types.js";

export type DashboardWidgetLayoutState = {
  id: string;
  order: number;
  collapsed: boolean;
  colSpan: NonNullable<WidgetLayoutHint["colSpan"]>;
  rowSpan: NonNullable<WidgetLayoutHint["rowSpan"]>;
};

export type UseDashboardLayoutOptions = {
  storageKey?: string | undefined;
  defaults: DashboardWidgetLayoutState[];
  persist?: boolean | undefined;
};

function readStored(
  key: string,
  defaults: DashboardWidgetLayoutState[],
): DashboardWidgetLayoutState[] {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as DashboardWidgetLayoutState[];
    if (!Array.isArray(parsed) || !parsed.length) return defaults;
    const byId = new Map(parsed.map((p) => [p.id, p]));
    return defaults
      .map((d, index) => {
        const saved = byId.get(d.id);
        return saved
          ? { ...d, ...saved, order: saved.order ?? index }
          : { ...d, order: index };
      })
      .sort((a, b) => a.order - b.order);
  } catch {
    return defaults;
  }
}

export function useDashboardLayout({
  storageKey = "hamd.executive.dashboard.layout",
  defaults,
  persist = true,
}: UseDashboardLayoutOptions) {
  const [layouts, setLayouts] = useState<DashboardWidgetLayoutState[]>(() =>
    persist ? readStored(storageKey, defaults) : defaults,
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(layouts));
  }, [layouts, persist, storageKey]);

  const ordered = useMemo(
    () => [...layouts].sort((a, b) => a.order - b.order),
    [layouts],
  );

  const getLayout = useCallback(
    (id: string) => layouts.find((l) => l.id === id) ?? null,
    [layouts],
  );

  const toggleCollapse = useCallback((id: string) => {
    setLayouts((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, collapsed: !l.collapsed } : l,
      ),
    );
  }, []);

  const cycleResize = useCallback((id: string) => {
    const cycle: Array<NonNullable<WidgetLayoutHint["colSpan"]>> = [
      3, 4, 6, 8, 12,
    ];
    setLayouts((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const idx = cycle.indexOf(l.colSpan);
        const next = cycle[(idx + 1) % cycle.length]!;
        return { ...l, colSpan: next };
      }),
    );
  }, []);

  const reorder = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setLayouts((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const fromIndex = sorted.findIndex((l) => l.id === fromId);
      const toIndex = sorted.findIndex((l) => l.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved!);
      return sorted.map((l, order) => ({ ...l, order }));
    });
  }, []);

  const reset = useCallback(() => {
    setLayouts(defaults.map((d, order) => ({ ...d, order })));
  }, [defaults]);

  return {
    layouts: ordered,
    getLayout,
    toggleCollapse,
    cycleResize,
    reorder,
    reset,
    draggingId,
    setDraggingId,
    dropTargetId,
    setDropTargetId,
  };
}
