import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Send, Phone, Video, MoreVertical, X, Paperclip, Eye, MessageSquare, Menu, ClipboardList, Check, CheckCheck, Smile, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EmojiPickerComponent from '@/components/ui/EmojiPicker';
import { useSocketContext } from '@/contexts/SocketContext';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { getChatTime } from '@/lib/dateUtils';

interface Message {
  id: number;
  message: string; // Backend returns 'message' not 'content'
  content?: string; // Optional alias for compatibility
  sender_id: number;
  receiver_id: number;
  senderType: 'user' | 'admin' | 'bot';
  message_type: 'text' | 'file' | 'form' | 'call_log';
  timestamp: Date;
  created_at?: string;
  isRead: boolean;
  read_at?: string;
  is_read?: boolean;
  type?: 'text' | 'call_log' | 'image' | 'file';
  callDuration?: number;
  callType?: 'voice' | 'video';
  attachmentUrl?: string;
  attachmentName?: string;
  file_url?: string; // Backend returns 'file_url'
  firstName?: string;
  lastName?: string;
  sender_first_name?: string; // Backend field name
  sender_last_name?: string; // Backend field name
  avatar?: string;
  sender_avatar?: string; // Backend field name
  form_data?: {
    title: string;
    fields: Array<{
      label: string;
      type: 'text' | 'number' | 'date' | 'select' | 'textarea';
      options?: string[];
      required?: boolean;
    }>;
    submitted: boolean;
    responses?: Record<string, string>;
    submittedAt?: string;
  };
}

