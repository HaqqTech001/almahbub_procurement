import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useChatStore } from '@/stores/chatStore';
import { io, Socket } from 'socket.io-client';
import RichInput from '@/components/ui/RichInput';
import {
  Search,
  Send,
  Phone,
  Video,
  MoreHorizontal,
  MessageCircle,
  Users,
  Clock,
  CheckCheck,
  Settings,
  Paperclip,
  Smile,
  MoreVertical,
  Archive,
  Trash2,
  Ban,
  PhoneCall,
  VideoIcon,
  X,
} from 'lucide-react';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  message_type: string;
  file_url?: string;
  is_read: boolean;
  is_ai_response: boolean;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_role: string;
  sender_avatar?: string;
}

interface Conversation {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  avatar?: string;
  last_message_time: string;
  unread_count: number;
  last_message: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ file: File; type: 'image' | 'file'; preview?: string }[]>([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize socket connection
  useEffect(() => {
    initializeSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket?.disconnect();
    };
  }, []);

  const initializeSocket = () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    console.log('Initializing Socket.IO connection to:', wsUrl);
    
    const newSocket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('Socket.IO connected with ID:', newSocket.id);
      setIsConnected(true);
      
      // Join admin room for receiving messages
      newSocket.emit('join_admin_room');
      console.log('Joined admin_room');
      
      // Re-fetch conversations and messages after reconnection
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      }
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setIsConnected(false);
    });
    
    // Debug all incoming events
    newSocket.onAny((eventName, ...args) => {
      console.log('Socket event received:', eventName, args);
    });
    
    // Specific event listeners
    newSocket.on('new_message', (data: any) => {
      console.log('Received new_message event:', data);
      handleSocketMessage({ type: 'new_message', ...data });
    });
    
    newSocket.on('message_sent', (data: any) => {
      console.log('Received message_sent event:', data);
      handleSocketMessage({ type: 'message_sent', ...data });
    });
    
    newSocket.on('receive_message', (data: any) => {
      console.log('Received receive_message event:', data);
      handleSocketMessage({ type: 'receive_message', ...data });
    });
    
    newSocket.on('message_delivered', (data: any) => {
      console.log('Received message_delivered event:', data);
      handleSocketMessage({ type: 'message_delivered', ...data });
    });
    
    // Listen for typing indicators
    newSocket.on('user_typing', (data: any) => {
      console.log('Received user_typing event:', data);
      handleSocketMessage({ ...data, type: 'user_typing' });
    });
    
    newSocket.on('user_stopped_typing', (data: any) => {
      console.log('Received user_stopped_typing event:', data);
      handleSocketMessage({ ...data, type: 'user_stopped_typing' });
    });
    
    newSocket.on('messages_read', (data: any) => {
      console.log('Received messages_read event:', data);
      handleSocketMessage({ ...data, type: 'messages_read' });
    });
    
    // Listen for conversation updates
    newSocket.on('conversations_list', (data: any) => {
      console.log('Received conversations_list event:', data);
      handleSocketMessage({ ...data, type: 'conversations_list' });
    });
    
    // Listen for incoming call events
    newSocket.on('incoming_call', (data: any) => {
      console.log('Received incoming_call event:', data);
      // Handle incoming call notification
    });
    
    newSocket.on('call-ended', (data: any) => {
      console.log('Received call-ended event:', data);
      // Handle call ended
    });
    
    setSocket(newSocket);
  };

  const handleSocketMessage = (data: any) => {
    if (!data) return;

    // Handle both direct events and wrapped events
    const eventType = data.type || data.eventType || data.event || 'unknown';
    const messageData = data.message || data.payload || data;

    switch (eventType) {
      case 'new_message':
      case 'receive_message':
        console.log('New message received:', messageData);
        handleNewMessage(messageData);
        break;
      case 'message_sent':
      case 'message_delivered':
        console.log('Message sent confirmation:', messageData);
        handleMessageSent(messageData);
        break;
      case 'user_typing':
        handleUserTyping(data);
        break;
      case 'user_stopped_typing':
        handleUserStoppedTyping(data);
        break;
      case 'messages_read':
        handleMessagesRead(data);
        break;
      case 'conversations_list':
        setConversations(data.conversations || []);
        break;
      case 'conversation_history':
        setMessages(data.messages || []);
        break;
      default:
        console.log('Unknown socket event:', eventType, data);
    }
  };

  const handleNewMessage = (message: Message) => {
    if (!message || !message.id) return;

    // Don't add if it's our own message (handled by optimistic update)
    if (message.sender_id === user?.id) return;

    if (selectedConversation && message.sender_id === selectedConversation.id) {
      // Add to current conversation
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // Mark as read
      socket?.emit('mark_read', { senderId: message.sender_id });
    } else {
      // Update unread count for other conversations
      setConversations(prev => 
        prev.map(conv => 
          conv.id === message.sender_id 
            ? { ...conv, unread_count: (conv.unread_count || 0) + 1 }
            : conv
        )
      );
    }
    // Refresh conversation list to update last message
    fetchConversations();
  };

  const handleMessageSent = (message: Message) => {
    if (!message || !message.id) return;

    setMessages(prev => {
      // First, try to find and replace an optimistic message
      const hasOptimistic = prev.some(m => m.id !== message.id && 
        m.sender_id === user?.id && 
        m.message === message.message &&
        m.tempId);

      if (hasOptimistic) {
        return prev.map(m => {
          // Replace optimistic message with real one
          if (m.sender_id === user?.id && m.message === message.message && (m as any).tempId) {
            return message;
          }
          return m;
        });
      }

      // If no optimistic message, check if we need to add it
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, message];
    });
    fetchConversations();
  };

  const handleUserTyping = (data: { userId: number; userName: string }) => {
    if (selectedConversation?.id === data.userId) {
      setTypingUsers(prev => new Set(prev).add(data.userId));
    }
  };

  const handleUserStoppedTyping = (data: { userId: number }) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(data.userId);
      return newSet;
    });
  };

  const handleMessagesRead = (data: { readerId: number }) => {
    setMessages(prev => 
      prev.map(m => 
        m.sender_id === data.readerId ? { ...m, is_read: true } : m
      )
    );
  };

  // Fetch conversations on mount and periodically
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getChatConversations();
      if (response.success && response.data) {
        const fetchedConversations = response.data.conversations || [];
        setConversations(fetchedConversations);
        
        // Sync with chatStore to update Layout badge
        const totalUnread = fetchedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        useChatStore.getState().setConversations(fetchedConversations);
        useChatStore.getState().setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await apiClient.getChatMessages(conversationId.toString());
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const markAsRead = async (conversationId: number) => {
    try {
      await apiClient.markChatAsRead(conversationId.toString());
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
      
      // Sync with chatStore to update Layout badge
      const { conversations: storeConversations, setConversations: setStoreConversations, setUnreadCount } = useChatStore.getState();
      const updatedConversations = storeConversations.map(conv =>
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      );
      setStoreConversations(updatedConversations);
      const totalUnread = updatedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Handle files selected from RichInput
  const handleFilesSelected = (files: File[]) => {
    const newFiles = files.map(file => ({
      file,
      type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };

  // Remove attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachedFiles(prev => {
      const file = prev[index];
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const sendMessage = async (filesToSend?: File[]) => {
    if ((!newMessage.trim() && (!filesToSend || filesToSend.length === 0)) || !selectedConversation || !socket || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    const tempId = Date.now();
    const files = filesToSend || attachedFiles;

    // Create optimistic message object
    const optimisticMessage: Message & { tempId?: number } = {
      id: tempId,
      sender_id: user?.id || 0,
      receiver_id: selectedConversation.id,
      message: messageContent,
      message_type: files.length > 0 ? (files[0].type === 'image' ? 'image' : 'file') : 'text',
      file_url: files.length > 0 ? (files[0].preview || URL.createObjectURL(files[0].file)) : undefined,
      is_read: false,
      is_ai_response: false,
      created_at: new Date().toISOString(),
      sender_first_name: user?.first_name || 'Admin',
      sender_last_name: user?.last_name || '',
      sender_role: user?.role || 'admin',
      sender_avatar: user?.avatar || undefined,
      tempId,
    };

    // Optimistic UI update - add message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Emit socket event for real-time delivery
      if (socket.connected) {
        console.log('Emitting send_message event via socket');
        socket.emit('send_message', {
          receiverId: selectedConversation.id,
          message: messageContent,
          messageType: files.length > 0 ? (files[0].type === 'image' ? 'image' : 'file') : 'text',
          tempId,
        });
      } else {
        console.warn('Socket not connected, falling back to REST API only');
      }

      // Send via REST API for persistence (also triggers socket on backend)
      console.log('Sending message via REST API');
      const fileFiles = files.length > 0 ? files.map(f => f.file) : undefined;
      const response = await apiClient.sendChatMessage(
        selectedConversation.id.toString(), 
        messageContent, 
        fileFiles
      );
      console.log('REST API response:', response);

      // If server returns the actual message with ID, replace the optimistic message
      if (response.success && response.data?.message) {
        const serverMessage = response.data.message;
        setMessages(prev => prev.map(m =>
          (m as any).tempId === tempId ? { ...serverMessage, tempId } : m
        ));
      }

      // Reset input
      setNewMessage('');
      setAttachedFiles([]);
      messageInputRef.current?.focus();

      // Refresh conversation list to update last message
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => (m as any).tempId !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // Handle voice call
  const initiateVoiceCall = () => {
    if (!selectedConversation || !socket) return;
    
    setCallType('audio');
    setShowCallModal(true);
    
    // Emit call event via socket
    socket.emit('initiate_call', {
      receiverId: selectedConversation.id,
      callType: 'audio',
      callerName: `${user?.first_name} ${user?.last_name}`,
      callerId: user?.id,
    });
    
    console.log('Initiating voice call to user:', selectedConversation.id);
  };

  // Handle video call
  const initiateVideoCall = () => {
    if (!selectedConversation || !socket) return;
    
    setCallType('video');
    setShowCallModal(true);
    
    // Emit call event via socket
    socket.emit('initiate_call', {
      receiverId: selectedConversation.id,
      callType: 'video',
      callerName: `${user?.first_name} ${user?.last_name}`,
      callerId: user?.id,
    });
    
    console.log('Initiating video call to user:', selectedConversation.id);
  };

  // End call
  const endCall = () => {
    if (!selectedConversation || !socket) return;
    
    socket.emit('end_call', {
      receiverId: selectedConversation.id,
    });
    
    setShowCallModal(false);
    console.log('Ending call with user:', selectedConversation.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    if (selectedConversation && socket && socket.connected) {
      socket.emit('typing_start', { receiverId: selectedConversation.id });
      
      // Clear typing indicator after 2 seconds of no input
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('typing_stop', { receiverId: selectedConversation.id });
        }
      }, 2000);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserName = (conv: Conversation) => {
    return `${conv.first_name} ${conv.last_name}`;
  };

  const getInitials = (conv: Conversation) => {
    const firstChar = conv.first_name?.[0] || '';
    const lastChar = conv.last_name?.[0] || '';
    const initials = (firstChar + lastChar).toUpperCase();
    // Only show if it's a letter A-Z
    return /^[A-Z]$/.test(initials) ? initials : '';
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = getUserName(conv).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  const activeChats = conversations.filter(c => c.unread_count && c.unread_count > 0).length;

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Support</h1>
          <p className="text-muted-foreground">
            Manage customer conversations and support tickets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? 'default' : 'destructive'} className={isConnected ? 'bg-green-500' : ''}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant="outline" onClick={fetchConversations}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">
              All conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChats}</div>
            <p className="text-xs text-muted-foreground">
              With unread messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnread}</div>
            <p className="text-xs text-muted-foreground">
              New messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isConnected ? 'Yes' : 'No'}</div>
            <p className="text-xs text-muted-foreground">
              WebSocket status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 min-h-[calc(100vh-280px)] lg:h-[700px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 md:pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg">Conversations</CardTitle>
              <Badge variant="outline" className="text-xs">{filteredConversations.length}</Badge>
            </div>
            
            {/* Search */}
            <div className="mt-2 md:mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 md:h-10 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-2 md:p-3 cursor-pointer hover:bg-accent transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                  } ${conversation.unread_count && conversation.unread_count > 0 ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className={conversation.unread_count && conversation.unread_count > 0 ? 'bg-primary text-primary-foreground' : ''}>
                          {getInitials(conversation)}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 md:h-4 md:w-4 bg-primary rounded-full text-[9px] md:text-[10px] text-primary-foreground flex items-center justify-center">
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 md:mb-1">
                        <h4 className="text-xs md:text-sm font-medium truncate">
                          {getUserName(conversation)}
                        </h4>
                        <span className="text-[10px] md:text-xs text-muted-foreground flex-shrink-0 ml-1">
                          {formatTime(conversation.last_message_time)}
                        </span>
                      </div>
                      
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate mb-1">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-[9px] md:text-xs px-1 md:px-1.5 py-0">
                          {conversation.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="text-center py-4 md:py-8 text-muted-foreground">
                  <MessageCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-1 md:mb-2" />
                  <p className="text-xs md:text-sm">No conversations found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="py-2 md:pb-3 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                      <AvatarImage src={selectedConversation.avatar} />
                      <AvatarFallback>
                        {getInitials(selectedConversation)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm md:text-base truncate">{getUserName(selectedConversation)}</h3>
                      <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 md:gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[9px] md:text-xs px-1 md:px-1.5 py-0">
                          {selectedConversation.role}
                        </Badge>
                        {typingUsers.has(selectedConversation.id) && (
                          <span className="text-primary text-[9px] md:text-xs flex items-center gap-1">
                            <span className="animate-pulse">typing...</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-0.5 md:space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Voice Call"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={initiateVoiceCall}
                    >
                      <Phone className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Video Call"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={initiateVideoCall}
                    >
                      <Video className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="icon" title="More Options" className="h-7 w-7 md:h-8 md:w-8">
                      <MoreVertical className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages - Scrollable */}
              <CardContent className="flex-1 p-2 md:p-4 overflow-hidden bg-slate-50 dark:bg-slate-950/50">
                <div className="h-full overflow-y-auto space-y-2 md:space-y-4">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id);
                    
                    return (
                      <div
                        key={message.id || index}
                        className={`flex ${isOwnMessage ? 'justify-end text-white' : 'justify-start'}`}
                      >
                        {!isOwnMessage && (
                          <div className="flex-shrink-0 mr-1.5 md:mr-2">
                            {/* {showAvatar ? (
                              <Avatar className="h-6 w-6 md:h-8 md:w-8">
                                <AvatarImage src={message.sender_avatar} />
                                <AvatarFallback className="text-[9px] md:text-xs">
                                  {(() => {
                                    const firstChar = message.sender_first_name?.[0] || '';
                                    const lastChar = message.sender_last_name?.[0] || '';
                                    const initials = (firstChar + lastChar).toUpperCase();
                                    // Only show if it's a letter A-Z, fallback to 'U' for User
                                    return /^[A-Z]$/.test(initials) ? initials : 'U';
                                  })()}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-6 w-6 md:h-8 md:w-8" />
                            )} */}
                          </div>
                        )}
                        
                        <div className={`max-w-[75%] md:max-w-[70%] ${isOwnMessage ? 'order-1' : ''}`}>
                          <div className={`rounded-2xl px-3 py-1.5 md:px-4 md:py-2 ${
                            isOwnMessage 
                              ? 'bg-primary text-primary-foreground rounded-br-md' 
                              : 'bg-white dark:bg-slate-800 border rounded-bl-md'
                          } ${message.is_ai_response ? 'border-2 border-purple-500' : ''}`}>
                            {message.is_ai_response && (
                              <div className="flex items-center gap-1 mb-1 text-[10px] md:text-xs opacity-70">
                                <Smile className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                AI Assistant
                              </div>
                            )}
                            
                            {message.message_type === 'image' && message.file_url ? (
                              <img 
                                src={apiClient.getFileUrl(message.file_url)} 
                                alt="Shared image" 
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 max-h-32 md:max-h-48"
                                onClick={() => window.open(apiClient.getFileUrl(message.file_url), '_blank')}
                              />
                            ) : message.message_type === 'file' && message.file_url ? (
                              <a 
                                href={apiClient.getFileUrl(message.file_url)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 bg-white/10 rounded-lg hover:bg-white/20"
                              >
                                <Paperclip className="h-3 w-3 md:h-4 md:w-4" />
                                <span className="text-xs md:text-sm underline">Download</span>
                              </a>
                            ) : (
                              <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{message.message}</p>
                            )}
                            
                            <div className={`flex items-center justify-end gap-0.5 md:gap-1 mt-0.5 md:mt-1 ${
                              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              <span className="text-[9px] md:text-[10px]">
                                {formatMessageTime(message.created_at)}
                              </span>
                              {isOwnMessage && (
                                <CheckCheck className={`h-2.5 w-2.5 md:h-3 md:w-3 ${
                                  message.is_read ? 'text-blue-400' : ''
                                }`} />
                              )}
                            </div>
                          </div>
                          
                          {!isOwnMessage && showAvatar && (
                            <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 md:ml-1 ml-0.5">
                              {message.sender_first_name} {message.sender_last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Message Input - Fixed at bottom */}
              <div className="border-t p-2 md:p-4 bg-white dark:bg-slate-900 shrink-0">
                {/* Attached Files Preview - Compact */}
                {attachedFiles.length > 0 && (
                  <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto overflow-y-hidden pb-1.5 md:pb-2 mb-1.5 md:max-h-[80px]">
                    {attachedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="relative group flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg border"
                      >
                        {file.type.startsWith('image/') ? (
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={file.name}
                            className="w-6 h-6 md:w-8 md:h-8 rounded object-cover"
                          />
                        ) : (
                          <Paperclip className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                        )}
                        <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 max-w-[80px] md:max-w-[120px] truncate hidden sm:block">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[60px] truncate sm:hidden">
                          {file.name}...
                        </span>
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2 h-2 md:w-3 md:h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <RichInput
                  value={newMessage}
                  onChange={handleInputChange}
                  onSubmit={() => sendMessage()}
                  onFilesSelected={handleFilesSelected}
                  onRemoveFile={handleRemoveAttachment}
                  attachedFiles={attachedFiles}
                  placeholder="Type your message..."
                  showAttachments={true}
                  isLoading={isSending}
                  maxAttachments={5}
                />
                
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-1.5 md:mt-2">
                    Connection lost. Attempting to reconnect...
                  </p>
                )}
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 opacity-20" />
                <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Select a conversation</h3>
                <p className="text-xs md:text-sm">Choose a conversation from the list to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 md:p-8 max-w-xs md:max-w-md w-full">
            <div className="text-center">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                {callType === 'video' ? (
                  <VideoIcon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                ) : (
                  <PhoneCall className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                )}
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">
                {callType === 'video' ? 'Video Call' : 'Voice Call'}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                Calling {selectedConversation?.first_name} {selectedConversation?.last_name}...
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                {callType === 'video' 
                  ? 'Waiting for them to answer...' 
                  : 'Ringing...'}
              </p>
              
              <Button
                variant="destructive"
                onClick={endCall}
                className="w-full"
              >
                <Phone className="h-4 w-4 mr-2 transform rotate-135" />
                End Call
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
