import { Navigate, useSearchParams } from "react-router-dom";
import { ClientWorkspaceShell } from "@hamd/ui/dashboard";
import { AnnouncementSlider } from "@hamd/ui/marketing";
import { GuideControl } from "@hamd/ui/guidance";

import { buildBuyerWorkspaceNav } from "../auth/onboarding/buyer-workspace-nav.js";
import "../styles/workspace.js";
import {
  announcementSystem,
  getActiveCampaigns,
} from "../content/campaigns.js";
import { toAnnouncementSlides } from "../lib/announcement-slides.js";
import { ProductTourHost } from "../product-tour/ProductTourHost.js";

/**
 * Visual harness for RC-POLISH-03 evidence - not linked from product chrome.
 * Available in Vite DEV, or when `VITE_E2E_SHELL_PREVIEW=true` at build time.
 */
export function WorkspaceShellPreviewPage() {
  const enabled =
    import.meta.env.DEV || import.meta.env.VITE_E2E_SHELL_PREVIEW === "true";
  const [params] = useSearchParams();
  const view = params.get("view") === "requests" ? "requests" : "dashboard";
  if (!enabled) {
    return <Navigate to="/" replace />;
  }

  const slides = toAnnouncementSlides(
    getActiveCampaigns(new Date(), {
      previewAll: true,
      system: announcementSystem,
    }),
  );

  return (
    <ProductTourHost
      variant="authenticated"
      role="client"
      currentPageKey="dashboard"
      welcomeBrandName="Almahbub International"
    >
      <ClientWorkspaceShell
        brandLabel="Almahbub International"
        brandHref="/app"
        brandLogoSrc="/almahbub.svg"
        userLabel="Ada Okoro"
        userEmail="ada.okoro@example.com"
        pageTitle={view === "requests" ? "Requests" : "Dashboard"}
        profileHref="/app/settings"
        settingsHref="/app/settings"
        notificationsHref="/app/notifications"
        notificationCount={2}
        theme="light"
        onThemeChange={() => undefined}
        onSignOut={() => undefined}
        onHelp={() => undefined}
        onSearchSubmit={() => undefined}
        banner={
          slides.length > 0 ? (
            <AnnouncementSlider
              announcements={slides}
              storagePrefix="hamd.web.e2e.campaign."
            />
          ) : null
        }
        topBarExtra={<GuideControl label="Help / Guided tour" />}
        navSections={buildBuyerWorkspaceNav(
          view === "requests" ? "/app/requests" : "/app",
        )}
      >
        {view === "requests" ? (
          <div className="hamd-workspace-home">
            <header className="hamd-workspace-home__header">
              <p className="hamd-workspace-home__eyebrow">Procurement</p>
              <h1>Requests</h1>
              <p>
                Track procurement requests, clarifications, and drafts from your
                Almahbub International workspace.
              </p>
            </header>
            <div className="hamd-workspace-home__actions">
              <a className="hamd-btn hamd-btn--primary" href="/app/requests/new">
                New procurement request
              </a>
            </div>
          </div>
        ) : (
          <div className="hamd-workspace-home">
            <header className="hamd-workspace-home__header">
              <h1>
                <span className="hamd-workspace-home__greet">Good morning,</span>
                <span className="hamd-workspace-home__name">Ada</span>
              </h1>
              <p>Track requests, quotations, and fulfilment from this workspace.</p>
            </header>
            <section className="hamd-workspace-home__metrics" aria-label="Procurement overview">
              <a className="hamd-workspace-home__metric" href="/app/requests">
                <span className="hamd-workspace-home__metric-label">Active requests</span>
                <strong className="hamd-workspace-home__metric-value">4</strong>
              </a>
              <a className="hamd-workspace-home__metric" href="/app/requests">
                <span className="hamd-workspace-home__metric-label">Action required</span>
                <strong className="hamd-workspace-home__metric-value">1</strong>
              </a>
            </section>
            <div className="hamd-workspace-home__actions">
              <a className="hamd-workspace-home__action hamd-workspace-home__action--primary" href="/app/requests/new">
                New request
              </a>
              <a className="hamd-workspace-home__action" href="/app/requests">
                My requests
              </a>
            </div>
          </div>
        )}
      </ClientWorkspaceShell>
    </ProductTourHost>
  );
}
