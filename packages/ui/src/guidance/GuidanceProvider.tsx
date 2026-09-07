import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  GuidanceMode,
  GuidanceTip,
  GuidanceTour,
  GuidanceUserPreference,
  GuidanceUserProgress,
  UpdateGuidancePreferenceInput,
  UpsertGuidanceProgressInput,
} from "./types.js";
import { isGuidanceActive } from "./types.js";
import {
  filterToursForRole,
  shouldAutoOfferTour,
  tourContentVersion,
  type ProductTourRole,
} from "./product-tour.js";
import { queryVisibleTourTarget } from "./tour-target.js";
import {
  GuidanceContext,
  useGuidance,
  useOptionalGuidance,
  type GuidanceContextValue,
} from "./guidance-context.js";

export type { GuidanceContextValue };
export { useGuidance, useOptionalGuidance };

export type GuidanceHandlers = {
  onUpdatePreference?: (
    input: UpdateGuidancePreferenceInput,
  ) => void | Promise<void>;
  onUpsertProgress?: (
    input: UpsertGuidanceProgressInput,
  ) => void | Promise<void>;
  onDismissTip?: (tipId: string) => void | Promise<void>;
  onResetProgress?: (scope: "current" | "all", tourId?: string) => void | Promise<void>;
  onOpenHelpCenter?: () => void;
};

export type GuidanceProviderProps = {
  children: ReactNode;
  preference: GuidanceUserPreference;
  tours: readonly GuidanceTour[];
  tips?: readonly GuidanceTip[] | undefined;
  progress?: readonly GuidanceUserProgress[] | undefined;
  dismissedTipIds?: readonly string[] | undefined;
  currentPageKey?: string | undefined;
  handlers?: GuidanceHandlers | undefined;
  /** Host can force-hide on public routes. Default: show when preference loaded. */
  enabled?: boolean | undefined;
  /**
   * Role-aware filtering. When set, only matching audience tours are active.
   * Omit to expose the full catalog (admin tools).
   */
  role?: ProductTourRole | undefined;
  /** Auto-offer page tour for first-time / version-stale users. Default true. */
  autoStart?: boolean | undefined;
};

