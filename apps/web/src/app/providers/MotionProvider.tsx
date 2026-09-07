import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useAccessibility } from "./AccessibilityProvider.js";

type MotionContextValue = {
  reduced: boolean;
  duration: number;
  ease: [number, number, number, number];
};

const MotionContext = createContext<MotionContextValue>({
  reduced: false,
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
});

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Motion preferences without pulling Framer into the critical bundle.
 * Page transitions use CSS; Framer loads only with routes that import it.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const { prefersReducedMotion } = useAccessibility();
  const mediaReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot,
  );
  const reduced = Boolean(prefersReducedMotion || mediaReduced);

  const value = useMemo(
    () =>
      ({
        reduced,
        duration: reduced ? 0 : 0.28,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }),
    [reduced],
  );

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

export function useMotion() {
  return useContext(MotionContext);
}
