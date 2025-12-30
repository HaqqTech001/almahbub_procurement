import { create } from 'zustand';
import { apiClient } from '@/lib/api';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  orderId?: number;
  message: string;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  isRead: boolean;
  isAIResponse: boolean;
  createdAt: string;
  senderFirstName?: string;
  senderLastName?: string;
  senderRole?: string;
  senderAvatar?: string;
}

export interface Conversation {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  lastMessageTime: string;
  unreadCount: number;
  lastMessage?: string;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>; // Keyed by conversation user ID
  activeConversation: string | null;
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  
  // API actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (userId: string, orderId?: string, page?: number) => Promise<void>;
  sendMessage: (receiverId: string, message: string, orderId?: string, file?: File) => Promise<void>;
  markAsRead: (userId: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversation: null,
  unreadCount: 0,
  isLoading: false,
  isConnected: false,

  setConversations: (conversations) => set({ conversations }),
  
  setMessages: (conversationId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: messages,
    },
  })),
  
  addMessage: (conversationId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: [...(state.messages[conversationId] || []), message],
    },
  })),
  
  setActiveConversation: (conversationId) => set({ activeConversation: conversationId }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setLoading: (loading) => set({ isLoading: loading }),
  setConnected: (connected) => set({ isConnected: connected }),

  fetchConversations: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.getChatConversations();
      
      if (response.success) {
        set({ 
          conversations: response.data.conversations,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (userId, orderId, page = 1) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.getChatMessages(userId, { orderId, page });
      
      if (response.success) {
        const conversationKey = orderId ? `${userId}-${orderId}` : userId.toString();
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationKey]: response.data.messages,
          },
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ isLoading: false });
    }
  },

  sendMessage: async (receiverId, message, orderId, file) => {
    try {
      const response = await apiClient.sendChatMessage({
        receiverId: parseInt(receiverId),
        message,
        orderId,
        file,
      });
      
      if (response.success) {
        const conversationKey = orderId ? `${receiverId}-${orderId}` : receiverId;
        
        // Add the message to the current conversation
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationKey]: [
              ...(state.messages[conversationKey] || []),
              response.data.message,
            ],
          },
        }));

        // Update conversation list with new last message
        set((state) => ({
          conversations: state.conversations.map(conv => 
            conv.id === parseInt(receiverId)
              ? { ...conv, lastMessage: message, lastMessageTime: new Date().toISOString() }
              : conv
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  markAsRead: async (userId) => {
    try {
      await apiClient.markChatAsRead(userId.toString());
      
      // Update unread count locally
      set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - 1),
        conversations: state.conversations.map(conv =>
          conv.id === userId ? { ...conv, unreadCount: 0 } : conv
        ),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await apiClient.getUnreadChatCount();
      
      if (response.success) {
        set({ unreadCount: response.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },
}));