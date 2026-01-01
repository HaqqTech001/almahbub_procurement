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
    throw new Error('useSocketContext must be used within a SocketProvider');
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

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const socketInstance = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://almahbub-procurement.onrender.com', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      setSocket(socketInstance);

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        unreadCountFetched.current = false;
        fetchUnreadCount();
        unreadCountFetched.current = true;
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        // WebSocket connection errors are normal during initial connection
        // Socket.IO will fall back to polling automatically
        if (error.message && !error.message.includes('WebSocket')) {
          console.error('Socket connection error:', error);
        }
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