import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();
  const {
    addMessage,
    setConnected,
    fetchUnreadCount,
    setUnreadCount
  } = useChatStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const unreadCountFetched = useRef(false);
  const notificationCallbackRef = useRef<((notification: any) => void) | null>(null);

  // Register notification callback for other components to use
  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      if (notificationCallbackRef.current) {
        notificationCallbackRef.current(notification);
      }
    };
    
    return () => {
      notificationCallbackRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Determine the correct socket URL for the current environment
      const getSocketUrl = () => {
        // Priority 1: Use dedicated socket URL environment variable if available
        if (import.meta.env.VITE_SOCKET_URL) {
          return import.meta.env.VITE_SOCKET_URL;
        }
        
        // Priority 2: Extract from API URL by removing the /api/v1 path
        if (import.meta.env.VITE_API_URL) {
          const apiUrl = import.meta.env.VITE_API_URL;
          // Remove /api/v1 or /api prefix if present
          const baseUrl = apiUrl.replace(/\/api(\/v\d+)?\/?$/, '');
          return baseUrl || apiUrl;
        }
        
        // Priority 3: Default to localhost for development
        return 'http://localhost:5000';
      };

      const socketUrl = getSocketUrl();
      
      // Initialize socket connection with production-optimized settings
      const socketInstance = io(socketUrl, {
        auth: {
          token,
        },
        // Use polling first for better compatibility with proxies and load balancers
        transports: ['polling', 'websocket'],
        // Enable automatic reconnection
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        // Timeout for connection establishment
        timeout: 30000,
        // Keep connection alive
        pingTimeout: 60000,
        pingInterval: 25000,
      });

      setSocket(socketInstance);

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully to:', socketUrl);
        setConnected(true);
        unreadCountFetched.current = false;
        fetchUnreadCount();
        unreadCountFetched.current = true;
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
        
        // Attempt to reconnect if disconnected unexpectedly
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, manually reconnect
          socketInstance.connect();
        }
      });

      socketInstance.on('connect_error', (error) => {
        // Log connection errors for debugging
        console.warn('Socket connection error:', error.message);
        console.warn('Socket URL:', socketUrl);
        setConnected(false);
      });

      // Chat event handlers
      socketInstance.on('new_message', (message) => {
        const conversationKey = message.orderId ? `${message.senderId}-${message.orderId}` : message.senderId.toString();
        addMessage(conversationKey, message);

        // Only increment count if the message was received (not sent by current user)
        // and only if it's not an AI response
        if (message.receiverId === parseInt(token?.sub || '0') && !message.isAIResponse) {
          // Refetch the accurate count from the server
          fetchUnreadCount();
        }
      });

      socketInstance.on('ai_response', (message) => {
        const conversationKey = message.orderId ? `${message.receiverId}-${message.orderId}` : message.receiverId.toString();
        addMessage(conversationKey, message);
      });

      // Handle unread count updates from server
      // Only update if we haven't fetched from API yet to avoid race conditions
      socketInstance.on('unread_count', (data) => {
        if (!unreadCountFetched.current && typeof data.count === 'number') {
          setUnreadCount(data.count);
        }
      });

      // Handle real-time notifications
      socketInstance.on('notification', (notification) => {
        console.log('Real-time notification received:', notification);
        
        // Trigger notification callback if registered
        if (notificationCallbackRef.current) {
          notificationCallbackRef.current(notification);
        }
        
        // Also dispatch a custom event for components that can't use the callback
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('socket_notification', { detail: notification }));
        }
      });

      // Handle announcement notifications
      socketInstance.on('announcement_notification', (data) => {
        console.log('Announcement notification received:', data);
        
        const notification = {
          id: data.id || Date.now(),
          title: 'New Announcement',
          message: data.title || 'A new announcement has been posted',
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
          data: { announcementId: data.announcementId }
        };
        
        if (notificationCallbackRef.current) {
          notificationCallbackRef.current(notification);
        }
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('socket_notification', { detail: notification }));
        }
      });

      // Handle order/request notifications
      socketInstance.on('order_notification', (data) => {
        console.log('Order notification received:', data);
        
        const notification = {
          id: data.id || Date.now(),
          title: data.title || 'Request Update',
          message: data.message || 'Your request status has been updated',
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
          data: { requestId: data.requestId, status: data.status }
        };
        
        if (notificationCallbackRef.current) {
          notificationCallbackRef.current(notification);
        }
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('socket_notification', { detail: notification }));
        }
      });

      return () => {
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, token, addMessage, setConnected, fetchUnreadCount, setUnreadCount]);

  const value = {
    socket,
    isConnected: socket?.connected || false,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;