interface FileAttachment {
  id: string;
  file: File;
  preview?: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState<'online' | 'offline' | 'away'>('offline');
  const [supportUser, setSupportUser] = useState<{id: number; firstName: string; lastName: string; avatar?: string; is_online?: boolean} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { socket, isConnected } = useSocketContext();
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Load support conversation on mount
  useEffect(() => {
    let isMounted = true;

    const loadSupportConversation = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSupportConversation();
        
        if (isMounted && response.success && response.data) {
          setSupportUser(response.data.user);
          if (response.data.viewCount !== undefined) {
            setViewCount(response.data.viewCount);
          }
          if (response.data.replyCount !== undefined) {
            setReplyCount(response.data.replyCount);
          }
          
          // Set initial online status from the conversation data
          if (response.data.user?.is_online) {
            setChatStatus('online');
          }
        }
      } catch (error) {
        console.error('Failed to load support conversation:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (user) {
      loadSupportConversation();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !supportUser) return;

    // Join user's personal room is handled by SocketContext
    // We just need to listen for messages in our support conversation

    // Listen for new messages
    const handleNewMessage = (message: any) => {
      console.log('New message received:', message);
      
      // Only process if this message is from our support agent
      const isFromSupport = message.sender_id === supportUser.id;
      const isFromUser = message.sender_id === user?.id;
      
      if (isFromSupport || isFromUser) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          
          return [...prev, {
            ...message,
            timestamp: new Date(message.created_at || message.timestamp),
            senderType: isFromUser ? 'user' : 'admin'
          }];
        });
        
        // Mark as read if from support/admin
        if (isFromSupport && !message.is_read) {
          markAsRead(supportUser.id.toString());
        }
      }
    };

    // Handle typing indicators
    const handleUserTyping = (data: { userId: number; userName: string }) => {
      if (data.userId === supportUser.id) {
        setIsTyping(true);
        // Auto-stop typing after 3 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleUserStoppedTyping = (data: { userId: number }) => {
      if (data.userId === supportUser.id) {
        setIsTyping(false);
      }
    };

    // Handle user online/offline status
    const handleUserOnline = (data: { userId: number; userName: string; role: string }) => {
      if (data.userId === supportUser.id) {
        setChatStatus('online');
        setSupportUser(prev => prev ? { ...prev, is_online: true } : null);
      }
    };

    const handleUserOffline = (data: { userId: number }) => {
      if (data.userId === supportUser.id) {
        setChatStatus('offline');
        setSupportUser(prev => prev ? { ...prev, is_online: false } : null);
      }
    };

    // Handle message sent confirmation
    const handleMessageSent = (message: any) => {
      console.log('Message sent confirmation:', message);
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        
        return [...prev, {
          ...message,
          timestamp: new Date(message.created_at || message.timestamp),
          senderType: 'user'
        }];
      });
    };

    // Handle messages read confirmation
    const handleMessagesRead = (data: { messageIds: number[] }) => {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      ));
    };

    // Register event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('message_sent', handleMessageSent);
    socket.on('messages_read', handleMessagesRead);

    // Load messages
    loadMessages();

    // Cleanup
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('message_sent', handleMessageSent);
      socket.off('messages_read', handleMessagesRead);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, isConnected, supportUser, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await apiClient.getSupportMessages({ limit: 50 });
      if (response.success && response.data?.messages) {
        // console.log('Raw messages from API:', response.data.messages);
        
        const loadedMessages = (response.data.messages || []).map((msg: any) => ({
          id: msg.id,
          message: msg.message || '', // Backend field 'message'
          content: msg.message || msg.content || '', // Support both
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          message_type: msg.message_type || 'text',
          timestamp: new Date(msg.created_at || msg.timestamp),
          created_at: msg.created_at,
          isRead: msg.is_read || msg.isRead || false,
          read_at: msg.read_at,
          type: msg.message_type === 'video' ? 'video' : (msg.message_type === 'image' ? 'image' : msg.type || (msg.message_type === 'file' ? 'file' : 'text')),
          file_url: msg.file_url,
          attachmentUrl: msg.file_url || msg.attachmentUrl, // Map file_url to attachmentUrl
          attachmentName: msg.file_name || msg.attachmentName,
          // Map sender info
          firstName: msg.sender_first_name || msg.firstName,
          lastName: msg.sender_last_name || msg.lastName,
          avatar: msg.sender_avatar || msg.avatar,
          sender_first_name: msg.sender_first_name,
          sender_last_name: msg.sender_last_name,
          sender_avatar: msg.sender_avatar,
          senderType: msg.sender_id === user?.id ? 'user' : 'admin'
        }));
        
        // console.log('Mapped messages:', loadedMessages);
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async (userId: string) => {
    try {
      await apiClient.markAsRead(userId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedFiles.length === 0) || !isConnected || !supportUser) return;

    try {
      setIsSending(true);
      
      // Send regular message with or without attachments
      const response = await apiClient.sendSupportMessage(
        newMessage || 'Sent an attachment',
        attachedFiles.length > 0 ? attachedFiles.map(a => a.file) : undefined
      );
      
      if (response.success) {
        // Message will be added via socket event 'message_sent'
        // Clear input
        setNewMessage('');
        setAttachedFiles([]);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newFiles = Array.from(files).map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    };
    input.click();
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return getChatTime(timestamp, 'Unknown');
  };

  // Helper to get message text content
  const getMessageContent = (msg: Message): string => {
    return msg.message || msg.content || '';
  };

  // Helper to get sender name
  const getSenderName = (msg: Message, isUser: boolean): string => {
    if (isUser) return user?.firstName || 'You';
    return msg.sender_first_name || msg.firstName || 'Support';
  };

  // Helper to get avatar URL
  const getAvatarUrl = (msg: Message, isUser: boolean): string | undefined => {
    if (isUser) return user?.avatar;
    return msg.sender_avatar || msg.avatar || supportUser?.avatar;
  };

  const getStatusColor = () => {
    switch (chatStatus) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (chatStatus) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const initiateCall = (type: 'voice' | 'video') => {
    if (!supportUser || !socket) return;
    
    toast({
      title: 'Call Feature',
      description: `${type === 'video' ? 'Video' : 'Voice'} calls require WebRTC integration. This is a demo UI.`,
    });
  };

  const endCall = () => {
    // Call functionality would be implemented with WebRTC
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e7490] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {/* <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center text-gray-600">
          <MessageSquare className="h-5 w-5 mr-2" />
          <span className="font-medium">Back</span>
        </Link>
        <h1 className="text-lg font-semibold"></h1>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div> */}

      <div className="flex h-[calc(100vh-0px)] lg:h-[calc(100vh-0px)]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div>
                <Link to={("/")}><ArrowLeft/></Link>
              </div>
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={supportUser?.avatar} alt={supportUser?.firstName} />
                  <AvatarFallback className="bg-[#0e7490] text-white">
                    {supportUser?.firstName?.[0]}{supportUser?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor()}`}></div>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {supportUser ? `${supportUser.firstName} ${supportUser.lastName}` : 'Support Team'}
                </h2>
                <p className="text-sm text-gray-500 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${getStatusColor()}`}></div>
                  {getStatusText()}
                </p>
              </div>
            </div>
            
            {/* <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="hidden sm:flex"
                onClick={() => initiateCall('voice')}
                disabled={!isConnected || chatStatus === 'offline'}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="hidden sm:flex" 
                onClick={() => initiateCall('video')}
                disabled={!isConnected || chatStatus === 'offline'}
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="hidden sm:flex">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div> */}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-1">No messages yet</p>
                <p className="text-sm">Start a conversation with our support team</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isUser = message.senderType === 'user';
                const showAvatar = index === 0 || 
                  (messages[index - 1]?.senderType !== message.senderType);

                return (
                  <div
                    key={message.id || index}
                    className={`flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={getAvatarUrl(message, isUser)} alt={getSenderName(message, isUser)} />
                        <AvatarFallback className={`text-xs ${isUser ? 'bg-[#0e7490] text-white' : 'bg-gray-300'}`}>
                          {getSenderName(message, isUser)?.[0] || 'S'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8" />
                    )}
                    
                    <div className={`max-w-[75%] sm:max-w-[70%] ${isUser ? 'order-1' : ''}`}>
                      {message.message_type === 'call_log' ? (
                        <div className={`text-center text-xs text-gray-500 my-2 flex items-center justify-center`}>
                          <ClipboardList className="h-3 w-3 mr-1" />
                          {getMessageContent(message)}
                        </div>
                      ) : message.message_type === 'form' ? (
                        <div className={`rounded-lg p-3 ${
                          isUser 
                            ? 'bg-[#0e7490] text-white' 
                            : 'bg-white border border-gray-200 shadow-sm'
                        }`}>
                          <div className="font-medium text-sm mb-2">{message.form_data?.title || 'Form'}</div>
                          {message.form_data?.submitted ? (
                            <div className="text-sm">
                              {Object.entries(message.form_data.responses || {}).map(([key, value]) => (
                                <div key={key} className="text-xs opacity-80">
                                  <span className="font-medium">{key}:</span> {value}
                                </div>
                              ))}
                              <div className="text-xs mt-2 opacity-60">
                                Submitted: {message.form_data.submittedAt || formatMessageTime(message.timestamp)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm opacity-80">Form not yet completed</div>
                          )}
                          <div className={`text-xs mt-2 ${isUser ? 'text-teal-100' : 'text-gray-400'}`}>
                            {formatMessageTime(message.timestamp)}
                          </div>
                        </div>
                      ) : (
                        <div className={`rounded-2xl px-4 py-2 shadow-sm ${
                          isUser 
                            ? 'bg-[#0e7490] text-white rounded-br-md' 
                            : 'bg-white text-gray-900 rounded-bl-md'
                        }`}>
                          {getMessageContent(message) && <div className="text-sm break-words">{getMessageContent(message)}</div>}
                          
                          {message.attachmentUrl && (
                            <div className="mt-2">
                              {message.type === 'image' ? (
                                <img 
                                  src={apiClient.getFileUrl(message.attachmentUrl)} 
                                  alt={message.attachmentName || 'Image'} 
                                  className="rounded-lg max-w-full h-auto"
                                  loading="lazy"
                                />
                              ) : message.type === 'video' ? (
                                <video 
                                  src={apiClient.getFileUrl(message.attachmentUrl)} 
                                  controls 
                                  className="rounded-lg max-w-full max-h-48"
                                  preload="metadata"
                                /> ): (
                                <a 
                                  href={apiClient.getFileUrl(message.attachmentUrl)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center space-x-2 text-sm ${isUser ? 'text-teal-100' : 'text-[#0e7490]'}`}
                                >
                                  <Paperclip className="h-4 w-4" />
                                  <span>{message.attachmentName || 'Attachment'}</span>
                                </a>
                              )}
                            </div>
                          )}
                          
                          <div className={`flex items-center justify-end mt-1 space-x-1 ${isUser ? 'text-teal-100' : 'text-gray-400'}`}>
                            <span className="text-xs">{formatMessageTime(message.timestamp)}</span>
                            {isUser && (
                              message.isRead ? (
                                <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={supportUser?.avatar} alt="Support" />
                  <AvatarFallback className="bg-gray-300 text-xs">
                    {supportUser?.firstName?.[0] || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Previews */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 bg-white border-t flex flex-wrap gap-2">
              {attachedFiles.map((attachment) => (
                <div key={attachment.id} className="relative group">
                  {attachment.preview ? (
                    <div className="relative">
                      <img 
                        src={attachment.preview} 
                        alt={attachment.file.name} 
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center relative">
                      <Paperclip className="h-6 w-6 text-gray-400" />
                      <button
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message Input */}
          <div className="bg-white border-t p-4">
            <div className="flex items-end space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="flex-shrink-0"
                onClick={handleAttachFile}
                disabled={!isConnected}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              
              {/* Emoji Picker */}
              <EmojiPickerComponent 
                onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)}
                position="top"
              />
              
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={!isConnected}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e7490] resize-none text-sm"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '150px' }}
                />
              </div>
              
              <Button 
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && attachedFiles.length === 0) || !isConnected || isSending}
                className="flex-shrink-0 bg-[#0e7490] hover:bg-[#0a5f70]"
                size="icon"
              >
                {isSending ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            {!isConnected && (
              <div className="mt-2 text-center">
                <p className="text-sm text-red-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  Connection lost. Attempting to reconnect...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className={`hidden lg:flex w-80 bg-white border-l flex-col ${isSidebarOpen ? 'flex' : ''}`}>
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Conversation Info</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {/* Support Agent Info */}
            {supportUser && (
              <div className="text-center mb-6">
                <Avatar className="h-20 w-20 mx-auto mb-3">
                  <AvatarImage src={supportUser.avatar} alt={supportUser.firstName} />
                  <AvatarFallback className="bg-[#0e7490] text-white text-xl">
                    {supportUser.firstName?.[0]}{supportUser.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-medium text-gray-900">
                  {supportUser.firstName} {supportUser.lastName}
                </h4>
                <p className="text-sm text-gray-500">Support Agent</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  chatStatus === 'online' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusColor()}`}></div>
                  {getStatusText()}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Views
                  </span>
                  <span className="font-medium">{viewCount}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Replies
                  </span>
                  <span className="font-medium">{replyCount}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/my-requests">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    View My Requests
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/announcements">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Announcements
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Powered by Almahbub Procurement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
