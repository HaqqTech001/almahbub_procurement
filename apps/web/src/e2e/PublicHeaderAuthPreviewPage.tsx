import { Navigate } from "react-router-dom";
import { GlobalHeader } from "@hamd/ui/navigation";
import { HomepageHero } from "@hamd/ui/homepage";

import { homepageHero, homepageHeader } from "../content/homepage.js";
import { buildAuthenticatedPublicHeaderLinks } from "../lib/use-public-header-props.js";

/**
 * DEV/E2E harness: authenticated public header over the hero.
 * Verifies account menu open/close does not permanently obscure content.
 */
export function PublicHeaderAuthPreviewPage() {
  const enabled =
    import.meta.env.DEV || import.meta.env.VITE_E2E_SHELL_PREVIEW === "true";
  if (!enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="hamd-public-frame">
      <GlobalHeader
        {...homepageHeader}
        brandLogoSrc="/almahbub.svg"
        brandLogoAlt="Almahbub International"
        brandHref="/app"
        links={buildAuthenticatedPublicHeaderLinks(homepageHeader.links ?? [], true)}
        requestCta={null}
        languageOptions={[]}
        transparentUntilScroll={false}
        notificationCount={2}
        auth={{
          authenticated: true,
          userLabel: "Ada Okoro",
          avatarUrl: null,
          dashboardHref: "/app",
          profileHref: "/app/settings",
          settingsHref: "/app/settings",
          notificationsHref: "/app/notifications",
          onSignOut: () => undefined,
        }}
      />
      <main id="main-content">
        <HomepageHero {...homepageHero} statistics={[]} animateCounters={false} />
      </main>
    </div>
  );
}
