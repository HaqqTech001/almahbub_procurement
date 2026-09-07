export const TOUR_MENU_BTN = ".hamd-client-shell__menu-btn";
export const TOUR_PAD_PX = 8;

function isRendered(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width >= 2 && rect.height >= 2;
}

function inClosedDrawer(el: HTMLElement): boolean {
  return Boolean(el.closest(".hamd-client-shell__drawer:not(.is-open)"));
}

/** Prefer data-tour, then the original data-guide selector. */
export function expandTourSelector(selector: string): string {
  const guide = selector.match(/\[data-guide=['"]([^'"]+)['"]\]/);
  if (guide?.[1] && !selector.includes("data-tour=")) {
    return `[data-tour='${guide[1]}'], ${selector}`;
  }
  return selector;
}

export function queryVisibleTourTarget(selector?: string): HTMLElement | null {
  if (!selector || typeof document === "undefined") return null;
  let nodes: NodeListOf<Element>;
  try {
    nodes = document.querySelectorAll(expandTourSelector(selector));
  } catch {
    return null;
  }
  const desktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  const preferred = desktop
    ? ".hamd-client-shell__sidebar"
    : ".hamd-client-shell__drawer.is-open";
  let fallback: HTMLElement | null = null;
  for (const node of nodes) {
    if (!(node instanceof HTMLElement) || !isRendered(node) || inClosedDrawer(node)) {
      continue;
    }
    if (node.closest(preferred)) return node;
    fallback ??= node;
  }
  return fallback;
}

export function needsWorkspaceDrawer(selector?: string): boolean {
  if (!selector || typeof window === "undefined" || window.innerWidth >= 1024) {
    return false;
  }
  if (queryVisibleTourTarget(selector)) return false;
  return /data-(tour|guide)=['"][^'"]+-nav['"]/.test(selector);
}

export function openWorkspaceDrawer(): boolean {
  const btn = document.querySelector(TOUR_MENU_BTN);
  if (!(btn instanceof HTMLElement)) return false;
  if (btn.getAttribute("aria-expanded") === "true") return true;
  btn.click();
  return true;
}

export function measureTourTarget(selector?: string) {
  const el = queryVisibleTourTarget(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height, el };
}
