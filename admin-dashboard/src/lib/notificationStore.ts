import { create } from 'zustand';
import { apiClient } from '@/lib/api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  
  // API actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) => {
    set({ 
      notifications,
      unreadCount: notifications.filter(n => !n.is_read).length 
    });
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
  })),

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.getNotifications();
      
      if (response.success && response.data) {
        const notifications = response.data.notifications || [];
        const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
        set({ notifications, unreadCount, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));

      await apiClient.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert on error - refetch
      get().fetchNotifications();
    }
  },

  markAllAsRead: async () => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));

      await apiClient.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Revert on error - refetch
      get().fetchNotifications();
    }
  },
}));
