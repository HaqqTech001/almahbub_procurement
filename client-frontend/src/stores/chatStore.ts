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

  setConversations: (conversations) => {
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    set({ conversations, unreadCount: totalUnread });
  },
  
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
      const response = await apiClient.getConversations();

      if (response.success) {
        // Map snake_case fields from backend to camelCase for frontend
        const conversations = (response.data.conversations || []).map((conv: any) => ({
          id: conv.id,
          firstName: conv.first_name,
          lastName: conv.last_name,
          role: conv.role,
          avatar: conv.avatar,
          lastMessageTime: conv.last_message_time,
          unreadCount: conv.unread_count || 0,
          lastMessage: conv.last_message,
        }));
        // Calculate total unread count from all conversations
        // This correctly sums only the unread_count from each conversation
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        set({
          conversations: conversations,
          unreadCount: totalUnread,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      set({ isLoading: false });
    }
  },

  // Dedicated method to fetch only unread count (faster, more accurate)
  fetchUnreadCount: async () => {
    try {
      const response = await apiClient.getUnreadCount();

      if (response.success) {
        // Use the count directly from the API
        // This returns the sum of all unread messages from all conversations
        set({ unreadCount: response.data.count || 0 });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  fetchMessages: async (userId, orderId, page = 1) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.getConversation(userId, { orderId, page });
      
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
      const response = await apiClient.sendMessage({
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
      await apiClient.markAsRead(userId.toString());
      
      // Update conversations and recalculate unread count from conversations
      set((state) => {
        const updatedConversations = state.conversations.map(conv =>
          conv.id === userId ? { ...conv, unreadCount: 0 } : conv
        );
        const totalUnread = updatedConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        return {
          unreadCount: totalUnread,
          conversations: updatedConversations,
        };
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  // fetchUnreadCount: async () => {
  //   try {
  //     const response = await apiClient.getUnreadCount();

  //     if (response.success) {
  //       // Use the count directly from the API (calculated sum of unread messages)
  //       set({ unreadCount: response.data.count || 0 });
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch unread count:', error);
  //   }
  // },
}));