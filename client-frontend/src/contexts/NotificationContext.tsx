import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

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

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (e) {
        console.error('Failed to parse saved notifications:', e);
        fetchNotifications();
      }
    } else {
      fetchNotifications();
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      // Try to fetch from API first
      const response = await apiClient.getNotifications();
      
      if (response.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
        return;
      }
      
      // Fall back to mock data if API not available
      throw new Error('Using mock data');
    } catch (error) {
      // Use mock data with random read status to simulate real data
      const mockNotifications: Notification[] = [
        {
          id: 1,
          title: 'Request Update',
          message: 'Your procurement request REQ-2025001 has been updated to "In Discussion" status.',
          type: 'info',
          read: Math.random() > 0.5, // Randomize to simulate real data
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          title: 'New Message',
          message: 'You have received a new message from the procurement team.',
          type: 'info',
          read: Math.random() > 0.5,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          title: 'Request Completed',
          message: 'Your furniture procurement request has been completed successfully.',
          type: 'success',
          read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 4,
          title: 'Payment Received',
          message: 'Your payment for order #12345 has been processed successfully.',
          type: 'success',
          read: Math.random() > 0.5,
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setNotifications(mockNotifications);
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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