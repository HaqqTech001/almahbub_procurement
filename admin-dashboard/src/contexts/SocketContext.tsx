import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        fetchUnreadCount();
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Chat event handlers
      socket.on('new_message', (message) => {
        const conversationKey = message.orderId ? `${message.senderId}-${message.orderId}` : message.senderId.toString();
        addMessage(conversationKey, message);
        
        // Update unread count
        fetchUnreadCount();
        
        // Show notification
        toast({
          title: 'New Message',
          description: `New message from ${message.senderFirstName} ${message.senderLastName}`,
          variant: 'default',
        });
      });

      socket.on('message_sent', (message) => {
        // Handle message sent confirmation if needed
      });

      socket.on('messages_read', (data) => {
        // Handle read receipts if needed
      });

      socket.on('user_typing', (data) => {
        // Handle typing indicators if needed
      });

      socket.on('user_stopped_typing', (data) => {
        // Handle typing stop if needed
      });

      socket.on('ai_response', (message) => {
        const conversationKey = message.orderId ? `${message.receiverId}-${message.orderId}` : message.receiverId.toString();
        addMessage(conversationKey, message);
        
        // Show AI response notification
        toast({
          title: 'AI Assistant',
          description: 'Automated response sent',
          variant: 'default',
        });
      });

      socket.on('ai_responded', (data) => {
        // Notify admin that AI handled a message
        toast({
          title: 'AI Assistant Activity',
          description: `AI responded to user: ${data.userId}`,
          variant: 'default',
        });
      });

      socket.on('unread_count', (data) => {
        setUnreadCount(data.count);
      });

      socket.on('error', (error) => {
        toast({
          title: 'Socket Error',
          description: error.message || 'An error occurred',
          variant: 'destructive',
        });
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
        setConnected(false);
      };
    }
  }, [isAuthenticated, token, addMessage, setConnected, fetchUnreadCount, setUnreadCount, toast]);

  const value = {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};