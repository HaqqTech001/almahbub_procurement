import type { ReactNode } from "react";
import {
  GuidanceProvider,
  type GuidanceHandlers,
  type GuidanceProviderProps,
} from "./GuidanceProvider.js";
import { WelcomeModal } from "./WelcomeModal.js";
import { GuideControl } from "./GuideControl.js";
import { TourRunner } from "./TourRunner.js";
import { LearningCenter } from "./LearningCenter.js";
import { FeatureDiscovery } from "./FeatureDiscovery.js";
import { SmartHelp } from "./SmartHelp.js";

export type GuidanceRootProps = Omit<GuidanceProviderProps, "children" | "handlers"> & {
  children: ReactNode;
  handlers?: GuidanceHandlers | undefined;
  /** When false, engine chrome is omitted (e.g. route shells that only need context). */
  showChrome?: boolean | undefined;
  welcomeBrandName?: string | undefined;
  /** First-login welcome modal. Default true for authenticated hosts. */
  showWelcome?: boolean | undefined;
  showLearningCenter?: boolean | undefined;
  showFeatureDiscovery?: boolean | undefined;
  showSmartHelp?: boolean | undefined;
};

/**
 * Host entry for the Interactive Product Tour / Guidance engine.
 * Authenticated shells use full chrome; public visitor hosts can omit welcome/tips.
 */
export function GuidanceRoot({
  children,
  handlers,
  showChrome = true,
  welcomeBrandName,
  showWelcome = true,
  showLearningCenter = true,
  showFeatureDiscovery = true,
  showSmartHelp = true,
  ...providerProps
}: GuidanceRootProps) {
  return (
    <GuidanceProvider {...providerProps} handlers={handlers}>
      {children}
      {showChrome && providerProps.enabled !== false ? (
        <>
          {showWelcome ? (
            <WelcomeModal
              {...(welcomeBrandName ? { brandName: welcomeBrandName } : {})}
            />
          ) : null}
          <TourRunner />
          {showLearningCenter ? <LearningCenter /> : null}
          {showFeatureDiscovery ? <FeatureDiscovery /> : null}
          {showSmartHelp ? <SmartHelp /> : null}
        </>
      ) : null}
    </GuidanceProvider>
  );
}

export { GuideControl };
