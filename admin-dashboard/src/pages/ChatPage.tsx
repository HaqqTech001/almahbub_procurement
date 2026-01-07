import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSocketContext } from '@/contexts/SocketContext';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'bot';
  timestamp: Date;
  isRead: boolean;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState<'online' | 'offline' | 'away'>('online');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { socket, isConnected } = useSocketContext();
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (socket && isConnected) {
      // Join chat room
      socket.emit('join_chat', { userId: user?.id });

      // Listen for incoming messages
      socket.on('new_message', handleNewMessage);
      socket.on('typing', handleTyping);
      socket.on('stop_typing', handleStopTyping);
      socket.on('admin_online', () => setChatStatus('online'));
      socket.on('admin_offline', () => setChatStatus('offline'));

      // Load chat history
      loadChatHistory();

      return () => {
        socket.off('new_message');
        socket.off('typing');
        socket.off('stop_typing');
        socket.off('admin_online');
        socket.off('admin_offline');
      };
    }
  }, [socket, isConnected, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      // In a real implementation, you would fetch chat history from your API
      // For now, we'll add some welcome messages
      const welcomeMessages: Message[] = [
        {
          id: '1',
          content: 'Welcome to Almahbub International! How can I help you today?',
          senderId: 'bot',
          senderType: 'bot',
          timestamp: new Date(Date.now() - 300000),
          isRead: true,
        },
        {
          id: '2',
          content: 'Hello! I\'m looking for information about your procurement services.',
          senderId: user?.id || 'user',
          senderType: 'user',
          timestamp: new Date(Date.now() - 240000),
          isRead: true,
        },
        {
          id: '3',
          content: 'Great! I\'d be happy to help you with our procurement services. We specialize in international trade, logistics, and supply chain management. What specific products or services are you looking for?',
          senderId: 'admin',
          senderType: 'admin',
          timestamp: new Date(Date.now() - 180000),
          isRead: true,
        }
      ];
      setMessages(welcomeMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
  };

  const handleTyping = (data: { userId: string; senderType: string }) => {
    if (data.senderType === 'admin') {
      setIsTyping(true);
      // Auto-stop typing after 3 seconds
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  const handleStopTyping = () => {
    setIsTyping(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !isConnected) return;

    const message: Omit<Message, 'id'> = {
      content: newMessage.trim(),
      senderId: user?.id || 'user',
      senderType: 'user',
      timestamp: new Date(),
      isRead: false,
    };

    // Send message via socket
    socket.emit('send_message', message);

    // Add to local messages immediately for better UX
    const localMessage: Message = {
      ...message,
      id: Date.now().toString(),
    };
    setMessages(prev => [...prev, localMessage]);

    // Clear input
    setNewMessage('');

    // Auto-responder for common queries
    setTimeout(() => {
      handleAutoResponse(newMessage.trim().toLowerCase());
    }, 1000);
  };

  const handleAutoResponse = (userMessage: string) => {
    let response = '';
    
    if (userMessage.includes('hello') || userMessage.includes('hi')) {
      response = 'Hello! How can I assist you today?';
    } else if (userMessage.includes('order') || userMessage.includes('purchase')) {
      response = 'I can help you with creating and tracking orders. Would you like me to guide you through the process?';
    } else if (userMessage.includes('price') || userMessage.includes('cost')) {
      response = 'For pricing information, please provide details about the products or services you\'re interested in, and I\'ll connect you with our sales team.';
    } else if (userMessage.includes('delivery') || userMessage.includes('shipping')) {
      response = 'We offer worldwide shipping with various delivery options. Delivery times typically range from 7-14 business days depending on the destination.';
    } else if (userMessage.includes('contact') || userMessage.includes('phone')) {
      response = 'You can reach us at +1 (555) 123-4567 or email us at info@almahbub.com. Our business hours are Monday-Friday, 9 AM - 6 PM EST.';
    } else {
      response = 'Thank you for your message. A member of our team will get back to you shortly. In the meantime, feel free to ask any other questions!';
    }

    const botMessage: Message = {
      id: Date.now().toString(),
      content: response,
      senderId: 'bot',
      senderType: 'bot',
      timestamp: new Date(),
      isRead: true,
    };

    setMessages(prev => [...prev, botMessage]);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Header */}
          <div className="lg:col-span-3 mb-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src="/admin-avatar.jpg" alt="Support Agent" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor()}`}></div>
                      </div>
                      <div>
                        <h1 className="text-xl font-semibold">Support Chat</h1>
                        <p className="text-sm text-gray-600 flex items-center">
                          {isConnected ? (
                            <>
                              <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor()}`}></div>
                              {getStatusText()}
                            </>
                          ) : (
                            'Connecting...'
                          )}
                        </p>
                      </div>
                    </CardTitle>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-400px)] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.senderType === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          {message.senderType === 'user' ? (
                            <>
                              <AvatarImage src={user?.avatar} alt={user?.firstName} />
                              <AvatarFallback>
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </>
                          ) : message.senderType === 'admin' ? (
                            <>
                              <AvatarImage src="/admin-avatar.jpg" alt="Admin" />
                              <AvatarFallback>AD</AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src="/bot-avatar.jpg" alt="Bot" />
                              <AvatarFallback>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'user'
                              ? 'bg-teal-600 text-white'
                              : message.senderType === 'admin'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderType === 'user' ? 'text-teal-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src="/admin-avatar.jpg" alt="Admin" />
                          <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-200 px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isConnected}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-gradient-brand hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-sm text-red-600 mt-2">
                    Connection lost. Please wait while we reconnect...
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;