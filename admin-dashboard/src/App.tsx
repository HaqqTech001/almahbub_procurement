import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { Layout } from '@/components/layout/Layout';
import  LoginPage  from '@/pages/auth/LoginPage';
import  DashboardPage  from '@/pages/DashboardPage';
import  RequestsPage  from '@/pages/RequestsPage';
import  RequestDetailPage  from '@/pages/RequestDetailPage';
import  UsersPage  from '@/pages/UsersPage';
import  CategoriesPage  from '@/pages/CategoriesPage';
import  ProductsPage  from '@/pages/ProductsPage';
import  ChatPage  from '@/pages/ChatPage';
import  TrackersPage  from '@/pages/TrackersPage';
import  AnnouncementsPage  from '@/pages/AnnouncementsPage';
import  CreateAnnouncementPage  from '@/pages/CreateAnnouncementPage';
import  EditAnnouncementPage  from '@/pages/EditAnnouncementPage';
import  AIAssistantPage  from '@/pages/AIAssistantPage';
import  SettingsPage  from '@/pages/SettingsPage';
import  NotificationsPage  from '@/pages/NotificationsPage';
import  NotFoundPage  from '@/pages/NotFoundPage';
import { Toaster } from '@/components/ui/toaster';
import './index.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="h-screen bg-background overflow-hidden">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard */}
                <Route path="/" element={<DashboardPage />} />
                
                {/* Requests Management */}
                <Route path="requests" element={<RequestsPage />} />
                <Route path="requests/:id" element={<RequestDetailPage />} />
                
                {/* User Management */}
                <Route path="users" element={<UsersPage />} />
                
                {/* Product Management */}
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="products" element={<ProductsPage />} />
                
                {/* Communication */}
                <Route path="chat" element={<ChatPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                
                {/* Tracking & Updates */}
                <Route path="trackers" element={<TrackersPage />} />
                
                {/* Content Management */}
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="announcements/create" element={<CreateAnnouncementPage />} />
                <Route path="announcements/edit/:id" element={<EditAnnouncementPage />} />
                <Route path="ai-assistant" element={<AIAssistantPage />} />
                
                {/* Settings */}
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              
              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;