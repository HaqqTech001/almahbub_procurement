import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";

import { CelebrationHost } from "./app/CelebrationHost.js";
import { RootLayout } from "./app/RootLayout.js";
import { RequireAuth } from "./auth/guards/RequireAuth.js";
import {
  WorkspaceShell,
} from "./auth/onboarding/WorkspaceShell.js";
import { HostLoading } from "./components/HostChrome.js";
import { RouteChunkErrorBoundary } from "./app/RouteChunkErrorBoundary.js";

const HomePage = lazy(() =>
  import("./pages/HomePage.js").then((m) => ({ default: m.HomePage })),
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage.js").then((m) => ({ default: m.AboutPage })),
);
const ContactPage = lazy(() =>
  import("./pages/ContactPage.js").then((m) => ({ default: m.ContactPage })),
);
const FaqPage = lazy(() =>
  import("./pages/FaqPage.js").then((m) => ({ default: m.FaqPage })),
);
const IndustriesPage = lazy(() =>
  import("./pages/IndustriesPage.js").then((m) => ({
    default: m.IndustriesPage,
  })),
);
const IndustryDetailPage = lazy(() =>
  import("./pages/IndustryDetailPage.js").then((m) => ({
    default: m.IndustryDetailPage,
  })),
);
const WorkspaceAnnouncementsPage = lazy(() =>
  import("./pages/WorkspaceAnnouncementsPage.js").then((m) => ({
    default: m.WorkspaceAnnouncementsPage,
  })),
);
const WorkspaceAnnouncementDetailPage = lazy(() =>
  import("./pages/WorkspaceAnnouncementDetailPage.js").then((m) => ({
    default: m.WorkspaceAnnouncementDetailPage,
  })),
);
const LegalPage = lazy(() =>
  import("./pages/LegalPage.js").then((m) => ({ default: m.LegalPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage.js").then((m) => ({ default: m.NotFoundPage })),
);
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage.js").then((m) => ({
    default: m.ProductDetailPage,
  })),
);
const ProcurementCategoryPage = lazy(() => import("./pages/ProcurementCategoryPage.js").then(m => ({ default: m.ProcurementCategoryPage })));
const ProductsPage = lazy(() =>
  import("./pages/ProductsPage.js").then((m) => ({ default: m.ProductsPage })),
);
const ServicesPage = lazy(() =>
  import("./pages/ServicesPage.js").then((m) => ({ default: m.ServicesPage })),
);
const ServiceDetailPage = lazy(() =>
  import("./pages/ServiceDetailPage.js").then((m) => ({ default: m.ServiceDetailPage })),
);
const GroupPage = lazy(() =>
  import("./pages/GroupPage.js").then((m) => ({ default: m.GroupPage })),
);
const BusinessPage = lazy(() =>
  import("./pages/BusinessPage.js").then((m) => ({ default: m.BusinessPage })),
);
const IntegratedExportLayout = lazy(() =>
  import("./integrated-export/IntegratedExportLayout.js").then((m) => ({
    default: m.IntegratedExportLayout,
  })),
);
const IeHomePage = lazy(() =>
  import("./integrated-export/pages/IeHomePage.js").then((m) => ({
    default: m.IeHomePage,
  })),
);
const IeCommoditiesPage = lazy(() =>
  import("./integrated-export/pages/IeCommoditiesPage.js").then((m) => ({
    default: m.IeCommoditiesPage,
  })),
);
const IeCommodityDetailPage = lazy(() =>
  import("./integrated-export/pages/IeCommodityDetailPage.js").then((m) => ({
    default: m.IeCommodityDetailPage,
  })),
);
const IeProcessPage = lazy(() =>
  import("./integrated-export/pages/IeProcessPage.js").then((m) => ({
    default: m.IeProcessPage,
  })),
);
const IeQualityPage = lazy(() =>
  import("./integrated-export/pages/IeQualityPage.js").then((m) => ({
    default: m.IeQualityPage,
  })),
);
const IeMarketsPage = lazy(() =>
  import("./integrated-export/pages/IeMarketsPage.js").then((m) => ({
    default: m.IeMarketsPage,
  })),
);
const IeAboutPage = lazy(() =>
  import("./integrated-export/pages/IeAboutPage.js").then((m) => ({
    default: m.IeAboutPage,
  })),
);
const IeContactPage = lazy(() =>
  import("./integrated-export/pages/IeContactPage.js").then((m) => ({
    default: m.IeContactPage,
  })),
);
const IeRequestPage = lazy(() =>
  import("./integrated-export/pages/IeRequestPage.js").then((m) => ({
    default: m.IeRequestPage,
  })),
);
const AnnouncementsPage = lazy(() =>
  import("./pages/AnnouncementsPage.js").then((m) => ({
    default: m.AnnouncementsPage,
  })),
);
const AnnouncementDetailPage = lazy(() =>
  import("./pages/AnnouncementDetailPage.js").then((m) => ({
    default: m.AnnouncementDetailPage,
  })),
);