export function GuidanceProvider({
  children,
  preference: preferenceProp,
  tours: toursProp,
  tips = [],
  progress: progressProp = [],
  dismissedTipIds: dismissedProp = [],
  currentPageKey,
  handlers,
  enabled = true,
  role,
  autoStart = true,
}: GuidanceProviderProps) {
  const tours = useMemo(() => {
    const list = Array.isArray(toursProp) ? toursProp : [];
    return role ? filterToursForRole(list, role) : [...list];
  }, [role, toursProp]);

  const [preference, setPreference] = useState(preferenceProp);
  const [progress, setProgress] = useState<GuidanceUserProgress[]>(() =>
    Array.isArray(progressProp) ? [...progressProp] : [],
  );
  const [dismissed, setDismissed] = useState(
    () => new Set(Array.isArray(dismissedProp) ? dismissedProp : []),
  );
  const [welcomeOpen, setWelcomeOpen] = useState(
    enabled && !preferenceProp.welcomeCompletedAt && !preferenceProp.neverAutoStart,
  );
  const [learningOpen, setLearningOpen] = useState(false);
  const [activeTour, setActiveTour] = useState<GuidanceTour | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [actionSatisfied, setActionSatisfied] = useState(false);
  const [paused, setPaused] = useState(false);
  const autoStartedRef = useRef<string | null>(null);

  useEffect(() => {
    setPreference(preferenceProp);
  }, [preferenceProp]);

  useEffect(() => {
    setProgress(Array.isArray(progressProp) ? [...progressProp] : []);
  }, [progressProp]);

  useEffect(() => {
    setDismissed(new Set(Array.isArray(dismissedProp) ? dismissedProp : []));
  }, [dismissedProp]);

  const persistPreference = useCallback(
    async (input: UpdateGuidancePreferenceInput, next: GuidanceUserPreference) => {
      setPreference(next);
      await handlers?.onUpdatePreference?.(input);
    },
    [handlers],
  );

  const persistProgress = useCallback(
    async (input: UpsertGuidanceProgressInput, nextRow: GuidanceUserProgress) => {
      setProgress((prev) => {
        const idx = prev.findIndex((p) => p.tourId === nextRow.tourId);
        if (idx === -1) return [...prev, nextRow];
        const copy = [...prev];
        copy[idx] = nextRow;
        return copy;
      });
      await handlers?.onUpsertProgress?.(input);
    },
    [handlers],
  );

  const setMode = useCallback(
    (mode: GuidanceMode) => {
      void persistPreference({ mode }, { ...preference, mode });
      if (mode === "off") {
        setActiveTour(null);
        setPaused(false);
      }
    },
    [persistPreference, preference],
  );

  const findTour = useCallback(
    (tourKeyOrId: string) =>
      tours.find((t) => t.id === tourKeyOrId || t.key === tourKeyOrId) ??
      toursProp.find((t) => t.id === tourKeyOrId || t.key === tourKeyOrId) ??
      null,
    [tours, toursProp],
  );

  const startTour = useCallback(
    (tourKeyOrId: string, options?: { resume?: boolean }) => {
      const tour = findTour(tourKeyOrId);
      if (!tour || preference.mode === "off") return;
      setWelcomeOpen(false);
      setLearningOpen(false);
      setPaused(false);
      setActiveTour(tour);

      let startIndex = 0;
      if (options?.resume) {
        const row = progress.find((p) => p.tourId === tour.id);
        if (row?.status === "in_progress" && row.currentStepKey) {
          const idx = tour.steps.findIndex(
            (step: GuidanceTour["steps"][number]) => step.stepKey === row.currentStepKey,
          );
          if (idx >= 0) startIndex = idx;
        }
      }
      const step = tour.steps[startIndex];
      setActiveStepIndex(startIndex);
      setActionSatisfied(!(step?.requireAction));
      const now = new Date().toISOString();
      const version = tourContentVersion(tour);
      void persistProgress(
        {
          tourId: tour.id,
          status: "in_progress",
          currentStepKey: step?.stepKey ?? null,
          completedSteps: startIndex,
          totalSteps: tour.steps.length,
          tourVersion: version,
          pausedAt: null,
        },
        {
          tourId: tour.id,
          tourKey: tour.key,
          status: "in_progress",
          currentStepKey: step?.stepKey ?? null,
          completedSteps: startIndex,
          totalSteps: tour.steps.length,
          tourVersion: version,
          pausedAt: null,
          startedAt: now,
          lastActiveAt: now,
        },
      );
    },
    [findTour, persistProgress, preference.mode, progress],
  );

  const stopTour = useCallback(() => {
    setActiveTour(null);
    setActiveStepIndex(0);
    setActionSatisfied(false);
    setPaused(false);
  }, []);

  const skipTour = useCallback(() => {
    if (!activeTour) return;
    const now = new Date().toISOString();
    const version = tourContentVersion(activeTour);
    void persistProgress(
      {
        tourId: activeTour.id,
        status: "skipped",
        currentStepKey: activeTour.steps[activeStepIndex]?.stepKey ?? null,
        completedSteps: activeStepIndex,
        totalSteps: activeTour.steps.length,
        tourVersion: version,
        pausedAt: null,
      },
      {
        tourId: activeTour.id,
        tourKey: activeTour.key,
        status: "skipped",
        currentStepKey: activeTour.steps[activeStepIndex]?.stepKey ?? null,
        completedSteps: activeStepIndex,
        totalSteps: activeTour.steps.length,
        tourVersion: version,
        pausedAt: null,
        skippedAt: now,
        lastActiveAt: now,
      },
    );
    stopTour();
  }, [activeStepIndex, activeTour, persistProgress, stopTour]);

  const finishTour = useCallback(() => {
    if (!activeTour) return;
    const now = new Date().toISOString();
    const version = tourContentVersion(activeTour);
    void persistProgress(
      {
        tourId: activeTour.id,
        status: "completed",
        currentStepKey: null,
        completedSteps: activeTour.steps.length,
        totalSteps: activeTour.steps.length,
        tourVersion: version,
        pausedAt: null,
      },
      {
        tourId: activeTour.id,
        tourKey: activeTour.key,
        status: "completed",
        currentStepKey: null,
        completedSteps: activeTour.steps.length,
        totalSteps: activeTour.steps.length,
        tourVersion: version,
        pausedAt: null,
        completedAt: now,
        lastActiveAt: now,
      },
    );
    stopTour();
  }, [activeTour, persistProgress, stopTour]);

  const nextStep = useCallback(() => {
    if (!activeTour || paused) return;
    const step = activeTour.steps[activeStepIndex];
    const missingTarget =
      Boolean(step?.targetSelector) &&
      typeof document !== "undefined" &&
      !queryVisibleTourTarget(step?.targetSelector);
    if (step?.requireAction && !actionSatisfied && !missingTarget) return;
    const nextIndex = activeStepIndex + 1;
    if (nextIndex >= activeTour.steps.length) {
      finishTour();
      return;
    }
    const next = activeTour.steps[nextIndex]!;
    setActiveStepIndex(nextIndex);
    setActionSatisfied(!next.requireAction);
    const version = tourContentVersion(activeTour);
    void persistProgress(
      {
        tourId: activeTour.id,
        status: "in_progress",
        currentStepKey: next.stepKey,
        completedSteps: nextIndex,
        totalSteps: activeTour.steps.length,
        tourVersion: version,
      },
      {
        tourId: activeTour.id,
        tourKey: activeTour.key,
        status: "in_progress",
        currentStepKey: next.stepKey,
        completedSteps: nextIndex,
        totalSteps: activeTour.steps.length,
        tourVersion: version,
        lastActiveAt: new Date().toISOString(),
      },
    );
  }, [
    actionSatisfied,
    activeStepIndex,
    activeTour,
    finishTour,
    paused,
    persistProgress,
  ]);

  const previousStep = useCallback(() => {
    if (!activeTour || paused || activeStepIndex === 0) return;
    const prevIndex = activeStepIndex - 1;
    const prev = activeTour.steps[prevIndex]!;
    setActiveStepIndex(prevIndex);
    setActionSatisfied(!prev.requireAction);
  }, [activeStepIndex, activeTour, paused]);

  const pauseTour = useCallback(() => {
    if (!activeTour) return;
    const now = new Date().toISOString();
    setPaused(true);
    void persistProgress(
      {
        tourId: activeTour.id,
        status: "in_progress",
        currentStepKey: activeTour.steps[activeStepIndex]?.stepKey ?? null,
        completedSteps: activeStepIndex,
        totalSteps: activeTour.steps.length,
        tourVersion: tourContentVersion(activeTour),
        pausedAt: now,
      },
      {
        tourId: activeTour.id,
        tourKey: activeTour.key,
        status: "in_progress",
        currentStepKey: activeTour.steps[activeStepIndex]?.stepKey ?? null,
        completedSteps: activeStepIndex,
        totalSteps: activeTour.steps.length,
        tourVersion: tourContentVersion(activeTour),
        pausedAt: now,
        lastActiveAt: now,
      },
    );
  }, [activeStepIndex, activeTour, persistProgress]);

  const resumeTour = useCallback(() => {
    if (!activeTour) return;
    setPaused(false);
    void persistProgress(
      {
        tourId: activeTour.id,
        status: "in_progress",
        currentStepKey: activeTour.steps[activeStepIndex]?.stepKey ?? null,
        completedSteps: activeStepIndex,
        totalSteps: activeTour.steps.length,
        tourVersion: tourContentVersion(activeTour),
        pausedAt: null,
      },
      {
        tourId: activeTour.id,
        tourKey: activeTour.key,
        status: "in_progress",
        currentStepKey: activeTour.steps[activeStepIndex]?.stepKey ?? null,
        completedSteps: activeStepIndex,
        totalSteps: activeTour.steps.length,
        tourVersion: tourContentVersion(activeTour),
        pausedAt: null,
        lastActiveAt: new Date().toISOString(),
      },
    );
  }, [activeStepIndex, activeTour, persistProgress]);

  const dontShowAgain = useCallback(() => {
    if (!activeTour) {
      void persistPreference(
        { neverAutoStart: true, welcomeCompleted: true },
        {
          ...preference,
          neverAutoStart: true,
          welcomeCompletedAt: preference.welcomeCompletedAt ?? new Date().toISOString(),
        },
      );
      setWelcomeOpen(false);
      return;
    }
    const keys = Array.from(
      new Set([...(preference.suppressedTourKeys ?? []), activeTour.key]),
    );
    void persistPreference(
      { suppressedTourKeys: keys, welcomeCompleted: true },
      {
        ...preference,
        suppressedTourKeys: keys,
        welcomeCompletedAt:
          preference.welcomeCompletedAt ?? new Date().toISOString(),
      },
    );
    skipTour();
  }, [activeTour, persistPreference, preference, skipTour]);

  const completeWelcome = useCallback(
    (choice: "start" | "skip" | "never") => {
      const now = new Date().toISOString();
      if (choice === "never") {
        void persistPreference(
          { neverAutoStart: true, welcomeCompleted: true, mode: preference.mode },
          {
            ...preference,
            neverAutoStart: true,
            welcomeCompletedAt: now,
          },
        );
        setWelcomeOpen(false);
        return;
      }
      void persistPreference(
        { welcomeCompleted: true },
        { ...preference, welcomeCompletedAt: now },
      );
      setWelcomeOpen(false);
      if (choice === "start" || choice === "skip") {
        const pageTour =
          (currentPageKey
            ? tours.find(
                (t) => t.pageKey === currentPageKey && t.status === "published",
              )
            : undefined) ??
          tours.find((t) => t.key === "dashboard" && t.status === "published") ??
          tours.find((t) => t.status === "published");
        if (pageTour) startTour(pageTour.id);
      }
    },
    [currentPageKey, persistPreference, preference, startTour, tours],
  );

  const restartCurrentTour = useCallback(() => {
    if (activeTour) {
      startTour(activeTour.id);
      return;
    }
    if (currentPageKey) {
      const pageTour = tours.find(
        (t) => t.pageKey === currentPageKey && t.status === "published",
      );
      if (pageTour) startTour(pageTour.id);
    }
  }, [activeTour, currentPageKey, startTour, tours]);

  const restartAllTours = useCallback(() => {
    void handlers?.onResetProgress?.("all");
    setProgress([]);
    setDismissed(new Set());
    void persistPreference(
      {
        neverAutoStart: false,
        welcomeCompleted: false,
        suppressedTourKeys: [],
        mode: preference.mode === "off" ? "guided" : preference.mode,
      },
      {
        ...preference,
        neverAutoStart: false,
        welcomeCompletedAt: null,
        suppressedTourKeys: [],
        mode: preference.mode === "off" ? "guided" : preference.mode,
      },
    );
    autoStartedRef.current = null;
  }, [handlers, persistPreference, preference]);

  const resetTour = useCallback(
    (tourKeyOrId: string) => {
      const tour = findTour(tourKeyOrId);
      if (!tour) return;
      void handlers?.onResetProgress?.("current", tour.id);
      setProgress((prev) => prev.filter((p) => p.tourId !== tour.id));
      const keys = (preference.suppressedTourKeys ?? []).filter(
        (k) => k !== tour.key,
      );
      if (keys.length !== (preference.suppressedTourKeys ?? []).length) {
        void persistPreference(
          { suppressedTourKeys: keys },
          { ...preference, suppressedTourKeys: keys },
        );
      }
      startTour(tour.id);
    },
    [findTour, handlers, persistPreference, preference, startTour],
  );

  const dismissTip = useCallback(
    (tipId: string) => {
      setDismissed((prev) => new Set([...prev, tipId]));
      void handlers?.onDismissTip?.(tipId);
    },
    [handlers],
  );

  const openHelpCenter = useCallback(() => {
    setLearningOpen(true);
    handlers?.onOpenHelpCenter?.();
  }, [handlers]);

  const registerAction = useCallback(
    (selector: string, eventName = "click") => {
      if (!activeTour || paused) return;
      const step = activeTour.steps[activeStepIndex];
      if (!step?.requireAction) {
        setActionSatisfied(true);
        return;
      }
      const matchesSelector =
        !step.targetSelector || step.targetSelector === selector;
      const matchesEvent =
        !step.actionEvent || step.actionEvent === eventName;
      if (matchesSelector && matchesEvent) {
        setActionSatisfied(true);
      }
    },
    [activeStepIndex, activeTour, paused],
  );

  /* Auto-offer page tour when entering a module (first visit / version-stale). */
  useEffect(() => {
    if (!enabled || !autoStart || preference.mode === "off") return;
    if (welcomeOpen || activeTour) return;
    if (!currentPageKey) return;
    const offerKey = `${role ?? "any"}:${currentPageKey}`;
    if (autoStartedRef.current === offerKey) return;

    const pageTour = tours.find(
      (t) => t.pageKey === currentPageKey && t.status === "published",
    );
    if (!pageTour) return;

    const row = progress.find((p) => p.tourId === pageTour.id);
    const offer = shouldAutoOfferTour({
      tour: pageTour,
      progress: row,
      suppressedTourKeys: preference.suppressedTourKeys ?? [],
    });
    if (!offer) {
      autoStartedRef.current = offerKey;
      return;
    }

    /* Wait for the global welcome; neverAutoStart only suppresses that modal. */
    if (!preference.welcomeCompletedAt && role !== "public_visitor") return;

    autoStartedRef.current = offerKey;
    const resume = row?.status === "in_progress";
    startTour(pageTour.id, resume ? { resume: true } : undefined);
  }, [
    activeTour,
    autoStart,
    currentPageKey,
    enabled,
    preference.mode,
    preference.suppressedTourKeys,
    preference.welcomeCompletedAt,
    progress,
    role,
    startTour,
    tours,
    welcomeOpen,
  ]);

  /* Keyboard: arrows, Escape, Ctrl/⌘+Shift+G */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "g") {
        event.preventDefault();
        openHelpCenter();
        return;
      }
      if (!activeTour || preference.mode === "off") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (paused) resumeTour();
        else pauseTour();
        return;
      }
      if (paused) return;
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        nextStep();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousStep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeTour,
    nextStep,
    openHelpCenter,
    pauseTour,
    paused,
    preference.mode,
    previousStep,
    resumeTour,
  ]);

  const value = useMemo<GuidanceContextValue>(
    () => ({
      preference,
      mode: preference.mode,
      role,
      tours,
      tips,
      progress,
      dismissedTipIds: dismissed,
      currentPageKey,
      enabled,
      active: enabled && isGuidanceActive(preference.mode),
      welcomeOpen: enabled && welcomeOpen,
      learningOpen,
      activeTour,
      activeStepIndex,
      paused,
      setMode,
      setWelcomeOpen,
      setLearningOpen,
      completeWelcome,
      startTour,
      stopTour,
      nextStep,
      previousStep,
      skipTour,
      finishTour,
      pauseTour,
      resumeTour,
      restartCurrentTour,
      restartAllTours,
      dontShowAgain,
      resetTour,
      dismissTip,
      openHelpCenter,
      registerAction,
      actionSatisfied,
    }),
    [
      actionSatisfied,
      activeStepIndex,
      activeTour,
      completeWelcome,
      currentPageKey,
      dismissTip,
      dismissed,
      dontShowAgain,
      enabled,
      finishTour,
      learningOpen,
      nextStep,
      openHelpCenter,
      pauseTour,
      paused,
      preference,
      previousStep,
      progress,
      registerAction,
      resetTour,
      restartAllTours,
      restartCurrentTour,
      resumeTour,
      role,
      setMode,
      skipTour,
      startTour,
      stopTour,
      tips,
      tours,
      welcomeOpen,
    ],
  );

  return (
    <GuidanceContext.Provider value={value}>{children}</GuidanceContext.Provider>
  );
}
