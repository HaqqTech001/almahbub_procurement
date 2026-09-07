import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useMotion } from "../app/providers/MotionProvider.js";

/** CSS page transition - keeps Framer off the public critical path. */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { reduced } = useMotion();

  return (
    <div
      key={location.pathname}
      className={
        reduced
          ? "hamd-page-transition hamd-page-transition--reduced"
          : "hamd-page-transition"
      }
    >
      {children}
    </div>
  );
}
