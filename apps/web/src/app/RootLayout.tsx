import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { AnnouncementSlider } from "@hamd/ui/marketing";
import type { AnnouncementSlide } from "@hamd/ui/marketing";
import { PublicPageFrame, PublicWebsiteShell } from "@hamd/ui/layouts";

import { useTheme } from "./providers/ThemeProvider.js";
import { announcementSystem } from "../content/campaigns.js";
import { homepageFooter } from "../content/homepage.js";
import {
  getDatedCampaignSlides,
  loadPublicAnnouncementSlides,
} from "../lib/load-public-announcements.js";
import { usePublicHeaderProps } from "../lib/use-public-header-props.js";
import { subscribeNewsletter, newsletterSuccessMessage } from "../lib/newsletter.js";
import { CookieConsentBanner } from "../components/CookieConsentBanner.js";
import { PageTransition } from "../components/PageTransition.js";

export type RootLayoutProps = {
  children: ReactNode;
  /** Homepage / Integrated Export own portal chrome; still receive the global strip. */
  bare?: boolean | undefined;
};

/**
 * Shared public application shell.
 * Mounts the global announcement once above every public portal navbar.
 */
export function RootLayout({ children, bare = false }: RootLayoutProps) {
  const { theme, setTheme } = useTheme();
  const header = usePublicHeaderProps({
    theme,
    onThemeChange: setTheme,
    transparentUntilScroll: false,
  });
  const location = useLocation();
  const navigationType = useNavigationType();
  const [announcementSlides, setAnnouncementSlides] = useState<AnnouncementSlide[]>(
    () => getDatedCampaignSlides(),
  );

  useEffect(() => {
    let cancelled = false;
    void loadPublicAnnouncementSlides().then((slides) => {
      if (!cancelled) setAnnouncementSlides(slides);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (navigationType === "POP") return;
    if (location.hash) return;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.hash, navigationType]);

  const banner =
    announcementSlides.length > 0 ? (
      <AnnouncementSlider
        announcements={announcementSlides}
        storagePrefix={announcementSystem.storagePrefix}
        autoRotateMs={2500}
        chrome="minimal"
      />
    ) : null;

  if (bare) {
    return (
      <PublicPageFrame showSkipLink={false} banner={banner} className="hamd-public-frame--bare">
        {children}
        <CookieConsentBanner />
      </PublicPageFrame>
    );
  }

  return (
    <PublicPageFrame showSkipLink={false} banner={banner}>
      <PublicWebsiteShell
        className="hamd-public-shell"
        header={header}
        footer={{
          ...homepageFooter,
          onNewsletterSubmit: async (email: string) => {
            await subscribeNewsletter(email);
          },
          newsletterSuccessMessage,
        }}
      >
        <PageTransition>{children}</PageTransition>
      </PublicWebsiteShell>
      <CookieConsentBanner />
    </PublicPageFrame>
  );
}
