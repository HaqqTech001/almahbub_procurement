import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { TutorialProvider, useTutorial } from '@/contexts/TutorialContext';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/authStore';

// ScrollToTop Component - Automatically scrolls to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top of the page immediately (instant scroll for better reliability)
    window.scrollTo(0, 0);
    
    // Also reset html/body scroll position for better browser support
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

// Onboarding Components
import TutorialManager from '@/components/Onboarding/TutorialManager';
import TutorialTrigger from '@/components/Onboarding/TutorialTrigger';
import WelcomeModal from '@/components/Onboarding/WelcomeModal';

// Pages
import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import ServicesPage from '@/pages/CategoriesPage';
import SubcategoriesPage from '@/pages/SubcategoriesPage';
import CategoryDetailPage from '@/pages/CategoryDetailPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CreateRequestPage from '@/pages/CreateRequestPage';
import MyRequestsPage from '@/pages/MyRequestsPage';
import RequestDetailPage from '@/pages/RequestDetailPage';
import ProfilePage from '@/pages/ProfilePage';
import ChatPage from '@/pages/ChatPage';
import ClientChatPage from '@/pages/ClientChatPage';
import ChatbotSettingsPage from '@/pages/ChatbotSettingsPage';
import CreateAnnouncementPage from '@/pages/CreateAnnouncementPage';
import AboutPage from '@/pages/AboutPage';
import FAQPage from '@/pages/FAQPage';
import ContactPage from '@/pages/ContactPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import AnnouncementDetailPage from '@/pages/AnnouncementDetailPage';
import HelpPage from '@/pages/HelpPage';
import NotificationsPage from '@/pages/NotificationsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Layout Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  return <>{children}</>;
};

// Layout wrapper to conditionally show/hide footer
const LayoutWrapper: React.FC<{ children: React.ReactNode; showFooter?: boolean }> = ({ 
  children, 
  showFooter = true 
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

// Content wrapper that handles redirects
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <Routes>
      {/* Public Routes - with Footer */}
      <Route path="/" element={
        <LayoutWrapper showFooter={true}>
          <HomePage />
        </LayoutWrapper>
      } />
      <Route path="/login" element={
        <LayoutWrapper showFooter={true}>
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        </LayoutWrapper>
      } />
      <Route path="/register" element={
        <LayoutWrapper showFooter={true}>
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        </LayoutWrapper>
      } />
      <Route path="/forgot-password" element={
        <LayoutWrapper showFooter={true}>
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        </LayoutWrapper>
      } />
      <Route path="/reset-password/:token" element={
        <LayoutWrapper showFooter={true}>
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        </LayoutWrapper>
      } />
      <Route path="/verify-email/:token" element={
        <LayoutWrapper showFooter={true}>
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        </LayoutWrapper>
      } />
      <Route path="/services" element={
        <LayoutWrapper showFooter={true}>
          <ServicesPage />
        </LayoutWrapper>
      } />
      <Route path="/category/:slug" element={
        <LayoutWrapper showFooter={true}>
          <CategoryDetailPage />
        </LayoutWrapper>
      } />
      <Route path="/category/:slug/subcategories" element={
        <LayoutWrapper showFooter={true}>
          <SubcategoriesPage />
        </LayoutWrapper>
      } />
      <Route path="/product/:id" element={
        <LayoutWrapper showFooter={true}>
          <ProductDetailPage />
        </LayoutWrapper>
      } />
      <Route path="/about" element={
        <LayoutWrapper showFooter={true}>
          <AboutPage />
        </LayoutWrapper>
      } />
      <Route path="/faq" element={
        <LayoutWrapper showFooter={true}>
          <FAQPage />
        </LayoutWrapper>
      } />
      <Route path="/contact" element={
        <LayoutWrapper showFooter={true}>
          <ContactPage />
        </LayoutWrapper>
      } />
      <Route path="/privacy" element={
        <LayoutWrapper showFooter={true}>
          <PrivacyPage />
        </LayoutWrapper>
      } />
      <Route path="/terms" element={
        <LayoutWrapper showFooter={true}>
          <TermsPage />
        </LayoutWrapper>
      } />
      <Route path="/announcement/:id" element={
        <LayoutWrapper showFooter={true}>
          <AnnouncementDetailPage />
        </LayoutWrapper>
      } />
      <Route path="/help" element={
        <LayoutWrapper showFooter={true}>
          <HelpPage />
        </LayoutWrapper>
      } />
      <Route path="/dashboard" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      <Route path="/create-request" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <CreateRequestPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      <Route path="/my-requests" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <MyRequestsPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      <Route path="/request/:id" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <RequestDetailPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      <Route path="/profile" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      {/* Chat Routes */}
      <Route path="/chat" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      {/* Client Chat Page - NO FOOTER */}
      <Route path="/client-chat" element={
        <LayoutWrapper showFooter={false}>
          <ProtectedRoute>
            <ClientChatPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      {/* Chatbot Settings (Admin) */}
      <Route path="/chatbot-settings" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <ChatbotSettingsPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      {/* Create/Edit Announcement */}
      <Route path="/announcement/create" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <CreateAnnouncementPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      <Route path="/announcement/edit/:id" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <CreateAnnouncementPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      {/* Notifications Page */}
      <Route path="/notifications" element={
        <LayoutWrapper showFooter={true}>
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        </LayoutWrapper>
      } />
      {/* 404 Page */}
      <Route path="*" element={
        <LayoutWrapper showFooter={true}>
          <NotFoundPage />
        </LayoutWrapper>
      } />
    </Routes>
  );
};

function App() {
  // WelcomeModal wrapper component
  const WelcomeModalWrapper: React.FC = () => {
    const { showWelcome, setShowWelcome } = useTutorial();
    
    const handleClose = () => {
      setShowWelcome(false);
    };
    
    return <WelcomeModal isOpen={showWelcome} onClose={handleClose} />;
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="almahbub-client-theme">
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <Router>
                <ScrollToTop />
                <TutorialProvider>
                  <Toaster />
                  <TutorialManager />
                  <TutorialTrigger />
                  <WelcomeModalWrapper />
                  <AppContent />
                </TutorialProvider>
              </Router>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;