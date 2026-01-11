import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  onNotification: (callback: (notification: Notification) => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// LocalStorage key for persisted notification read statuses
const NOTIFICATION_READ_STATUS_KEY = 'notification_read_status';

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Helper to get persisted read statuses from localStorage
const getPersistedReadStatus = (): Record<number, boolean> => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_READ_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Helper to save read status to localStorage
const saveReadStatus = (notificationId: number, isRead: boolean) => {
  try {
    const status = getPersistedReadStatus();
    status[notificationId] = isRead;
    localStorage.setItem(NOTIFICATION_READ_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Failed to save notification read status:', error);
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isAuthenticated } = useAuthContext();
  
  // Load persisted read statuses on mount
  const [persistedReadStatus, setPersistedReadStatus] = useState<Record<number, boolean>>({});
  
  // Callback for real-time notifications
  const notificationCallbackRef = React.useRef<((notification: Notification) => void) | null>(null);

  // Listen for real-time socket notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleSocketNotification = (event: CustomEvent) => {
      const notification = event.detail as Notification;
      console.log('Received real-time notification:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Trigger callback if registered
      if (notificationCallbackRef.current) {
        notificationCallbackRef.current(notification);
      }
    };
    
    // Listen for custom event from SocketContext
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.title) {
        handleSocketNotification(customEvent as unknown as CustomEvent<Notification>);
      }
    };
    
    window.addEventListener('socket_notification', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('socket_notification', handleCustomEvent as EventListener);
    };
  }, [isAuthenticated]);

  // Load persisted read status
  useEffect(() => {
    const status = getPersistedReadStatus();
    setPersistedReadStatus(status);
  }, []);

  // Fetch notifications on mount (only when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const unreadCount = notifications.filter(n => !persistedReadStatus[n.id] && !n.read).length;

  const fetchNotifications = async () => {
    try {
      // Try to fetch from API first
      const response = await apiClient.getNotifications();
      
      if (response.success && response.data?.notifications) {
        // Merge API data with persisted read status
        const apiNotifications = response.data.notifications;
        const readStatus = getPersistedReadStatus();
        
        // Apply persisted read status to notifications
        const mergedNotifications = apiNotifications.map((n: Notification) => ({
          ...n,
          read: n.read || readStatus[n.id] || false
        }));
        
        setNotifications(mergedNotifications);
        return;
      }
      
      // If no real data, use empty array
      console.log('No notifications from API, using empty state');
      setNotifications([]);
    } catch (error) {
      // On error, use empty array
      console.log('Failed to fetch notifications, using empty state');
      setNotifications([]);
    }
  };

  const markAsRead = async (id: number) => {
    // Save to localStorage immediately
    saveReadStatus(id, true);
    setPersistedReadStatus(prev => ({ ...prev, [id]: true }));
    
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
      // Note: We keep the localStorage update even if API fails
      // so the user's experience is preserved
    }
  };

  const markAllAsRead = async () => {
    // Save all current notification IDs as read to localStorage
    const currentIds = notifications.map(n => n.id);
    const readStatus = getPersistedReadStatus();
    currentIds.forEach(id => {
      readStatus[id] = true;
    });
    localStorage.setItem(NOTIFICATION_READ_STATUS_KEY, JSON.stringify(readStatus));
    setPersistedReadStatus(readStatus);
    
    // Optimistic update - update local state first
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // Sync with API
    try {
      await apiClient.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Note: We keep the localStorage update even if API fails
    }
  };

  const removeNotification = (id: number) => {
    // Remove from localStorage
    const readStatus = getPersistedReadStatus();
    delete readStatus[id];
    localStorage.setItem(NOTIFICATION_READ_STATUS_KEY, JSON.stringify(readStatus));
    setPersistedReadStatus(readStatus);
    
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Register callback for real-time notifications
  const onNotification = useCallback((callback: (notification: Notification) => void) => {
    notificationCallbackRef.current = callback;
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    fetchNotifications,
    onNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
