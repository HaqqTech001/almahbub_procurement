import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./auth/guards/RequireAuth.js";
import { RequireOpsAccess } from "./auth/guards/RequireOpsAccess.js";
import { ForgotPasswordPage } from "./auth/pages/ForgotPasswordPage.js";
import { LoginPage } from "./auth/pages/LoginPage.js";
import { ResetPasswordPage } from "./auth/pages/ResetPasswordPage.js";
import {
  AccountLockedPage,
  SessionExpiredPage,
  UnauthorizedPage,
} from "./auth/pages/StatusPages.js";
import { AdminShell } from "./shell/AdminShell.js";
import { OpsLoading } from "./components/OpsChrome.js";
import { RouteChunkErrorBoundary } from "./components/RouteChunkErrorBoundary.js";

const DashboardPage = lazy(() =>
  import("./modules/DashboardPage.js").then((m) => ({ default: m.DashboardPage })),
);
const AccountPage = lazy(() =>
  import("./modules/AccountPage.js").then((m) => ({ default: m.AccountPage })),
);
const AuditPage = lazy(() =>
  import("./modules/AuditPage.js").then((m) => ({ default: m.AuditPage })),
);
const CategoriesPage = lazy(() =>
  import("./modules/CategoriesPage.js").then((m) => ({ default: m.CategoriesPage })),
);
const CategoryDetailPage = lazy(() =>
  import("./modules/CategoryDetailPage.js").then((m) => ({ default: m.CategoryDetailPage })),
);
const CategoryFormPage = lazy(() =>
  import("./modules/CategoryFormPage.js").then((m) => ({ default: m.CategoryFormPage })),
);
const CmsPage = lazy(() =>
  import("./modules/CmsPage.js").then((m) => ({ default: m.CmsPage })),
);
const AnnouncementFormPage = lazy(() =>
  import("./modules/AnnouncementFormPage.js").then((m) => ({
    default: m.AnnouncementFormPage,
  })),
);
const AnnouncementDetailPage = lazy(() =>
  import("./modules/AnnouncementDetailPage.js").then((m) => ({
    default: m.AnnouncementDetailPage,
  })),
);
const InvoicesPage = lazy(() =>
  import("./modules/InvoicesPage.js").then((m) => ({ default: m.InvoicesPage })),
);
const NotificationsPage = lazy(() =>
  import("./modules/NotificationsPage.js").then((m) => ({ default: m.NotificationsPage })),
);
const NotificationDetailPage = lazy(() =>
  import("./modules/NotificationDetailPage.js").then((m) => ({
    default: m.NotificationDetailPage,
  })),
);
const UsersPage = lazy(() =>
  import("./modules/UsersPage.js").then((m) => ({ default: m.UsersPage })),
);
const OrganizationsPage = lazy(() =>
  import("./modules/OrganizationsPage.js").then((m) => ({ default: m.OrganizationsPage })),
);
const OrganizationDetailPage = lazy(() =>
  import("./modules/OrganizationsPage.js").then((m) => ({
    default: m.OrganizationDetailPage,
  })),
);
const UserDetailPage = lazy(() =>
  import("./modules/UserDetailPage.js").then((m) => ({ default: m.UserDetailPage })),
);
const PaymentsPage = lazy(() =>
  import("./modules/PaymentsPage.js").then((m) => ({ default: m.PaymentsPage })),
);
const PaymentDetailPage = lazy(() =>
  import("./modules/PaymentDetailPage.js").then((m) => ({
    default: m.PaymentDetailPage,
  })),
);
const InvoiceDetailPage = lazy(() =>
  import("./modules/InvoiceDetailPage.js").then((m) => ({
    default: m.InvoiceDetailPage,
  })),
);
const ProductsPage = lazy(() =>
  import("./modules/ProductsPage.js").then((m) => ({ default: m.ProductsPage })),
);
const ProductDetailPage = lazy(() =>
  import("./modules/ProductDetailPage.js").then((m) => ({ default: m.ProductDetailPage })),
);
const ProductFormPage = lazy(() =>
  import("./modules/ProductFormPage.js").then((m) => ({ default: m.ProductFormPage })),
);
const IeCommoditiesPage = lazy(() =>
  import("./modules/IeCommoditiesPage.js").then((m) => ({ default: m.IeCommoditiesPage })),
);
const QuotationsPage = lazy(() =>
  import("./modules/QuotationsPage.js").then((m) => ({ default: m.QuotationsPage })),
);
const RequestsPage = lazy(() =>
  import("./modules/RequestsPage.js").then((m) => ({ default: m.RequestsPage })),
);
const RequestDetailPage = lazy(() =>
  import("./modules/RequestDetailPage.js").then((m) => ({ default: m.RequestDetailPage })),
);
const ShipmentsPage = lazy(() =>
  import("./modules/ShipmentsPage.js").then((m) => ({ default: m.ShipmentsPage })),
);
const SupportPage = lazy(() =>
  import("./modules/SupportPage.js").then((m) => ({ default: m.SupportPage })),
);
const WeddingCampaignPage = lazy(() =>
  import("./modules/WeddingCampaignPage.js").then((m) => ({ default: m.WeddingCampaignPage })),
);
const WeddingBroadcastStudioPage = lazy(() =>
  import("./modules/WeddingBroadcastStudioPage.js").then((m) => ({
    default: m.WeddingBroadcastStudioPage,
  })),
);
const GuidanceAdminPage = lazy(() =>
  import("./modules/GuidanceAdminPage.js").then((m) => ({
    default: m.GuidanceAdminPage,
  })),
);
const AiAssistantPage = lazy(() =>
  import("./modules/AiAssistantPage.js").then((m) => ({ default: m.AiAssistantPage })),
);

