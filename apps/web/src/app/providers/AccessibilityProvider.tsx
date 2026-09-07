import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AccessibilityContextValue = {
  prefersReducedMotion: boolean;
  highContrast: boolean;
};

const AccessibilityContext = createContext<AccessibilityContextValue>({
  prefersReducedMotion: false,
  highContrast: false,
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setReduced] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = window.matchMedia("(prefers-contrast: more)");
    const sync = () => {
      setReduced(motion.matches);
      setHighContrast(contrast.matches);
      document.documentElement.dataset.reducedMotion = motion.matches
        ? "true"
        : "false";
      document.documentElement.dataset.highContrast = contrast.matches
        ? "true"
        : "false";
    };
    sync();
    motion.addEventListener("change", sync);
    contrast.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      contrast.removeEventListener("change", sync);
    };
  }, []);

  const value = useMemo(
    () => ({ prefersReducedMotion, highContrast }),
    [prefersReducedMotion, highContrast],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
