import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, User, Bot, X, Mic, MicOff, VideoOff, PhoneOff, Paperclip, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import RichInput from '@/components/ui/RichInput';
import { useSocketContext } from '@/contexts/SocketContext';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'bot';
  timestamp: Date;
  isRead: boolean;
  type?: 'text' | 'call_log' | 'image' | 'file';
  callDuration?: number;
  callType?: 'voice' | 'video';
  attachmentUrl?: string;
  attachmentName?: string;
}



interface CallState {
  isActive: boolean;
  isConnecting: boolean;
  type: 'voice' | 'video' | null;
  startTime: Date | null;
  duration: number;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ file: File; type: 'image' | 'file'; preview?: string }[]>([]);

  const [isTyping, setIsTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState<'online' | 'offline' | 'away'>('online');
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isConnecting: false,
    type: null,
    startTime: null,
    duration: 0
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { socket, isConnected } = useSocketContext();
  const { user } = useAuthStore();
  const { toast } = useToast();

  // useEffect(() => {
  //   if (socket && isConnected) {
  //     socket.emit('join_chat', { userId: user?.id });

  //     // Listen for messages from admin
  //     socket.on('new_message', handleNewMessage);
  //     socket.on('message_sent', handleMessageSent);
      
  //     // Listen for typing indicators from admin
  //     socket.on('user_typing', handleTyping);
  //     socket.on('user_stopped_typing', handleStopTyping);
      
  //     // Listen for admin status
  //     socket.on('admin_online', () => setChatStatus('online'));
  //     socket.on('admin_offline', () => setChatStatus('offline'));
      
  //     // Listen for call events
  //     socket.on('call_incoming', handleIncomingCall);
  //     socket.on('call_ended', handleCallEnded);

  //     loadChatHistory();

  //     return () => {
  //       socket.off('new_message');
  //       socket.off('message_sent');
  //       socket.off('user_typing');
  //       socket.off('user_stopped_typing');
  //       socket.off('admin_online');
  //       socket.off('admin_offline');
  //       socket.off('call_incoming');
  //       socket.off('call_ended');
  //     };
  //   }
  // }, [socket, isConnected, user]);

useEffect(() => {
  if (!socket || !isConnected || !user?.id) return;

  socket.emit('join_chat', { userId: user.id });

  socket.on('new_message', handleNewMessage);
  socket.on('message_sent', handleMessageSent);
  socket.on('user_typing', handleTyping);
  socket.on('user_stopped_typing', handleStopTyping);
  socket.on('admin_online', () => setChatStatus('online'));
  socket.on('admin_offline', () => setChatStatus('offline'));
  socket.on('call_incoming', handleIncomingCall);
  socket.on('call_ended', handleCallEnded);

  loadChatHistory();

  return () => {
    socket.off();
  };
}, [socket, isConnected, user?.id]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (callState.isActive && callState.startTime) {
      callTimerRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - prev.startTime!.getTime()) / 1000)
        }));
      }, 1000);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState.isActive, callState.startTime]);

  // const loadChatHistory = async () => {
  //   try {
  //     // Try to get messages from admin (assuming admin has ID 1)
  //     const adminId = '1';
  //     const response = await apiClient.getChatMessages(adminId);
  //     console.log(response.data.messages)
      
  //     if (response.success && response.data?.messages && response.data.messages.length > 0) {
  //       setMessages(response.data.messages.map((msg: any) => ({
  //         id: msg.id?.toString() || Date.now().toString(),
  //         content: msg.message || msg.content || '',
  //         senderId: msg.sender_id?.toString() || msg.senderId?.toString() || 'unknown',
  //         senderType: msg.sender_id === user?.id ? 'user' : (msg.is_ai_response ? 'bot' : 'admin'),
  //         timestamp: new Date(msg.timestamp || msg.created_at || Date.now()),
  //         isRead: msg.isRead || msg.is_read || false,
  //         type: msg.type || msg.message_type || 'text',
  //         attachmentUrl: msg.file_url ? apiClient.getFileUrl(msg.file_url) : (msg.attachmentUrl || ''),
  //         attachmentName: msg.attachment_name || msg.attachmentName,
  //       })));
  //     } else {
  //       setMessages([]);
  //     }
  //   } catch (error) {
  //     console.log('Using local chat state, API not available');
  //     console.log(error)
  //     setMessages([]);
  //   }
  // };

  // Poll for new messages periodically
 
 const loadChatHistory = async () => {
  if (!user?.id) return;

  try {
    const adminId = '1';
    const response = await apiClient.getChatMessages(adminId);
    console.log(response)

    const rawMessages =
      response?.data?.messages ||
      response?.data?.data?.messages ||
      [];

    if (!Array.isArray(rawMessages)) {
      setMessages([]);
      return;
    }

    setMessages(
      rawMessages.map((msg: any) => ({
        id: String(msg.id ?? Date.now()),
        content: msg.message ?? '',
        senderId: String(msg.sender_id ?? 'admin'),
        senderType:
          msg.sender_id === user.id
            ? 'user'
            : msg.is_ai_response
            ? 'bot'
            : 'admin',
        timestamp: new Date(msg.created_at ?? Date.now()),
        isRead: Boolean(msg.is_read),
        type: msg.message_type ?? 'text',
        attachmentUrl: msg.file_url
          ? apiClient.getFileUrl(msg.file_url)
          : undefined,
        attachmentName: msg.attachment_name,
      }))
    );
  } catch (err) {
    console.error('Chat history failed:', err);
    setMessages([]);
  }
};

 
 
  // useEffect(() => {
  //   const pollInterval = setInterval(() => {
  //     if (isConnected) {
  //       loadChatHistory();
  //     }
  //   }, 5000); // Poll every 5 seconds

  //   return () => clearInterval(pollInterval);
  // }, [isConnected]);

  const handleNewMessage = (messageData: any) => {
    // Handle both direct messages and wrapped events
    const message = messageData.message || messageData;
    
    const newMessage: Message = {
      id: message.id?.toString() || Date.now().toString(),
      content: message.message || message.content || '',
      senderId: message.sender_id?.toString() || 'admin',
      senderType: message.is_ai_response ? 'bot' : 'admin',
      timestamp: new Date(message.created_at || message.timestamp || Date.now()),
      isRead: message.is_read || false,
      type: message.message_type || message.type || 'text',
      attachmentUrl: message.file_url ? apiClient.getFileUrl(message.file_url) : '',
      attachmentName: message.attachment_name,
    };
    
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });
  };

  const handleMessageSent = (messageData: any) => {
    // Handle confirmation that message was sent
    const message = messageData.message || messageData;
    console.log('Message sent confirmation:', message);
  };

  const handleTyping = (data: { userId: number; userName: string }) => {
    // Admin is typing
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000);
  };

  const handleStopTyping = (data: { userId: number }) => {
    setIsTyping(false);
  };

  const handleIncomingCall = (data: { type: 'voice' | 'video'; from: string }) => {
    toast({
      title: 'Incoming Call',
      description: `Incoming ${data.type} call from ${data.from}`,
    });
  };

  const handleCallEnded = () => {
    setCallState({
      isActive: false,
      isConnecting: false,
      type: null,
      startTime: null,
      duration: 0
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initiateCall = async (type: 'voice' | 'video') => {
    if (!socket || !isConnected) {
      toast({
        title: 'Connection Error',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
      return;
    }

    // Request permissions first
    try {
      if (type === 'video') {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      setCallState({
        isActive: true,
        isConnecting: true,
        type,
        startTime: null,
        duration: 0
      });

      // Emit call request to admin
      socket.emit('initiate_call', { type, userId: user?.id });

      // Simulate connection delay
      setTimeout(() => {
        setCallState(prev => ({
          ...prev,
          isConnecting: false,
          startTime: new Date()
        }));
        
        // Add call log message
        const callLogMessage: Message = {
          id: Date.now().toString(),
          content: `${type === 'video' ? 'Video' : 'Voice'} call started`,
          senderId: 'system',
          senderType: 'bot',
          timestamp: new Date(),
          isRead: true,
          type: 'call_log',
          callType: type
        };
        setMessages(prev => [...prev, callLogMessage]);

        toast({
          title: 'Call Connected',
          description: `${type === 'video' ? 'Video' : 'Voice'} call is now active`,
        });
      }, 2000);

    } catch (error) {
      toast({
        title: 'Permission Denied',
        description: 'Please allow camera/microphone access to make calls.',
        variant: 'destructive',
      });
    }
  };

  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    if (socket && isConnected) {
      socket.emit('end_call', { userId: user?.id });
    }

    // Add call log message
    const callLogMessage: Message = {
      id: Date.now().toString(),
      content: `${callState.type === 'video' ? 'Video' : 'Voice'} call ended. Duration: ${formatDuration(callState.duration)}`,
      senderId: 'system',
      senderType: 'bot',
      timestamp: new Date(),
      isRead: true,
      type: 'call_log',
      callType: callState.type || undefined,
      callDuration: callState.duration
    };
    setMessages(prev => [...prev, callLogMessage]);

    setCallState({
      isActive: false,
      isConnecting: false,
      type: null,
      startTime: null,
      duration: 0
    });

    toast({
      title: 'Call Ended',
      description: `Call duration: ${formatDuration(callState.duration)}`,
    });
  };

  const handleFilesSelected = (files: File[]) => {
    const newFiles = files.map(file => {
      if (file.type.startsWith('image/')) {
        return {
          file,
          type: 'image' as const,
          preview: URL.createObjectURL(file),
        };
      }
      return {
        file,
        type: 'file' as const,
      };
    });
    setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL to avoid memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const sendMessage = async () => {
    const textContent = newMessage.trim();
    
    if (!textContent && attachedFiles.length === 0) return;

    const tempId = Date.now().toString();

    // Capture files before clearing state
    const currentFiles = [...attachedFiles];
    const messageType = currentFiles.length > 0 ? (currentFiles[0].type === 'image' ? 'image' : 'file') : 'text';

    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      content: textContent,
      senderId: user?.id?.toString() || 'user',
      senderType: 'user',
      timestamp: new Date(),
      isRead: false,
      type: messageType,
      attachmentUrl: currentFiles.length > 0 ? (currentFiles[0].preview || URL.createObjectURL(currentFiles[0].file)) : undefined,
      attachmentName: currentFiles.length > 0 ? currentFiles[0].file.name : undefined,
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setAttachedFiles([]);

    try {
      // Emit socket event for real-time delivery
      if (socket && isConnected) {
        socket.emit('send_message', {
          receiverId: 1, // Send to admin (ID 1)
          message: textContent,
          messageType: messageType,
          tempId,
        });
      }

      // Send to API for persistence with files
      const files = currentFiles.map(f => f.file);
      const response = await apiClient.sendChatMessage('1', textContent, files.length > 0 ? files : undefined);
      
      if (response.success) {
        // Update with real message from server
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? {
            ...msg,
            id: response.data?.id?.toString() || msg.id,
            attachmentUrl: response.data?.file_url ? apiClient.getFileUrl(response.data.file_url) : msg.attachmentUrl,
          } : msg
        ));

        // Check if we should get auto-reply from chatbot
        checkForAutoReply(textContent);
      } else {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Check if chatbot should auto-reply
  const checkForAutoReply = async (userMessage: string) => {
    try {
      // Get chatbot settings
      const settingsResponse = await apiClient.getChatbotSettings();
      
      if (settingsResponse.success && settingsResponse.data?.autoReplyEnabled) {
        // Send message to AI for auto-response
        const aiResponse = await apiClient.getAIResponse(userMessage);
        
        if (aiResponse.success && aiResponse.data?.response) {
          const botMessage: Message = {
            id: Date.now().toString(),
            content: aiResponse.data.response,
            senderId: 'admin',
            senderType: 'admin',
            timestamp: new Date(),
            isRead: true,
          };

          setMessages(prev => [...prev, botMessage]);
        }
      }
    } catch (error) {
      console.log('Chatbot not available or disabled');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };



  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (chatStatus) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (chatStatus) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline - Leave a message';
      default: return 'Unknown';
    }
  };

  return (
    <div className=" h-screen  bg-gray-50 flex flex-col ">
      {/* Call Modal */}
      {callState.isActive && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            {callState.isConnecting ? (
              <div>
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                  <Video className="h-16 w-16" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Connecting...</h2>
                <p className="text-gray-400">Please wait while we connect you</p>
              </div>
            ) : (
              <div>
                <div className="w-48 h-48 bg-[#0F4C5C] rounded-full flex items-center justify-center mx-auto mb-8">
                  <span className="text-6xl font-bold text-white">
                    {callState.type === 'video' && <Video className="h-24 w-24" />}
                    {callState.type !== 'video' && <Phone className="h-24 w-24" />}
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  {callState.type === 'video' ? 'Video Call' : 'Voice Call'}
                </h2>
                <p className="text-xl mb-8 text-[#E3B505]">{formatDuration(callState.duration)}</p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-gray-700 border-gray-600 hover:bg-gray-600">
                    <Mic className="h-6 w-6" />
                  </Button>
                  {callState.type === 'video' && (
                    <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-gray-700 border-gray-600 hover:bg-gray-600">
                      <VideoOff className="h-6 w-6" />
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
                    onClick={endCall}
                  >
                    <PhoneOff className="h-8 w-8" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Header - Responsive */}
        <div className="m-2 mb-1 tour-chat-header flex-shrink-0 bg-white rounded-lg border shadow-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarImage src="/admin-avatar.svg" alt="Support Agent" />
                  <AvatarFallback className="bg-[#0F4C5C] text-white text-sm sm:text-base">AD</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusColor()}`}></div>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">Customer Support</h1>
                <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1.5">
                  {isConnected ? (
                    <>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor()}`}></div>
                      <span className="truncate">{getStatusText()}</span>
                    </>
                  ) : (
                    <span className="text-yellow-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                      Connecting...
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-1 sm:space-x-2 tour-call-buttons">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => initiateCall('voice')}
                disabled={!isConnected}
                className="w-8 h-8 sm:w-9 sm:h-9 hover:bg-green-50 hover:border-green-300 transition-colors"
                title="Voice Call"
              >
                <Phone className="h-4 w-4 text-green-600" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => initiateCall('video')}
                disabled={!isConnected}
                className="w-8 h-8 sm:w-9 sm:h-9 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                title="Video Call"
              >
                <Video className="h-4 w-4 text-blue-600" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8 sm:w-9 sm:h-9" title="More Options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages - Main Content */}
        <div className="flex-1 flex flex-col min-h-0 m-2 mt-1 overflow-hidden ">
          <div className="min-h-0 flex-1 flex flex-col overflow-hidden bg-white rounded-lg  shadow-sm">
            {/* Messages Area - Scrollable */}
            <ScrollArea className="flex-1 min-h-0 h-[calc(100dvh-220px)] sm:h-auto max-w-screen">
              <div className="space-y-4 py-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center  px-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#0F4C5C]/10 rounded-full flex items-center justify-center mb-4">
                          <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-[#0F4C5C]" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 text-center">Start a Conversation</h3>
                        <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto text-center">
                          Send a message to start chatting with our support team. We typically reply within minutes.
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex items-start gap-2 sm:gap-3 max-w-screen  ${
                              message.senderType === 'user' ? 'ml-auto sm:justify-end' : ''
                            }`}
                          >
                            {/* <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 mt-1">
                              {message.senderType === 'user' ? (
                                <>
                                  <AvatarImage src={user?.avatar} alt={user?.firstName} />
                                  <AvatarFallback className="bg-[#0F4C5C] text-white text-xs sm:text-sm">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                  </AvatarFallback>
                                </>
                              ) : message.senderType === 'admin' ? (
                                <>
                                  <AvatarImage src="/admin-avatar.svg" alt="Admin" />
                                  <AvatarFallback className="bg-[#0F4C5C] text-white text-xs sm:text-sm">AD</AvatarFallback>
                                </>
                              ) : (
                                <>
                                  <AvatarFallback className="bg-gray-300">
                                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </AvatarFallback>
                                </>
                              )}
                            </Avatar> */}
                            <div
                              className={`max-w-[75%] sm:max-w-[70%] lg:max-w-md  rounded-2xl px-3 sm:px-4 py-2 ${
                                message.type === 'call_log' 
                                  ? 'bg-gray-100 text-gray-700 text-center w-auto mx-auto'
                                  : message.senderType === 'user'
                                    ? 'bg-[#0F4C5C] text-white rounded-tr-sm'
                                    : message.senderType === 'admin'
                                      ? 'bg-white border border-gray-400 text-gray-900 rounded-tl-sm'
                                      : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {message.type === 'call_log' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  <p className="text-xs sm:text-sm">{message.content}</p>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                                  {message.attachmentUrl && (
                                    <div className="mt-2">
                                      {message.type === 'image' ? (
                                        <div className="relative group">
                                          <img 
                                            src={message.attachmentUrl} 
                                            alt={message.attachmentName || 'Attachment'}
                                            className="max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                                            onClick={() => window.open(message.attachmentUrl, '_blank')}
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              target.parentElement?.insertAdjacentHTML(
                                                'beforebegin',
                                                '<div class="text-xs text-gray-500 p-2 bg-gray-100 rounded">Image failed to load</div>'
                                              );
                                            }}
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-black group-hover:bg-opacity-10 transition-colors rounded-lg pointer-events-none" />
                                        </div>
                                      ) : (
                                        <a 
                                          href={message.attachmentUrl} 
                                          download={message.attachmentName}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-2 mt-2 transition-colors shadow-sm"
                                        >
                                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                            <Paperclip className="w-4 h-4 text-gray-500" />
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[180px]">
                                              {message.attachmentName || 'Attachment'}
                                            </span>
                                            <span className="text-[10px] text-gray-500">Click to download</span>
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  <p
                                    className={`text-[10px] sm:text-xs mt-1 ${
                                      message.senderType === 'user' ? 'text-cyan-100/80' : 'text-gray-400'
                                    }`}
                                  >
                                    {formatTime(message.timestamp)}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {isTyping && (
                      <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4">
                        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                          <AvatarImage src="/admin-avatar.svg" alt="Admin" />
                          <AvatarFallback className="bg-[#0F4C5C] text-white text-xs sm:text-sm">AD</AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
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
                </ScrollArea>

                {/* Message Input - Fixed at bottom */}
                <div className="border-t bg-white shrink-0">
                  {/* Attached Files Preview - Compact horizontal scroll */}
                  {attachedFiles.length > 0 && (
                    <div className="px-3 sm:px-4 pt-2 sm:pt-3 border-b bg-gray-50 shrink-0">
                      <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden max-h-[70px] sm:max-h-[80px] pb-2">
                        {attachedFiles.map((file, index) => (
                          <div 
                            key={index}
                            className="relative group flex-shrink-0 flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-white rounded-lg border shadow-sm"
                          >
                            {file.type === 'image' && file.preview ? (
                              <img 
                                src={file.preview} 
                                alt="Preview" 
                                className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded"
                              />
                            ) : (
                              <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                            )}
                            <span className="text-xs sm:text-sm text-gray-700 max-w-[100px] sm:max-w-[120px] truncate">
                              {file.file.name}
                            </span>
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Input Area */}
                  <div className="p-2 sm:p-3 md:p-4">
                    <RichInput
                      value={newMessage}
                      onChange={setNewMessage}
                      onSubmit={sendMessage}
                      placeholder="Type your message..."
                      isLoading={isTyping}
                      showAttachments={true}
                      maxAttachments={5}
                      attachedFiles={attachedFiles}
                      onFilesSelected={handleFilesSelected}
                      onRemoveFile={removeFile}
                    />
                  </div>
                  
                  {!isConnected && (
                    <div className="px-3 sm:px-4 pb-2 sm:pb-3">
                      <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Connection lost. Please wait while we reconnect...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
  );
};

export default ChatPage;