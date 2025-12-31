import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuthContext } from '@/contexts/AuthContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isAuthenticated } = useAuthContext();

  // Fetch notifications on mount (only when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      // Try to fetch from API first
      const response = await apiClient.getNotifications();
      
      if (response.success && response.data?.notifications) {
        // Use real data from API
        setNotifications(response.data.notifications);
        return;
      }
      
      // If no real data, use empty array instead of random mock data
      console.log('No notifications from API, using empty state');
      setNotifications([]);
    } catch (error) {
      // On error, use empty array instead of mock data
      // This prevents the re-render issue with random mock data
      console.log('Failed to fetch notifications, using empty state');
      setNotifications([]);
    }
  };

  const markAsRead = async (id: number) => {
    // Optimistic update - update local state first
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Sync with API
    try {
      await apiClient.markNotificationAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Refetch to get correct state from server
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update - update local state first
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // Sync with API
    try {
      await apiClient.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Refetch to get correct state from server
      fetchNotifications();
    }
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};