const WorkspaceShellPreviewPage = lazy(() =>
  import("./e2e/WorkspaceShellPreviewPage.js").then((m) => ({
    default: m.WorkspaceShellPreviewPage,
  })),
);
const PublicHeaderAuthPreviewPage = lazy(() =>
  import("./e2e/PublicHeaderAuthPreviewPage.js").then((m) => ({
    default: m.PublicHeaderAuthPreviewPage,
  })),
);
const LoginPage = lazy(() =>
  import("./auth/pages/LoginPage.js").then((m) => ({ default: m.LoginPage })),
);
const OAuthCompletePage = lazy(() =>
  import("./auth/pages/OAuthCompletePage.js").then((m) => ({
    default: m.OAuthCompletePage,
  })),
);
const RegisterPage = lazy(() =>
  import("./auth/pages/RegisterPage.js").then((m) => ({
    default: m.RegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("./auth/pages/ForgotPasswordPage.js").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("./auth/pages/ResetPasswordPage.js").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const EmailVerificationPage = lazy(() =>
  import("./auth/pages/VerificationPages.js").then((m) => ({
    default: m.EmailVerificationPage,
  })),
);
const OtpVerificationPage = lazy(() =>
  import("./auth/pages/VerificationPages.js").then((m) => ({
    default: m.OtpVerificationPage,
  })),
);
const InvitationPage = lazy(() =>
  import("./auth/pages/InvitationPage.js").then((m) => ({
    default: m.InvitationPage,
  })),
);
const AccountLockedPage = lazy(() =>
  import("./auth/pages/StatusPages.js").then((m) => ({
    default: m.AccountLockedPage,
  })),
);
const SessionExpiredPage = lazy(() =>
  import("./auth/pages/StatusPages.js").then((m) => ({
    default: m.SessionExpiredPage,
  })),
);
const UnauthorizedPage = lazy(() =>
  import("./auth/pages/StatusPages.js").then((m) => ({
    default: m.UnauthorizedPage,
  })),
);
const AuthSettingsPage = lazy(() =>
  import("./auth/pages/AuthSettingsPage.js").then((m) => ({
    default: m.AuthSettingsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./auth/pages/ProfilePage.js").then((m) => ({
    default: m.ProfilePage,
  })),
);

const WorkspaceHomePage = lazy(() =>
  import("./auth/onboarding/WorkspaceHomePage.js").then((m) => ({
    default: m.WorkspaceHomePage,
  })),
);
const ProcurementCreatePage = lazy(() =>
  import("./procurement/ProcurementCreatePage.js").then((m) => ({
    default: m.ProcurementCreatePage,
  })),
);
const ProcurementRequestsPage = lazy(() =>
  import("./procurement/ProcurementRequestsPage.js").then((m) => ({
    default: m.ProcurementRequestsPage,
  })),
);
const ProcurementRequestDetailPage = lazy(() =>
  import("./procurement/ProcurementRequestDetailPage.js").then((m) => ({
    default: m.ProcurementRequestDetailPage,
  })),
);
const QuotationComparePage = lazy(() =>
  import("./quotations/QuotationComparePage.js").then((m) => ({
    default: m.QuotationComparePage,
  })),
);
const QuotationDetailPage = lazy(() =>
  import("./quotations/QuotationDetailPage.js").then((m) => ({
    default: m.QuotationDetailPage,
  })),
);
const QuotationHistoryPage = lazy(() =>
  import("./quotations/QuotationHistoryPage.js").then((m) => ({
    default: m.QuotationHistoryPage,
  })),
);
const QuotationsPage = lazy(() =>
  import("./quotations/QuotationsPage.js").then((m) => ({
    default: m.QuotationsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("./notifications/NotificationsPage.js").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const NotificationDetailPage = lazy(() =>
  import("./notifications/NotificationDetailPage.js").then((m) => ({
    default: m.NotificationDetailPage,
  })),
);
const BuyerAgroProducePage = lazy(() =>
  import("./procurement/BuyerAgroProducePage.js").then((m) => ({
    default: m.BuyerAgroProducePage,
  })),
);
const BuyerCommodityDetailPage = lazy(() =>
  import("./procurement/BuyerCommodityDetailPage.js").then((m) => ({
    default: m.BuyerCommodityDetailPage,
  })),
);
const WeddingLandingPage = lazy(() =>
  import("./wedding/WeddingLandingPage.js").then((m) => ({
    default: m.WeddingLandingPage,
  })),
);
const WeddingLivePage = lazy(() =>
  import("./wedding/WeddingLivePage.js").then((m) => ({
    default: m.WeddingLivePage,
  })),
);
const ShipmentDetailPage = lazy(() =>
  import("./shipments/ShipmentDetailPage.js").then((m) => ({
    default: m.ShipmentDetailPage,
  })),
);
const ShipmentsPage = lazy(() =>
  import("./shipments/ShipmentsPage.js").then((m) => ({
    default: m.ShipmentsPage,
  })),
);
const SupportChatPage = lazy(() =>
  import("./app/SupportChatPage.js").then((m) => ({
    default: m.SupportChatPage,
  })),
);
const InvoicesPage = lazy(() =>
  import("./finance/InvoicesPage.js").then((m) => ({
    default: m.InvoicesPage,
  })),
);
const PaymentsPage = lazy(() =>
  import("./finance/PaymentsPage.js").then((m) => ({
    default: m.PaymentsPage,
  })),
);

function LazyPage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RouteChunkErrorBoundary>
      <Suspense fallback={<HostLoading label="Loading page…" />}>{children}</Suspense>
    </RouteChunkErrorBoundary>
  );
}

function PublicLayout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

function BarePublicLayout() {
  return (
    <RootLayout bare>
      <Outlet />
    </RootLayout>
  );
}

function ProductSlugRedirect() {
  const { slug = "" } = useParams();
  return <Navigate to={`/product/${slug}`} replace />;
}

function page(Component: ComponentType) {
  return (
    <LazyPage>
      <Component />
    </LazyPage>
  );
}

/**
 * Production public website + authentication module.
 * Product tours mount only inside `/app` (WorkspaceShell).
 * RC9: route-level code splitting via React.lazy.
 */
export function App() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const authPath =
      /^\/(login|register|forgot-password|reset-password|verify-email|otp|invite|unauthorized|session-expired|account-locked)(\/|$)/.test(
        pathname,
      );
    if (authPath) {
      void import("./styles/auth.js");
    }
    if (pathname.startsWith("/app")) {
      void import("./styles/auth.js");
    }
    if (
      pathname === "/" ||
      pathname.startsWith("/products") ||
      pathname.startsWith("/product/") ||
      pathname.startsWith("/catalog") ||
      pathname.startsWith("/group") ||
      pathname.startsWith("/businesses")
    ) {
      void import("./styles/catalog-public.js");
    }
  }, [pathname]);

  if (pathname === "/home") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <CelebrationHost />
      <Routes>
      {/*
        Top-level explicit portal route. Must not live only as a sibling of
        `/businesses/:slug` inside PublicLayout, or footer clicks can keep
        International chrome and look like a footer scroll.
      */}
      <Route
        path="/businesses/almahbub-integrated-export"
        element={
          <RootLayout bare>
            <LazyPage>
              <IntegratedExportLayout />
            </LazyPage>
          </RootLayout>
        }
      >
        <Route index element={page(IeHomePage)} />
        <Route path="commodities" element={page(IeCommoditiesPage)} />
        <Route path="commodities/:slug" element={page(IeCommodityDetailPage)} />
        <Route path="process" element={page(IeProcessPage)} />
        <Route path="quality" element={page(IeQualityPage)} />
        <Route path="markets" element={page(IeMarketsPage)} />
        <Route path="about" element={page(IeAboutPage)} />
        <Route path="contact" element={page(IeContactPage)} />
        <Route path="request" element={page(IeRequestPage)} />
      </Route>
      <Route element={<BarePublicLayout />}>
        <Route
          path="/"
          element={
            <>
              {page(HomePage)}
            </>
          }
        />
      </Route>
      <Route
        path="/request"
        element={<Navigate to={{ pathname: "/contact", search }} replace />}
      />
      <Route path="/search" element={<Navigate to="/products" replace />} />

      <Route
        path="/__e2e__/workspace-shell"
        element={page(WorkspaceShellPreviewPage)}
      />
      <Route
        path="/__e2e__/public-header-auth"
        element={page(PublicHeaderAuthPreviewPage)}
      />
      <Route path="/login" element={page(LoginPage)} />
      <Route path="/login/oauth/complete" element={page(OAuthCompletePage)} />
      <Route path="/register" element={page(RegisterPage)} />
      <Route path="/forgot-password" element={page(ForgotPasswordPage)} />
      <Route path="/reset-password" element={page(ResetPasswordPage)} />
      <Route path="/reset-password/:token" element={page(ResetPasswordPage)} />
      <Route path="/verify-email" element={page(EmailVerificationPage)} />
      <Route path="/otp" element={page(OtpVerificationPage)} />
      <Route path="/invite/:token" element={page(InvitationPage)} />
      <Route path="/unauthorized" element={page(UnauthorizedPage)} />
      <Route path="/session-expired" element={page(SessionExpiredPage)} />
      <Route path="/rowdotul-hamd-26/live" element={page(WeddingLivePage)} />
      <Route path="/account-locked" element={page(AccountLockedPage)} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <WorkspaceShell />
          </RequireAuth>
        }
      >
        <Route index element={page(WorkspaceHomePage)} />
        <Route path="requests" element={page(ProcurementRequestsPage)} />
        <Route path="requests/new" element={page(ProcurementCreatePage)} />
        <Route path="requests/:id" element={page(ProcurementRequestDetailPage)} />
        <Route path="quotations" element={page(QuotationsPage)} />
        <Route path="quotations/compare" element={page(QuotationComparePage)} />
        <Route path="quotations/history" element={page(QuotationHistoryPage)} />
        <Route path="quotations/:id" element={page(QuotationDetailPage)} />
        <Route path="products" element={page(ProductsPage)} />
        <Route path="products/:slug" element={page(ProductDetailPage)} />
        <Route path="agro-produce" element={page(BuyerAgroProducePage)} />
        <Route path="agro-produce/:slug" element={page(BuyerCommodityDetailPage)} />
        <Route path="announcements" element={page(WorkspaceAnnouncementsPage)} />
        <Route path="announcements/:id" element={page(WorkspaceAnnouncementDetailPage)} />
        <Route path="notifications/:id" element={page(NotificationDetailPage)} />
        <Route path="notifications" element={page(NotificationsPage)} />
        <Route path="invoices" element={page(InvoicesPage)} />
        <Route path="payments" element={page(PaymentsPage)} />
        <Route path="shipments" element={page(ShipmentsPage)} />
        <Route path="shipments/:id" element={page(ShipmentDetailPage)} />
        <Route path="chat" element={page(SupportChatPage)} />
        <Route path="profile" element={page(ProfilePage)} />
        <Route path="settings" element={page(AuthSettingsPage)} />
      </Route>

      <Route path="/help" element={<Navigate to="/faq" replace />} />
      <Route element={<PublicLayout />}>
        <Route path="/announcements" element={page(AnnouncementsPage)} />
        <Route path="/announcements/:id" element={page(AnnouncementDetailPage)} />
        <Route path="/about" element={page(AboutPage)} />
        <Route path="/group" element={page(GroupPage)} />
        <Route path="/businesses" element={<Navigate to="/" replace />} />
        <Route path="/businesses/almahbub-international" element={page(BusinessPage)} />
        <Route path="/businesses/:slug" element={page(BusinessPage)} />
        <Route path="/services" element={page(ServicesPage)} />
        <Route path="/services/:slug" element={page(ServiceDetailPage)} />
        <Route path="/products" element={page(ProductsPage)} />
        <Route path="/global-procurement/category/iphones-gadgets" element={<Navigate to="/global-procurement/category/electronics-mobile-digital-technology" replace />} />
        <Route path="/global-procurement/category/:slug" element={page(ProcurementCategoryPage)} />
        <Route path="/product/:slug" element={page(ProductDetailPage)} />
        <Route path="/industries" element={page(IndustriesPage)} />
        <Route path="/industries/:slug" element={page(IndustryDetailPage)} />
        <Route path="/faq" element={page(FaqPage)} />
        <Route path="/rowdotul-hamd-26" element={page(WeddingLandingPage)} />
        <Route path="/contact" element={page(ContactPage)} />
        <Route
          path="/privacy"
          element={
            <LazyPage>
              <LegalPage kind="privacy" />
            </LazyPage>
          }
        />
        <Route
          path="/terms"
          element={
            <LazyPage>
              <LegalPage kind="terms" />
            </LazyPage>
          }
        />
        <Route
          path="/cookies"
          element={
            <LazyPage>
              <LegalPage kind="cookies" />
            </LazyPage>
          }
        />
        <Route path="/products/:slug" element={<ProductSlugRedirect />} />
        <Route path="/catalog/:slug" element={<ProductSlugRedirect />} />
        <Route path="/catalog" element={<Navigate to="/products" replace />} />
        <Route path="*" element={page(NotFoundPage)} />
      </Route>
      </Routes>
    </>
  );
}
