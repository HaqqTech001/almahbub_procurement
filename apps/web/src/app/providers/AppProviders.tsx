import type { ReactNode } from "react";
import { AccessibilityProvider } from "./AccessibilityProvider.js";
import { AnalyticsProvider } from "./AnalyticsProvider.js";
import { CommandPaletteProvider } from "./CommandPaletteProvider.js";
import { CookieConsentProvider } from "./CookieConsentProvider.js";
import { ModalProvider } from "./ModalProvider.js";
import { MotionProvider } from "./MotionProvider.js";
import { ThemeProvider } from "./ThemeProvider.js";
import { ToastProvider } from "./ToastProvider.js";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AccessibilityProvider>
      <ThemeProvider>
        <MotionProvider>
          <CookieConsentProvider>
            <AnalyticsProvider>
              <ToastProvider>
                <ModalProvider>
                  <CommandPaletteProvider>{children}</CommandPaletteProvider>
                </ModalProvider>
              </ToastProvider>
            </AnalyticsProvider>
          </CookieConsentProvider>
        </MotionProvider>
      </ThemeProvider>
    </AccessibilityProvider>
  );
}