function page(Component: ComponentType) {
  return (
    <RouteChunkErrorBoundary>
      <Suspense fallback={<OpsLoading label="Loading page…" />}>
        <Component />
      </Suspense>
    </RouteChunkErrorBoundary>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />
      <Route path="/account-locked" element={<AccountLockedPage />} />

      <Route
        path="/wedding/studio"
        element={
          <RequireAuth>
            <RequireOpsAccess>
              {page(WeddingBroadcastStudioPage)}
            </RequireOpsAccess>
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireAuth>
            <RequireOpsAccess>
              <AdminShell />
            </RequireOpsAccess>
          </RequireAuth>
        }
      >
        <Route path="/" element={page(DashboardPage)} />
        <Route path="/account" element={page(AccountPage)} />
        <Route path="/users/:userId" element={page(UserDetailPage)} />
        <Route path="/users" element={page(UsersPage)} />
        <Route path="/organizations/:id" element={page(OrganizationDetailPage)} />
        <Route path="/organizations" element={page(OrganizationsPage)} />
        <Route path="/products/new" element={page(ProductFormPage)} />
        <Route path="/products/:id/edit" element={page(ProductFormPage)} />
        <Route path="/products/:id" element={page(ProductDetailPage)} />
        <Route path="/products" element={page(ProductsPage)} />
        <Route path="/categories/new" element={page(CategoryFormPage)} />
        <Route path="/categories/:id/edit" element={page(CategoryFormPage)} />
        <Route path="/categories/:id" element={page(CategoryDetailPage)} />
        <Route path="/categories" element={page(CategoriesPage)} />
        <Route path="/integrated-export/commodities" element={page(IeCommoditiesPage)} />
        <Route path="/integrated-export/commodities/:id" element={page(IeCommoditiesPage)} />
        <Route path="/requests" element={page(RequestsPage)} />
        <Route path="/requests/:id" element={page(RequestDetailPage)} />
        <Route path="/quotations" element={page(QuotationsPage)} />
        <Route path="/invoices/:id" element={page(InvoiceDetailPage)} />
        <Route path="/invoices" element={page(InvoicesPage)} />
        <Route path="/payments/:id" element={page(PaymentDetailPage)} />
        <Route path="/payments" element={page(PaymentsPage)} />
        <Route path="/shipments" element={page(ShipmentsPage)} />
        <Route path="/notifications/:id" element={page(NotificationDetailPage)} />
        <Route path="/notifications" element={page(NotificationsPage)} />
        <Route path="/cms/new" element={page(AnnouncementFormPage)} />
        <Route path="/cms/:id/edit" element={page(AnnouncementFormPage)} />
        <Route path="/cms/:id" element={page(AnnouncementDetailPage)} />
        <Route path="/cms" element={page(CmsPage)} />
        <Route path="/guidance-admin" element={page(GuidanceAdminPage)} />
        <Route path="/ai-assistant/new" element={page(AiAssistantPage)} />
        <Route path="/ai-assistant/:id/edit" element={page(AiAssistantPage)} />
        <Route path="/ai-assistant/:id" element={page(AiAssistantPage)} />
        <Route path="/ai-assistant" element={page(AiAssistantPage)} />
        <Route path="/audit" element={page(AuditPage)} />
        <Route path="/support" element={page(SupportPage)} />
        <Route path="/wedding" element={page(WeddingCampaignPage)} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
