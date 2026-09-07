import { createContext, useContext } from "react";
import type {
  GuidanceMode,
  GuidanceTip,
  GuidanceTour,
  GuidanceUserPreference,
  GuidanceUserProgress,
} from "./types.js";
import type { ProductTourRole } from "./product-tour.js";

export type GuidanceContextValue = {
  preference: GuidanceUserPreference;
  mode: GuidanceMode;
  role?: ProductTourRole | undefined;
  tours: readonly GuidanceTour[];
  tips: readonly GuidanceTip[];
  progress: readonly GuidanceUserProgress[];
  dismissedTipIds: ReadonlySet<string>;
  currentPageKey?: string | undefined;
  enabled: boolean;
  active: boolean;
  welcomeOpen: boolean;
  learningOpen: boolean;
  activeTour: GuidanceTour | null;
  activeStepIndex: number;
  paused: boolean;
  setMode: (mode: GuidanceMode) => void;
  setWelcomeOpen: (open: boolean) => void;
  setLearningOpen: (open: boolean) => void;
  completeWelcome: (choice: "start" | "skip" | "never") => void;
  startTour: (tourKeyOrId: string) => void;
  stopTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  restartCurrentTour: () => void;
  restartAllTours: () => void;
  dontShowAgain: () => void;
  resetTour: (tourKeyOrId: string) => void;
  dismissTip: (tipId: string) => void;
  openHelpCenter: () => void;
  registerAction: (selector: string, eventName?: string) => void;
  actionSatisfied: boolean;
};

/**
 * Isolated so Vite Fast Refresh can re-evaluate provider/chrome modules without
 * minting a second context identity (which surfaces as
 * "useGuidance must be used within GuidanceProvider" under an existing provider).
 */
export const GuidanceContext = createContext<GuidanceContextValue | null>(null);

export function useGuidance(): GuidanceContextValue {
  const ctx = useContext(GuidanceContext);
  if (!ctx) {
    throw new Error("useGuidance must be used within GuidanceProvider");
  }
  return ctx;
}

export function useOptionalGuidance(): GuidanceContextValue | null {
  return useContext(GuidanceContext);
}
