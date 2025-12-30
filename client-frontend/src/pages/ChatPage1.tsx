// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { Send, Phone, Video, MoreVertical, Bot, X, Mic, MicOff, VideoOff, PhoneOff, ArrowLeft, Paperclip, Eye, MessageSquare, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import RichInput from '@/components/ui/RichInput';
// import { useSocketContext } from '@/contexts/SocketContext';
// import { useAuthStore } from '@/stores/authStore';
// import { useToast } from '@/hooks/use-toast';
// import { apiClient } from '@/lib/api';

// interface FileAttachment {
//   id: string;
//   file: File;
//   preview?: string;
// }

// interface Message {
//   id: string;
//   content: string;
//   senderId: string;
//   senderType: 'user' | 'admin' | 'bot';
//   timestamp: Date;
//   isRead: boolean;
//   type?: 'text' | 'call_log' | 'image' | 'file';
//   callDuration?: number;
//   callType?: 'voice' | 'video';
//   attachmentUrl?: string;
//   attachmentName?: string;
//   firstName?: string;
//   lastName?: string;
//   avatar?: string;
// }

// interface CallState {
//   isActive: boolean;
//   isConnecting: boolean;
//   type: 'voice' | 'video' | null;
//   startTime: Date | null;
//   duration: number;
// }

// const ClientChatPage: React.FC = () => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
//   const [isTyping, setIsTyping] = useState(false);
//   const [chatStatus, setChatStatus] = useState<'online' | 'offline' | 'away'>('online');
//   const [supportUser, setSupportUser] = useState<{id: number; firstName: string; lastName: string; avatar?: string} | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSending, setIsSending] = useState(false);
//   const [viewCount, setViewCount] = useState(0);
//   const [replyCount, setReplyCount] = useState(0);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [callState, setCallState] = useState<CallState>({
//     isActive: false,
//     isConnecting: false,
//     type: null,
//     startTime: null,
//     duration: 0
//   });
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const callTimerRef = useRef<NodeJS.Timeout | null>(null);

//   const { socket, isConnected } = useSocketContext();
//   const { user } = useAuthStore();
//   const { toast } = useToast();

//   // Load support conversation on mount
//   useEffect(() => {
//     let isMounted = true;

//     const loadSupportConversation = async () => {
//       try {
//         setIsLoading(true);
//         const response = await apiClient.getSupportConversation();
        
//         if (isMounted && response.success && response.data) {
//           setSupportUser(response.data.user);
//           // Set view and reply counts from the conversation data
//           if (response.data.viewCount !== undefined) {
//             setViewCount(response.data.viewCount);
//           }
//           if (response.data.replyCount !== undefined) {
//             setReplyCount(response.data.replyCount);
//           }
//           // Load messages after setting support user to avoid redundant calls
//           await loadSupportMessages();
//         }
//       } catch (error) {
//         console.error('Failed to load support conversation:', error);
//         if (isMounted) {
//           toast({
//             title: 'Connection Error',
//             description: 'Unable to connect to support. Please try again.',
//             variant: 'destructive',
//           });
//         }
//       } finally {
//         if (isMounted) {
//           setIsLoading(false);
//         }
//       }
//     };

//     loadSupportConversation();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (socket && isConnected && supportUser) {
//       // Join the chat room for this user
//       socket.emit('join_chat', { userId: user?.id });

//       // Set up event listeners
//       socket.on('new_message', handleNewMessage);
//       socket.on('typing', handleTyping);
//       socket.on('stop_typing', handleStopTyping);
//       socket.on('admin_online', () => setChatStatus('online'));
//       socket.on('admin_offline', () => setChatStatus('offline'));
//       socket.on('call_incoming', handleIncomingCall);
//       socket.on('call_ended', handleCallEnded);

//       return () => {
//         socket.off('new_message', handleNewMessage);
//         socket.off('typing', handleTyping);
//         socket.off('stop_typing', handleStopTyping);
//         socket.off('admin_online');
//         socket.off('admin_offline');
//         socket.off('call_incoming', handleIncomingCall);
//         socket.off('call_ended', handleCallEnded);
//       };
//     }
//   }, [socket, isConnected, supportUser, user]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     if (callState.isActive && callState.startTime) {
//       const callTimerRef = setInterval(() => {
//         setCallState(prev => ({
//           ...prev,
//           duration: Math.floor((Date.now() - (prev.startTime?.getTime() || 0)) / 1000)
//         }));
//       }, 1000);

//       return () => clearInterval(callTimerRef);
//     }
//   }, [callState.isActive, callState.startTime]);

//   // Load support messages - uses useCallback to stabilize the function reference
//   const loadSupportMessages = useCallback(async () => {
//     try {
//       const response = await apiClient.getSupportMessages();
      
//       if (response.success && response.data?.messages) {
//         const formattedMessages = response.data.messages.map((msg: any) => ({
//           id: msg.id?.toString() || Date.now().toString(),
//           content: msg.message || '',
//           senderId: msg.sender_id?.toString() || 'unknown',
//           senderType: msg.sender_role === 'admin' ? 'admin' : (msg.sender_id === user?.id ? 'user' : 'user'),
//           timestamp: new Date(msg.created_at || Date.now()),
//           isRead: msg.is_read || false,
//           type: msg.message_type || 'text',
//           attachmentUrl: msg.file_url,
//           attachmentName: msg.attachmentName,
//           firstName: msg.sender_first_name,
//           lastName: msg.sender_last_name,
//           avatar: msg.sender_avatar,
//         }));
//         setMessages(formattedMessages);
//       }
//     } catch (error) {
//       console.error('Failed to load messages:', error);
//     }
//   }, [user?.id]);

//   const handleNewMessage = (message: Message) => {
//     setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
//   };

//   const handleTyping = (data: { userId: string; senderType: string }) => {
//     if (data.senderType === 'user') {
//       setIsTyping(true);
//       setTimeout(() => setIsTyping(false), 3000);
//     }
//   };

//   const handleStopTyping = () => {
//     setIsTyping(false);
//   };

//   const handleIncomingCall = (data: { type: 'voice' | 'video'; from: string }) => {
//     toast({
//       title: 'Incoming Call',
//       description: `Incoming ${data.type} call from ${data.from}`,
//     });
//   };

//   const handleCallEnded = () => {
//     setCallState({
//       isActive: false,
//       isConnecting: false,
//       type: null,
//       startTime: null,
//       duration: 0
//     });
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const initiateCall = async (type: 'voice' | 'video') => {
//     if (!socket || !isConnected) {
//       toast({
//         title: 'Connection Error',
//         description: 'Please check your connection and try again.',
//         variant: 'destructive',
//       });
//       return;
//     }

//     try {
//       if (type === 'video') {
//         await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       } else {
//         await navigator.mediaDevices.getUserMedia({ audio: true });
//       }

//       setCallState({
//         isActive: true,
//         isConnecting: true,
//         type,
//         startTime: null,
//         duration: 0
//       });

//       socket.emit('initiate_call', { type, userId: user?.id });

//       setTimeout(() => {
//         setCallState(prev => ({
//           ...prev,
//           isConnecting: false,
//           startTime: new Date()
//         }));

//         const callLogMessage: Message = {
//           id: Date.now().toString(),
//           content: `${type === 'video' ? 'Video' : 'Voice'} call started`,
//           senderId: 'system',
//           senderType: 'bot',
//           timestamp: new Date(),
//           isRead: true,
//           type: 'call_log',
//           callType: type
//         };
//         setMessages(prev => [...prev, callLogMessage]);

//         toast({
//           title: 'Call Connected',
//           description: `${type === 'video' ? 'Video' : 'Voice'} call is now active`,
//         });
//       }, 2000);

//     } catch (error) {
//       toast({
//         title: 'Permission Denied',
//         description: 'Please allow camera/microphone access to make calls.',
//         variant: 'destructive',
//       });
//     }
//   };

//   const endCall = () => {
//     if (callTimerRef.current) {
//       clearInterval(callTimerRef.current);
//     }

//     if (socket && isConnected) {
//       socket.emit('end_call', { userId: user?.id });
//     }

//     const callLogMessage: Message = {
//       id: Date.now().toString(),
//       content: `${callState.type === 'video' ? 'Video' : 'Voice'} call ended. Duration: ${formatDuration(callState.duration)}`,
//       senderId: 'system',
//       senderType: 'bot',
//       timestamp: new Date(),
//       isRead: true,
//       type: 'call_log',
//       callType: callState.type || undefined,
//       callDuration: callState.duration
//     };
//     setMessages(prev => [...prev, callLogMessage]);

//     setCallState({
//       isActive: false,
//       isConnecting: false,
//       type: null,
//       startTime: null,
//       duration: 0
//     });

//     toast({
//       title: 'Call Ended',
//       description: `Call duration: ${formatDuration(callState.duration)}`,
//     });
//   };

//   const handleRemoveAttachment = (index: number) => {
//     setAttachedFiles(prev => {
//       const attachment = prev[index];
//       if (attachment?.preview) {
//         URL.revokeObjectURL(attachment.preview);
//       }
//       return prev.filter((_, i) => i !== index);
//     });
//   };

//   // Handle files selected from RichInput - transform to match expected format
//   const handleFilesSelected = (files: File[]) => {
//     const newAttachments: FileAttachment[] = files.map(file => ({
//       id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       file,
//       preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
//     }));
//     setAttachedFiles(prev => [...prev, ...newAttachments].slice(0, 5));
//   };

//   const sendMessage = async (filesToSend?: File[]) => {
//     const textContent = newMessage.trim();
//     const files = filesToSend || attachedFiles;
    
//     // Allow sending if there's text or attachments
//     if (!textContent && files.length === 0) return;

//     setIsSending(true);

//     // Create optimistic message
//     const tempId = Date.now().toString();
//     const firstFile = files.length > 0 ? files[0] : null;
//     const firstFileObj = firstFile ? (firstFile.file || firstFile) : null;
//     const firstFilePreview = firstFile?.preview;
//     const optimisticMessage: Message = {
//       id: tempId,
//       content: textContent,
//       senderId: user?.id?.toString() || 'unknown',
//       senderType: 'user',
//       timestamp: new Date(),
//       isRead: true,
//       type: firstFileObj ? (firstFileObj.type.startsWith('image/') ? 'image' : 'file') : 'text',
//       attachmentUrl: firstFileObj && firstFileObj.type.startsWith('image/') ? (firstFilePreview || URL.createObjectURL(firstFileObj)) : undefined,
//       attachmentName: firstFileObj ? firstFileObj.name : undefined,
//     };

//     // Add optimistic message immediately
//     setMessages(prev => [...prev, optimisticMessage]);
//     setNewMessage('');
//     setAttachedFiles([]);

//     try {
//       // Send to API using the support chat endpoint with files
//       const fileFiles = files.length > 0 ? files.map(f => f.file || f) : undefined;
//       const response = await apiClient.sendSupportMessage(
//         textContent, 
//         fileFiles
//       );
      
//       if (response.success) {
//         // Update with real message from server
//         const savedMsg = response.data?.message;
//         setMessages(prev => prev.map(msg => 
//           msg.id === tempId ? {
//             ...msg,
//             id: savedMsg?.id?.toString() || msg.id,
//             attachmentUrl: savedMsg?.file_url || msg.attachmentUrl,
//             attachmentName: savedMsg?.attachmentName || msg.attachmentName,
//           } : msg
//         ));
//       } else {
//         // Remove optimistic message on failure
//         setMessages(prev => prev.filter(msg => msg.id !== tempId));
//         throw new Error('Failed to send message');
//       }
//     } catch (error) {
//       console.error('Error sending message:', error);
//       // Remove optimistic message on error
//       setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
//       toast({
//         title: 'Error',
//         description: 'Failed to send message. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const formatTime = (timestamp: Date) => {
//     return new Date(timestamp).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   const formatDuration = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getInitials = (firstName?: string, lastName?: string) => {
//     if (firstName && lastName) {
//       return `${firstName[0]}${lastName[0]}`;
//     }
//     return 'U';
//   };

//   const closeSidebar = () => {
//     setIsSidebarOpen(false);
//   };

//   return (
//     <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
//       <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
//         <div className="flex items-center space-x-4">
//           <Button variant="ghost" size="icon" asChild>
//             <Link to="/dashboard">
//               <ArrowLeft className="h-5 w-5" />
//             </Link>
//           </Button>
//           <Button 
//             variant="ghost" 
//             size="icon" 
//             className="lg:hidden"
//             onClick={() => setIsSidebarOpen(true)}
//           >
//             <Menu className="h-5 w-5" />
//           </Button>
//           <div className="hidden sm:block">
//             <h1 className="text-xl font-semibold text-gray-900">Client Chat</h1>
//             <div className="text-sm text-gray-600 flex items-center">
//               {isConnected ? (
//                 <>
//                   <span className={`w-2 h-2 rounded-full mr-2 ${
//                     chatStatus === 'online' ? 'bg-green-500' : 
//                     chatStatus === 'away' ? 'bg-yellow-500' : 'bg-red-500'
//                   }`}></span>
//                   {chatStatus === 'online' ? 'Online' : chatStatus === 'away' ? 'Away' : 'Offline'}
//                 </>
//               ) : (
//                 <span className="text-yellow-600">Connecting...</span>
//               )}
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button 
//             variant="outline" 
//             size="icon"
//             onClick={() => initiateCall('voice')}
//             disabled={!isConnected}
//           >
//             <Phone className="h-4 w-4 text-green-600" />
//           </Button>
//           <Button 
//             variant="outline" 
//             size="icon"
//             onClick={() => initiateCall('video')}
//             disabled={!isConnected}
//           >
//             <Video className="h-4 w-4 text-blue-600" />
//           </Button>
//           <Button variant="outline" size="icon">
//             <MoreVertical className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       {/* Mobile Sidebar Overlay */}
//       {isSidebarOpen && (
//         <div 
//           className="fixed inset-0 bg-black/50 z-40 lg:hidden"
//           onClick={closeSidebar}
//         />
//       )}

//       <div className="flex-1 max-w-7xl mx-auto p-4 md:p-6 overflow-hidden">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 h-full">
//           {/* Quick Info Card - Sidebar / Drawer */}
//           <div className={`
//             fixed lg:static inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white lg:bg-transparent lg:w-auto transform transition-transform duration-300 ease-in-out overflow-y-auto
//             ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//             lg:block rounded-lg lg:rounded-none h-fit lg:h-full
//           `}>
//             <div className="p-4 lg:p-0 h-full">
//               {/* Mobile Header for Sidebar */}
//               <div className="flex items-center justify-between mb-4 lg:hidden">
//                 <h2 className="text-lg font-semibold text-gray-900">Chat Details</h2>
//                 <Button variant="ghost" size="icon" onClick={closeSidebar}>
//                   <X className="h-5 w-5" />
//                 </Button>
//               </div>

//               <Card className="h-full lg:border-0 lg:shadow-sm flex flex-col">
//                 <CardHeader className="flex-shrink-0">
//                   <CardTitle className="text-lg">Chat Details</CardTitle>
//                 </CardHeader>
//                 <CardContent className="flex-1 overflow-y-auto">
//                   <div className="space-y-4">
//                     <div className="text-center py-4">
//                       <Avatar className="w-16 h-16 mx-auto mb-3">
//                         <AvatarImage src="/admin-avatar.svg" alt="Client" />
//                         <AvatarFallback className="bg-[#0F4C5C] text-white text-xl">CL</AvatarFallback>
//                       </Avatar>
//                       <h3 className="font-medium text-gray-900">Client Support</h3>
//                       <p className="text-sm text-gray-500">General Inquiries</p>
//                     </div>
//                     <div className="border-t pt-4">
//                       <div className="flex justify-between py-2">
//                         <span className="text-gray-600">Status</span>
//                         <span className="font-medium text-green-600">Active</span>
//                       </div>
//                       <div className="flex justify-between py-2">
//                         <span className="text-gray-600">Messages</span>
//                         <span className="font-medium">{messages.length}</span>
//                       </div>
//                       <div className="flex justify-between py-2">
//                         <span className="text-gray-600 flex items-center">
//                           <Eye className="h-4 w-4 mr-1" /> Views
//                         </span>
//                         <span className="font-medium">{viewCount}</span>
//                       </div>
//                       <div className="flex justify-between py-2">
//                         <span className="text-gray-600 flex items-center">
//                           <MessageSquare className="h-4 w-4 mr-1" /> Replies
//                         </span>
//                         <span className="font-medium">{replyCount}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
                
//                 {/* Quick Actions at bottom */}
//                 <div className="flex-shrink-0 border-t pt-4 mt-4">
//                   <div className="space-y-2">
//                     <Button variant="outline" className="w-full justify-start" asChild onClick={closeSidebar}>
//                       <Link to="/create-request">
//                         <ArrowLeft className="h-4 w-4 mr-2" />
//                         Create Request
//                       </Link>
//                     </Button>
//                     <Button variant="outline" className="w-full justify-start" asChild onClick={closeSidebar}>
//                       <Link to="/my-requests">
//                         <ArrowLeft className="h-4 w-4 mr-2" />
//                         View Requests
//                       </Link>
//                     </Button>
//                   </div>
//                 </div>
//               </Card>
//             </div>
//           </div>

//           {/* Messages Area */}
//           <div className="lg:col-span-3 h-full flex flex-col">
//             <Card className="flex flex-col h-full overflow-hidden">
//               <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
//                 {/* Messages Area - Scrollable */}
//                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                     {messages.length === 0 ? (
//                       <div className="text-center py-16">
//                         <div className="w-20 h-20 bg-[#0F4C5C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
//                           <svg className="h-10 w-10 text-[#0F4C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                           </svg>
//                         </div>
//                         <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Conversation</h3>
//                         <p className="text-gray-600 max-w-md mx-auto">
//                           Our support team is here to help. Send us a message and we will respond as soon as possible.
//                         </p>
//                       </div>
//                     ) : (
//                       messages.map((message) => (
//                         <div
//                           key={message.id}
//                           className={`flex items-start space-x-3 ${
//                             message.senderType === 'admin' ? 'flex-row-reverse space-x-reverse' : ''
//                           }`}
//                         >
//                           <Avatar className="w-10 h-10 flex-shrink-0">
//                             {message.senderType === 'admin' ? (
//                               <>
//                                 <AvatarImage src={user?.avatar} alt={user?.firstName} />
//                                 <AvatarFallback className="bg-[#0F4C5C] text-white text-sm">
//                                   {user?.firstName?.[0]}{user?.lastName?.[0]}
//                                 </AvatarFallback>
//                               </>
//                             ) : (
//                               <>
//                                 <AvatarImage src={message.avatar} alt={message.firstName} />
//                                 <AvatarFallback className="bg-gray-300 text-gray-600 text-sm">
//                                   {getInitials(message.firstName, message.lastName)}
//                                 </AvatarFallback>
//                               </>
//                             )}
//                           </Avatar>
//                           <div
//                             className={`max-w-[85%] md:max-w-lg px-4 py-3 rounded-xl ${
//                               message.type === 'call_log' 
//                                 ? 'bg-gray-100 text-gray-700 text-center w-full max-w-xs mx-auto'
//                                 : message.senderType === 'admin'
//                                   ? 'bg-[#0F4C5C] text-white'
//                                   : 'bg-white border border-gray-200 text-gray-900'
//                             }`}
//                           >
//                             {message.type === 'call_log' ? (
//                               <div className="flex items-center justify-center space-x-2">
//                                 <Phone className="h-4 w-4" />
//                                 <p className="text-sm">{message.content}</p>
//                               </div>
//                             ) : (
//                               <>
//                                 <p className="text-sm break-words">{message.content}</p>
//                                 {message.attachmentUrl && (
//                                   <div className="mt-2">
//                                     {message.type === 'image' ? (
//                                       <img 
//                                         src={apiClient.getFileUrl(message.attachmentUrl)} 
//                                         alt="Attachment"
//                                         className="max-w-full h-auto rounded cursor-pointer"
//                                         onClick={() => window.open(apiClient.getFileUrl(message.attachmentUrl), '_blank')}
//                                       />
//                                     ) : (
//                                       <a 
//                                         href={apiClient.getFileUrl(message.attachmentUrl)} 
//                                         download={message.attachmentName}
//                                         className="flex items-center space-x-2 text-sm underline"
//                                       >
//                                         <Paperclip className="w-4 h-4" />
//                                         <span className="truncate">{message.attachmentName || 'Attachment'}</span>
//                                       </a>
//                                     )}
//                                   </div>
//                                 )}
//                                 <p className={`text-xs mt-1 ${message.senderType === 'admin' ? 'text-cyan-100' : 'text-gray-400'}`}>
//                                   {formatTime(message.timestamp)}
//                                 </p>
//                               </>
//                             )}
//                           </div>
//                         </div>
//                       ))
//                     )}

//                     {isTyping && (
//                       <div className="flex items-start space-x-3">
//                         <Avatar className="w-10 h-10">
//                           <AvatarImage src="/admin-avatar.svg" alt="User" />
//                           <AvatarFallback className="bg-gray-300 text-gray-600">U</AvatarFallback>
//                         </Avatar>
//                         <div className="bg-white border border-gray-200 px-4 py-3 rounded-xl">
//                           <div className="flex space-x-1">
//                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     <div ref={messagesEndRef} />
//                   </div>

//                 {/* Message Input */}
//                 <div className="border-t p-4 bg-white flex-shrink-0">
//                   {/* Attachments Preview */}
//                   {attachedFiles.length > 0 && (
//                     <div className="p-3 border-b bg-gray-50 mb-3 shrink-0">
//                       <div className="flex flex-wrap gap-2 overflow-x-auto overflow-y-hidden max-h-[100px]">
//                         {attachedFiles.map((attachment, index) => (
//                           <div
//                             key={index}
//                             className="relative group flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border shadow-sm"
//                           >
//                             {attachment.preview ? (
//                               <img
//                                 src={attachment.preview}
//                                 alt={attachment.file.name}
//                                 className="w-6 h-6 rounded object-cover"
//                               />
//                             ) : (
//                               <Paperclip className="w-4 h-4 text-gray-500" />
//                             )}
//                             <span className="text-sm text-gray-700 max-w-[120px] md:max-w-[150px] truncate">
//                               {attachment.file.name}
//                             </span>
//                             <button
//                               type="button"
//                               onClick={() => handleRemoveAttachment(index)}
//                               className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
//                             >
//                               <X className="w-3 h-3 text-gray-500" />
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
                  
//                   <RichInput
//                     value={newMessage}
//                     onChange={setNewMessage}
//                     onSubmit={sendMessage}
//                     onFilesSelected={handleFilesSelected}
//                     onRemoveFile={handleRemoveAttachment}
//                     attachedFiles={attachedFiles.map(a => ({
//                       file: a.file,
//                       type: a.preview ? 'image' as const : 'file' as const,
//                       preview: a.preview
//                     }))}
//                     isLoading={isSending || !isConnected}
//                     placeholder="Type your message..."
//                   />
//                   {!isConnected && (
//                     <p className="text-sm text-red-600 mt-2">
//                       Connection lost. Please wait while we reconnect...
//                     </p>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };





// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { Send, Phone, Video, MoreVertical, Bot, X, Mic, MicOff, VideoOff, PhoneOff, ArrowLeft, Paperclip, Eye, MessageSquare, Menu, PanelLeftClose, PanelLeftOpen, Clock, User, Shield, HelpCircle, FileText, Image as ImageIcon, Download } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import { Textarea } from '@/components/ui/textarea';
// import { useSocketContext } from '@/contexts/SocketContext';
// import { useAuthStore } from '@/stores/authStore';
// import { useToast } from '@/hooks/use-toast';
// import { apiClient } from '@/lib/api';

// interface FileAttachment {
//   id: string;
//   file: File;
//   preview?: string;
// }

// interface Message {
//   id: string;
//   content: string;
//   senderId: string;
//   senderType: 'user' | 'admin' | 'bot';
//   timestamp: Date;
//   isRead: boolean;
//   type?: 'text' | 'call_log' | 'image' | 'file';
//   callDuration?: number;
//   callType?: 'voice' | 'video';
//   attachmentUrl?: string;
//   attachmentName?: string;
//   firstName?: string;
//   lastName?: string;
//   avatar?: string;
// }

// interface CallState {
//   isActive: boolean;
//   isConnecting: boolean;
//   type: 'voice' | 'video' | null;
//   startTime: Date | null;
//   duration: number;
// }

// const ClientChatPage: React.FC = () => {
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: '1',
//       content: 'Hello! How can I help you today?',
//       senderId: 'admin1',
//       senderType: 'admin',
//       timestamp: new Date(Date.now() - 3600000),
//       isRead: true,
//       firstName: 'Support',
//       lastName: 'Team',
//       avatar: '/admin-avatar.svg'
//     },
//     {
//       id: '2',
//       content: 'Hi! I need help with my account settings.',
//       senderId: 'user1',
//       senderType: 'user',
//       timestamp: new Date(Date.now() - 1800000),
//       isRead: true,
//       firstName: 'You',
//       lastName: ''
//     },
//     {
//       id: '3',
//       content: 'Sure, I can help with that. Could you please tell me what specific issue you\'re facing?',
//       senderId: 'admin1',
//       senderType: 'admin',
//       timestamp: new Date(Date.now() - 900000),
//       isRead: true,
//       firstName: 'Support',
//       lastName: 'Team',
//       avatar: '/admin-avatar.svg'
//     }
//   ]);

//   const { socket, isConnected } = useSocketContext();
// const { user } = useAuthStore();
// const { toast } = useToast();

// const [messages, setMessages] = useState<Message[]>([]);
// const [newMessage, setNewMessage] = useState('');
// const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
// const [isSending, setIsSending] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [chatStatus, setChatStatus] = useState<'online' | 'offline' | 'away'>('online');
//   const [supportUser, setSupportUser] = useState<{id: number; firstName: string; lastName: string; avatar?: string} | null>({
//     id: 1,
//     firstName: 'Support',
//     lastName: 'Team',
//     avatar: '/admin-avatar.svg'
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const [viewCount, setViewCount] = useState(42);
//   const [replyCount, setReplyCount] = useState(12);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [callState, setCallState] = useState<CallState>({
//     isActive: false,
//     isConnecting: false,
//     type: null,
//     startTime: null,
//     duration: 0
//   });
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messagesContainerRef = useRef<HTMLDivElement>(null);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const inputContainerRef = useRef<HTMLDivElement>(null);
//   const callTimerRef = useRef<NodeJS.Timeout | null>(null);

//   const { socket, isConnected } = useSocketContext();
//   const { user } = useAuthStore();
//   const { toast } = useToast();

//   // Auto-scroll to bottom on new messages
//   useEffect(() => {
//     if (messagesContainerRef.current) {
//       const container = messagesContainerRef.current;
//       container.scrollTop = container.scrollHeight;
//     }
//   }, [messages]);

//   // Adjust textarea height
//   useEffect(() => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = 'auto';
//       textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
//     }
//   }, [newMessage]);

//   // Focus textarea on mount
//   useEffect(() => {
//     if (textareaRef.current) {
//       textareaRef.current.focus();
//     }
//   }, []);

//   // Call timer effect
//   useEffect(() => {
//     if (callState.isActive && callState.startTime) {
//       callTimerRef.current = setInterval(() => {
//         setCallState(prev => ({
//           ...prev,
//           duration: Math.floor((Date.now() - (prev.startTime?.getTime() || 0)) / 1000)
//         }));
//       }, 1000);
//     }

//     return () => {
//       if (callTimerRef.current) {
//         clearInterval(callTimerRef.current);
//       }
//     };
//   }, [callState.isActive, callState.startTime]);

//   const handleNewMessage = (message: Message) => {
//     setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
//   };

//   const handleTyping = (data: { userId: string; senderType: string }) => {
//     if (data.senderType === 'user') {
//       setIsTyping(true);
//       setTimeout(() => setIsTyping(false), 3000);
//     }
//   };

//   const handleStopTyping = () => {
//     setIsTyping(false);
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const initiateCall = async (type: 'voice' | 'video') => {
//     if (!socket || !isConnected) {
//       toast({
//         title: 'Connection Error',
//         description: 'Please check your connection and try again.',
//         variant: 'destructive',
//       });
//       return;
//     }

//     try {
//       if (type === 'video') {
//         await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       } else {
//         await navigator.mediaDevices.getUserMedia({ audio: true });
//       }

//       setCallState({
//         isActive: true,
//         isConnecting: true,
//         type,
//         startTime: null,
//         duration: 0
//       });

//       socket.emit('initiate_call', { type, userId: user?.id });

//       setTimeout(() => {
//         setCallState(prev => ({
//           ...prev,
//           isConnecting: false,
//           startTime: new Date()
//         }));

//         const callLogMessage: Message = {
//           id: Date.now().toString(),
//           content: `${type === 'video' ? 'Video' : 'Voice'} call started`,
//           senderId: 'system',
//           senderType: 'bot',
//           timestamp: new Date(),
//           isRead: true,
//           type: 'call_log',
//           callType: type
//         };
//         setMessages(prev => [...prev, callLogMessage]);

//         toast({
//           title: 'Call Connected',
//           description: `${type === 'video' ? 'Video' : 'Voice'} call is now active`,
//         });
//       }, 2000);

//     } catch (error) {
//       toast({
//         title: 'Permission Denied',
//         description: 'Please allow camera/microphone access to make calls.',
//         variant: 'destructive',
//       });
//     }
//   };

//   const endCall = () => {
//     if (callTimerRef.current) {
//       clearInterval(callTimerRef.current);
//     }

//     if (socket && isConnected) {
//       socket.emit('end_call', { userId: user?.id });
//     }

//     const callLogMessage: Message = {
//       id: Date.now().toString(),
//       content: `${callState.type === 'video' ? 'Video' : 'Voice'} call ended. Duration: ${formatDuration(callState.duration)}`,
//       senderId: 'system',
//       senderType: 'bot',
//       timestamp: new Date(),
//       isRead: true,
//       type: 'call_log',
//       callType: callState.type || undefined,
//       callDuration: callState.duration
//     };
//     setMessages(prev => [...prev, callLogMessage]);

//     setCallState({
//       isActive: false,
//       isConnecting: false,
//       type: null,
//       startTime: null,
//       duration: 0
//     });

//     toast({
//       title: 'Call Ended',
//       description: `Call duration: ${formatDuration(callState.duration)}`,
//     });
//   };

//   const handleRemoveAttachment = (index: number) => {
//     setAttachedFiles(prev => {
//       const attachment = prev[index];
//       if (attachment?.preview) {
//         URL.revokeObjectURL(attachment.preview);
//       }
//       return prev.filter((_, i) => i !== index);
//     });
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     const newAttachments: FileAttachment[] = Array.from(files).map(file => ({
//       id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       file,
//       preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
//     }));
    
//     setAttachedFiles(prev => [...prev, ...newAttachments].slice(0, 5));
    
//     // Reset file input
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const triggerFileInput = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   const sendMessage = async () => {
//     const textContent = newMessage.trim();
    
//     if (!textContent && attachedFiles.length === 0) return;

//     setIsSending(true);

//     const tempId = Date.now().toString();
//     const firstFile = attachedFiles.length > 0 ? attachedFiles[0] : null;
//     const firstFileObj = firstFile ? firstFile.file : null;
    
//     const optimisticMessage: Message = {
//       id: tempId,
//       content: textContent,
//       senderId: user?.id?.toString() || 'unknown',
//       senderType: 'user',
//       timestamp: new Date(),
//       isRead: true,
//       type: firstFileObj ? (firstFileObj.type.startsWith('image/') ? 'image' : 'file') : 'text',
//       attachmentUrl: firstFile?.preview,
//       attachmentName: firstFileObj ? firstFileObj.name : undefined,
//       firstName: user?.firstName,
//       lastName: user?.lastName,
//       avatar: user?.avatar
//     };

//     setMessages(prev => [...prev, optimisticMessage]);
//     setNewMessage('');
//     setAttachedFiles([]);

//     // Simulate API call
//     setTimeout(() => {
//       setIsSending(false);
//       // Focus back on textarea after sending
//       if (textareaRef.current) {
//         textareaRef.current.focus();
//         textareaRef.current.style.height = 'auto';
//       }
//     }, 500);
//   };

//   const formatTime = (timestamp: Date) => {
//     return new Date(timestamp).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   const formatDate = (timestamp: Date) => {
//     const today = new Date();
//     const messageDate = new Date(timestamp);
    
//     if (messageDate.toDateString() === today.toDateString()) {
//       return 'Today';
//     } else if (
//       messageDate.getDate() === today.getDate() - 1 &&
//       messageDate.getMonth() === today.getMonth() &&
//       messageDate.getFullYear() === today.getFullYear()
//     ) {
//       return 'Yesterday';
//     } else {
//       return messageDate.toLocaleDateString('en-US', {
//         month: 'short',
//         day: 'numeric',
//       });
//     }
//   };

//   const formatDuration = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getInitials = (firstName?: string, lastName?: string) => {
//     if (firstName && lastName) {
//       return `${firstName[0]}${lastName[0]}`;
//     }
//     return 'U';
//   };

//   const getStatusColor = (status: 'online' | 'offline' | 'away') => {
//     switch (status) {
//       case 'online': return 'bg-green-500';
//       case 'away': return 'bg-yellow-500';
//       case 'offline': return 'bg-red-500';
//       default: return 'bg-gray-500';
//     }
//   };

//   const getStatusText = (status: 'online' | 'offline' | 'away') => {
//     switch (status) {
//       case 'online': return 'Online';
//       case 'away': return 'Away';
//       case 'offline': return 'Offline';
//       default: return 'Unknown';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Header */}
//       <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
//         <div className="container mx-auto px-4 py-3">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-gray-100">
//                 <Link to="/dashboard">
//                   <ArrowLeft className="h-5 w-5" />
//                 </Link>
//               </Button>
              
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="lg:hidden rounded-full hover:bg-gray-100"
//                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//               >
//                 <Menu className="h-5 w-5" />
//               </Button>

//               <div className="flex items-center space-x-3">
//                 <div className="relative">
//                   <Avatar className="h-10 w-10 border-2 border-white shadow">
//                     <AvatarImage src="/admin-avatar.svg" alt="Support" />
//                     <AvatarFallback className="bg-gradient-to-br from-[#0F4C5C] to-[#1B9AAA] text-white">
//                       ST
//                     </AvatarFallback>
//                   </Avatar>
//                   <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(chatStatus)} rounded-full border-2 border-white`} />
//                 </div>
                
//                 <div>
//                   <h1 className="font-semibold text-gray-900">Support Team</h1>
//                   <div className="flex items-center space-x-1">
//                     <div className={`w-2 h-2 rounded-full ${getStatusColor(chatStatus)}`} />
//                     <span className="text-sm text-gray-600">
//                       {getStatusText(chatStatus)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center space-x-2">
//               {/* Call Buttons */}
//               {callState.isActive ? (
//                 <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
//                   <div className="flex items-center space-x-1">
//                     <Clock className="h-4 w-4 text-red-600" />
//                     <span className="text-sm font-medium text-red-600">
//                       {formatDuration(callState.duration)}
//                     </span>
//                   </div>
//                   <Button
//                     variant="destructive"
//                     size="sm"
//                     className="rounded-full"
//                     onClick={endCall}
//                   >
//                     <PhoneOff className="h-4 w-4 mr-1" />
//                     End Call
//                   </Button>
//                 </div>
//               ) : (
//                 <>
//                   <Button
//                     variant="outline"
//                     size="icon"
//                     className="rounded-full hover:bg-green-50 hover:text-green-600 transition-colors"
//                     onClick={() => initiateCall('voice')}
//                     disabled={!isConnected}
//                   >
//                     <Phone className="h-4 w-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="icon"
//                     className="rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
//                     onClick={() => initiateCall('video')}
//                     disabled={!isConnected}
//                   >
//                     <Video className="h-4 w-4" />
//                   </Button>
//                 </>
//               )}
              
//               <Button variant="ghost" size="icon" className="rounded-full">
//                 <MoreVertical className="h-5 w-5" />
//               </Button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 h-[calc(100vh-80px)]">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full py-6">
//           {/* Sidebar */}
//           <div className={`
//             fixed lg:static inset-y-0 left-0 z-40 w-80 max-w-[85vw] bg-white shadow-xl lg:shadow-none 
//             transform transition-transform duration-300 ease-in-out lg:transform-none
//             ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//             lg:block rounded-xl lg:rounded-none overflow-y-auto h-full
//           `}>
//             <Card className="h-full border-0 shadow-none flex flex-col">
//               <CardHeader className="pb-4 flex-shrink-0">
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="text-lg font-semibold">Chat Details</CardTitle>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="lg:hidden rounded-full"
//                     onClick={() => setIsSidebarOpen(false)}
//                   >
//                     <X className="h-5 w-5" />
//                   </Button>
//                 </div>
//                 <CardDescription>Support conversation information</CardDescription>
//               </CardHeader>

//               <CardContent className="flex-1 overflow-y-auto space-y-6">
//                 {/* Support Team Info */}
//                 <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
//                   <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white shadow-lg">
//                     <AvatarImage src="/admin-avatar.svg" alt="Support Team" />
//                     <AvatarFallback className="bg-gradient-to-br from-[#0F4C5C] to-[#1B9AAA] text-white text-2xl">
//                       ST
//                     </AvatarFallback>
//                   </Avatar>
//                   <h3 className="font-semibold text-gray-900 text-lg">Support Team</h3>
//                   <p className="text-gray-600 text-sm">24/7 Customer Support</p>
//                   <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
//                     <Shield className="h-3 w-3 mr-1" />
//                     Verified Support
//                   </Badge>
//                 </div>

//                 {/* Stats */}
//                 <div className="space-y-4">
//                   <h4 className="font-medium text-gray-900 flex items-center">
//                     <HelpCircle className="h-4 w-4 mr-2 text-gray-500" />
//                     Conversation Stats
//                   </h4>
//                   <div className="grid grid-cols-2 gap-3">
//                     <div className="bg-gray-50 p-3 rounded-lg text-center">
//                       <div className="flex items-center justify-center space-x-1 mb-1">
//                         <MessageSquare className="h-4 w-4 text-gray-500" />
//                         <span className="text-xs text-gray-600">Messages</span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
//                     </div>
//                     <div className="bg-gray-50 p-3 rounded-lg text-center">
//                       <div className="flex items-center justify-center space-x-1 mb-1">
//                         <Eye className="h-4 w-4 text-gray-500" />
//                         <span className="text-xs text-gray-600">Views</span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">{viewCount}</div>
//                     </div>
//                   </div>
//                 </div>

//                 <Separator />

//                 {/* Quick Actions */}
//                 <div className="space-y-3">
//                   <h4 className="font-medium text-gray-900">Quick Actions</h4>
//                   <Button
//                     variant="outline"
//                     className="w-full justify-start hover:bg-[#0F4C5C]/5 hover:text-[#0F4C5C]"
//                     asChild
//                     onClick={() => setIsSidebarOpen(false)}
//                   >
//                     <Link to="/create-request" className="flex items-center">
//                       <FileText className="h-4 w-4 mr-3 text-gray-500" />
//                       Create New Request
//                     </Link>
//                   </Button>
//                   <Button
//                     variant="outline"
//                     className="w-full justify-start hover:bg-[#0F4C5C]/5 hover:text-[#0F4C5C]"
//                     asChild
//                     onClick={() => setIsSidebarOpen(false)}
//                   >
//                     <Link to="/my-requests" className="flex items-center">
//                       <User className="h-4 w-4 mr-3 text-gray-500" />
//                       View My Requests
//                     </Link>
//                   </Button>
//                 </div>

//                 {/* Connection Status */}
//                 <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
//                   <div className="flex items-center justify-between mb-2">
//                     <span className="text-sm font-medium text-gray-700">Connection</span>
//                     <Badge variant={isConnected ? "default" : "destructive"} className="px-2 py-1">
//                       {isConnected ? 'Connected' : 'Disconnected'}
//                     </Badge>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-1.5">
//                     <div 
//                       className={`h-1.5 rounded-full transition-all duration-300 ${
//                         isConnected ? 'bg-green-500 w-full' : 'bg-red-500 w-1/3'
//                       }`}
//                     />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Chat Area */}
//           <div className="lg:col-span-3 h-full flex flex-col min-h-0">
//             <Card className="h-full border-0 shadow-lg flex flex-col overflow-hidden min-h-0">
//               {/* Messages Container - Scrollable Area */}
//               <div 
//                 ref={messagesContainerRef}
//                 className="flex-1 mni-h-0 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-gray-50 to-white"
//               >
//                 {/* Welcome Message */}
//                 <div className="text-center max-w-md mx-auto my-8">
//                   <div className="w-16 h-16 bg-gradient-to-br from-[#0F4C5C] to-[#1B9AAA] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//                     <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                     </svg>
//                   </div>
//                   <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Support Chat</h3>
//                   <p className="text-gray-600">
//                     Our team is here to help you. We typically respond within a few minutes during business hours.
//                   </p>
//                 </div>

//                 <div className="space-y-6">
//                   {messages.map((message, index) => {
//                     const previousMessage = index > 0 ? messages[index - 1] : null;
//                     const showDate = !previousMessage || 
//                       formatDate(previousMessage.timestamp) !== formatDate(message.timestamp);

//                     return (
//                       <React.Fragment key={message.id}>
//                         {/* Date Separator */}
//                         {showDate && (
//                           <div className="flex items-center justify-center my-4">
//                             <div className="px-4 py-1 bg-gray-100 rounded-full">
//                               <span className="text-xs font-medium text-gray-600">
//                                 {formatDate(message.timestamp)}
//                               </span>
//                             </div>
//                           </div>
//                         )}

//                         {/* Message */}
//                         <div
//                           className={`flex items-start gap-3 ${
//                             message.senderType === 'user' ? 'flex-row-reverse' : ''
//                           }`}
//                         >
//                           {/* Avatar */}
//                           {message.senderType !== 'bot' && (
//                             <Avatar className={`h-9 w-9 ${message.senderType === 'user' ? 'order-2' : ''}`}>
//                               {message.senderType === 'admin' ? (
//                                 <>
//                                   <AvatarImage src={message.avatar} alt={message.firstName} />
//                                   <AvatarFallback className="bg-gradient-to-br from-[#0F4C5C] to-[#1B9AAA] text-white">
//                                     {getInitials(message.firstName, message.lastName)}
//                                   </AvatarFallback>
//                                 </>
//                               ) : (
//                                 <>
//                                   <AvatarImage src={user?.avatar} alt={user?.firstName} />
//                                   <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-800 text-white">
//                                     {getInitials(user?.firstName, user?.lastName)}
//                                   </AvatarFallback>
//                                 </>
//                               )}
//                             </Avatar>
//                           )}

//                           {/* Message Content */}
//                           <div className={`max-w-[70%] ${message.senderType === 'user' ? 'text-right' : ''}`}>
//                             {message.senderType !== 'bot' && (
//                               <div className="flex items-center gap-2 mb-1">
//                                 <span className="text-xs font-medium text-gray-700">
//                                   {message.senderType === 'admin' ? message.firstName : 'You'}
//                                 </span>
//                                 <span className="text-xs text-gray-400">
//                                   {formatTime(message.timestamp)}
//                                 </span>
//                               </div>
//                             )}

//                             <div
//                               className={`
//                                 rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md
//                                 ${message.type === 'call_log' 
//                                   ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-center'
//                                   : message.senderType === 'admin'
//                                     ? 'bg-gradient-to-r from-[#0F4C5C] to-[#1B9AAA] text-white'
//                                     : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white'
//                                 }
//                               `}
//                             >
//                               {message.type === 'call_log' ? (
//                                 <div className="flex items-center justify-center gap-2">
//                                   <Phone className="h-4 w-4" />
//                                   <span className="text-sm">{message.content}</span>
//                                 </div>
//                               ) : (
//                                 <>
//                                   <p className="text-sm leading-relaxed break-words">{message.content}</p>
                                  
//                                   {/* Attachment */}
//                                   {message.attachmentUrl && (
//                                     <div className="mt-3">
//                                       {message.type === 'image' ? (
//                                         <div className="relative group">
//                                           <img
//                                             src={message.attachmentUrl}
//                                             alt="Attachment"
//                                             className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer transition-transform group-hover:scale-[1.02]"
//                                             onClick={() => window.open(message.attachmentUrl, '_blank')}
//                                           />
//                                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
//                                         </div>
//                                       ) : (
//                                         <a
//                                           href={message.attachmentUrl}
//                                           download={message.attachmentName}
//                                           className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
//                                         >
//                                           <FileText className="h-4 w-4" />
//                                           <span className="text-sm truncate max-w-[200px]">
//                                             {message.attachmentName || 'Download file'}
//                                           </span>
//                                           <Download className="h-3 w-3 ml-2" />
//                                         </a>
//                                       )}
//                                     </div>
//                                   )}
//                                 </>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </React.Fragment>
//                     );
//                   })}

//                   {/* Typing Indicator */}
//                   {isTyping && (
//                     <div className="flex items-start gap-3">
//                       <Avatar className="h-9 w-9">
//                         <AvatarFallback className="bg-gradient-to-br from-[#0F4C5C] to-[#1B9AAA] text-white">
//                           ST
//                         </AvatarFallback>
//                       </Avatar>
//                       <div className="bg-gradient-to-r from-[#0F4C5C] to-[#1B9AAA] rounded-2xl px-4 py-3">
//                         <div className="flex gap-1">
//                           <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" />
//                           <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
//                           <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   <div ref={messagesEndRef} />
//                 </div>
//               </div>

//               {/* Input Area - Fixed height container */}
//               <div 
//                 ref={inputContainerRef}
//                 className="border-t bg-white flex-shrink-0"
//               >
//                 {/* Attachments Preview */}
//                 {attachedFiles.length > 0 && (
//                   <div className="px-4 pt-4 pb-2 bg-gray-50 border-b">
//                     <div className="flex items-center justify-between mb-2">
//                       <span className="text-sm font-medium text-gray-700">Attachments</span>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => setAttachedFiles([])}
//                         className="h-6 px-2 text-xs"
//                       >
//                         Clear all
//                       </Button>
//                     </div>
//                     <div className="flex flex-wrap gap-2">
//                       {attachedFiles.map((attachment, index) => (
//                         <div
//                           key={attachment.id}
//                           className="group relative flex items-center gap-2 px-3 py-2 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
//                         >
//                           {attachment.preview ? (
//                             <ImageIcon className="h-4 w-4 text-blue-500" />
//                           ) : (
//                             <Paperclip className="h-4 w-4 text-gray-500" />
//                           )}
//                           <span className="text-sm text-gray-700 max-w-[150px] truncate">
//                             {attachment.file.name}
//                           </span>
//                           <button
//                             type="button"
//                             onClick={() => handleRemoveAttachment(index)}
//                             className="opacity-0 group-hover:opacity-100 ml-1 p-1 hover:bg-gray-100 rounded-full transition-all"
//                           >
//                             <X className="h-3 w-3 text-gray-500" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Hidden file input */}
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   className="hidden"
//                   multiple
//                   onChange={handleFileSelect}
//                   accept="image/*,.pdf,.doc,.docx,.txt"
//                 />

//                 {/* Input Row - Fixed height */}
//                 <div className="p-4">
//                   <div className="flex items-end gap-3">
//                     {/* File Attachment Button */}
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="icon"
//                       className="rounded-full hover:bg-gray-100 flex-shrink-0 h-10 w-10"
//                       onClick={triggerFileInput}
//                       disabled={isSending || !isConnected}
//                     >
//                       <Paperclip className="h-4 w-4" />
//                     </Button>
                    
//                     {/* Textarea Container - Flexible but limited max height */}
//                     <div className="flex-1 relative min-h-[44px]">
                      // <Textarea
                      //   ref={textareaRef}
                      //   value={newMessage}
                      //   onChange={(e) => setNewMessage(e.target.value)}
                      //   onKeyDown={handleKeyDown}
                      //   placeholder="Type your message here..."
                      //   className="min-h-[44px] max-h-[120px] px-4 py-3 resize-none border-gray-300 focus:border-[#0F4C5C] focus:ring-[#0F4C5C]"
                      //   disabled={isSending || !isConnected}
                      //   rows={1}
                      //   style={{ 
                      //     overflow: 'hidden',
                      //     height: 'auto'
                      //   }}
                      // />
//                     </div>
                    
//                     {/* Send Button */}
//                     <Button
//                       onClick={sendMessage}
//                       disabled={(!newMessage.trim() && attachedFiles.length === 0) || isSending || !isConnected}
//                       className="h-10 w-10 rounded-full bg-gradient-to-r from-[#0F4C5C] to-[#1B9AAA] hover:from-[#0F4C5C]/90 hover:to-[#1B9AAA]/90 shadow hover:shadow-md transition-all flex-shrink-0"
//                     >
//                       {isSending ? (
//                         <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
//                       ) : (
//                         <Send className="h-4 w-4" />
//                       )}
//                     </Button>
//                   </div>

//                   {/* Connection Status */}
//                   {!isConnected && (
//                     <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//                       <div className="flex items-center gap-2">
//                         <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
//                         <p className="text-sm text-yellow-700">
//                           Connecting to chat service...
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </Card>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default ClientChatPage;




// import React, { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   Send, Phone, Video, MoreVertical, ArrowLeft, Paperclip, X,
//   Clock, FileText, Image as ImageIcon, Download
// } from 'lucide-react';

// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import { Textarea } from '@/components/ui/textarea';

// import { useSocketContext } from '@/contexts/SocketContext';
// import { useAuthStore } from '@/stores/authStore';
// import { useToast } from '@/hooks/use-toast';
// import { apiClient } from '@/lib/api';

// /* ================= TYPES ================= */

// interface FileAttachment {
//   id: string;
//   file: File;
//   preview?: string;
// }

// interface Message {
//   id: string;
//   content: string;
//   senderId: string;
//   senderType: 'user' | 'admin' | 'bot';
//   timestamp: Date;
//   isRead: boolean;
//   type?: 'text' | 'call_log' | 'image' | 'file';
//   attachmentUrl?: string;
//   attachmentName?: string;
//   firstName?: string;
//   lastName?: string;
//   avatar?: string;
// }

// interface CallState {
//   isActive: boolean;
//   isConnecting: boolean;
//   type: 'voice' | 'video' | null;
//   startTime: Date | null;
//   duration: number;
// }

// /* ================= COMPONENT ================= */

// const ClientChatPage: React.FC = () => {
//   const { socket, isConnected } = useSocketContext();
//   const { user } = useAuthStore();
//   const { toast } = useToast();

//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
//   const [isSending, setIsSending] = useState(false);

//   const messagesContainerRef = useRef<HTMLDivElement>(null);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   /* ================= LOAD MESSAGES ================= */

//   useEffect(() => {
//     const loadMessages = async () => {
//       try {
//         const res = await apiClient.getSupportMessages();
//         if (res.success) {
//           setMessages(
//             res.data.messages.map((m: any) => ({
//               id: String(m.id),
//               content: m.message,
//               senderId: String(m.sender_id),
//               senderType: m.sender_role === 'admin' ? 'admin' : 'user',
//               timestamp: new Date(m.created_at),
//               isRead: Boolean(m.is_read),
//               type: m.message_type || 'text',
//               attachmentUrl: m.file_url,
//               attachmentName: m.attachment_name,
//               firstName: m.first_name,
//               lastName: m.last_name,
//               avatar: m.avatar,
//             }))
//           );
//         }
//       } catch {
//         toast({ title: 'Failed to load chat', variant: 'destructive' });
//       }
//     };

//     loadMessages();
//   }, [toast]);

//   /* ================= SOCKET ================= */

//   useEffect(() => {
//     if (!socket || !isConnected) return;

//     socket.on('new_message', (msg: any) => {
//       setMessages(prev => [
//         ...prev,
//         {
//           id: String(msg.id),
//           content: msg.message,
//           senderId: String(msg.sender_id),
//           senderType: msg.sender_role === 'admin' ? 'admin' : 'user',
//           timestamp: new Date(msg.created_at),
//           isRead: false,
//           type: msg.message_type,
//           attachmentUrl: msg.file_url,
//           attachmentName: msg.attachment_name,
//         },
//       ]);
//     });

//     return () => {
//       socket.off('new_message');
//     };
//   }, [socket, isConnected]);

//   /* ================= AUTO SCROLL ================= */

//   useEffect(() => {
//     const el = messagesContainerRef.current;
//     if (el) el.scrollTop = el.scrollHeight;
//   }, [messages]);

//   /* ================= FILE HANDLING ================= */

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return;

//     const files = Array.from(e.target.files).slice(0, 5).map(file => ({
//       id: crypto.randomUUID(),
//       file,
//       preview: file.type.startsWith('image/')
//         ? URL.createObjectURL(file)
//         : undefined,
//     }));

//     setAttachedFiles(prev => [...prev, ...files]);
//     e.target.value = '';
//   };

//   const removeAttachment = (index: number) => {
//     setAttachedFiles(prev => prev.filter((_, i) => i !== index));
//   };

//   /* ================= SEND MESSAGE ================= */

//   const sendMessage = async () => {
//     if (!newMessage.trim() && attachedFiles.length === 0) return;

//     const tempId = crypto.randomUUID();
//     const firstFile = attachedFiles[0]?.file;

//     const optimistic: Message = {
//       id: tempId,
//       content: newMessage,
//       senderId: String(user?.id),
//       senderType: 'user',
//       timestamp: new Date(),
//       isRead: true,
//       type: firstFile
//         ? firstFile.type.startsWith('image') ? 'image' : 'file'
//         : 'text',
//       attachmentUrl: firstFile ? URL.createObjectURL(firstFile) : undefined,
//       attachmentName: firstFile?.name,
//       firstName: user?.firstName,
//       lastName: user?.lastName,
//       avatar: user?.avatar,
//     };

//     setMessages(prev => [...prev, optimistic]);
//     setNewMessage('');
//     setAttachedFiles([]);
//     setIsSending(true);

//     try {
//       const res = await apiClient.sendSupportMessage(
//         optimistic.content,
//         firstFile ? [firstFile] : undefined
//       );

//       if (!res.success) throw new Error();

//       setMessages(prev =>
//         prev.map(m =>
//           m.id === tempId
//             ? {
//                 ...m,
//                 id: String(res.data.message.id),
//                 attachmentUrl: res.data.message.file_url,
//               }
//             : m
//         )
//       );
//     } catch {
//       setMessages(prev => prev.filter(m => m.id !== tempId));
//       toast({ title: 'Message failed', variant: 'destructive' });
//     } finally {
//       setIsSending(false);
//     }
//   };

//   /* ================= HELPERS ================= */

//   const formatTime = (d: Date) =>
//     d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//   /* ================= RENDER ================= */

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* HEADER */}
//       <header className="sticky top-0 z-30 bg-white border-b">
//         <div className="container mx-auto px-4 py-3 flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <Button variant="ghost" size="icon" asChild>
//               <Link to="/dashboard">
//                 <ArrowLeft className="h-5 w-5" />
//               </Link>
//             </Button>

//             <Avatar className="h-10 w-10">
//               <AvatarImage src="/admin-avatar.svg" />
//               <AvatarFallback>ST</AvatarFallback>
//             </Avatar>

//             <div>
//               <h1 className="font-semibold">Support Team</h1>
//               <p className="text-sm text-gray-500">
//                 {isConnected ? 'Online' : 'Connecting…'}
//               </p>
//             </div>
//           </div>

//           <div className="flex gap-2">
//             <Button size="icon" variant="outline"><Phone className="h-4 w-4" /></Button>
//             <Button size="icon" variant="outline"><Video className="h-4 w-4" /></Button>
//             <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
//           </div>
//         </div>
//       </header>

//       {/* CHAT */}
//       <main className="container mx-auto px-4 h-[calc(100vh-80px)]">
//         <Card className="h-full flex flex-col overflow-hidden">
//           {/* MESSAGES */}
//           <div
//             ref={messagesContainerRef}
//             className="flex-1 min-h-0 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white"
//           >
//             <div className="space-y-6">
//               {messages.map(msg => (
//                 <div
//                   key={msg.id}
//                   className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
//                 >
//                   <div className="max-w-[70%]">
//                     <div className="text-xs text-gray-500 mb-1">
//                       {msg.senderType === 'user' ? 'You' : 'Support'} · {formatTime(msg.timestamp)}
//                     </div>

//                     <div
//                       className={`rounded-2xl px-4 py-3 shadow-sm ${
//                         msg.senderType === 'user'
//                           ? 'bg-gray-900 text-white'
//                           : 'bg-gradient-to-r from-[#0F4C5C] to-[#1B9AAA] text-white'
//                       }`}
//                     >
//                       {msg.type === 'image' && msg.attachmentUrl && (
//                         <img
//                           src={apiClient.getFileUrl(msg.attachmentUrl)}
//                           className="rounded-lg max-h-64 mb-2"
//                         />
//                       )}

//                       {msg.type === 'file' && msg.attachmentUrl && (
//                         <a
//                           href={apiClient.getFileUrl(msg.attachmentUrl)}
//                           className="flex items-center gap-2 underline mb-2"
//                         >
//                           <FileText className="h-4 w-4" />
//                           {msg.attachmentName}
//                           <Download className="h-3 w-3" />
//                         </a>
//                       )}

//                       {msg.content && <p className="text-sm">{msg.content}</p>}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* INPUT */}
//           <div className="border-t bg-white p-4">
//             {attachedFiles.length > 0 && (
//               <div className="flex gap-2 mb-2 flex-wrap">
//                 {attachedFiles.map((a, i) => (
//                   <div key={a.id} className="flex items-center gap-2 px-3 py-1 border rounded">
//                     <span className="text-sm truncate max-w-[120px]">{a.file.name}</span>
//                     <X className="h-3 w-3 cursor-pointer" onClick={() => removeAttachment(i)} />
//                   </div>
//                 ))}
//               </div>
//             )}

//             <div className="flex items-end gap-3">
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 hidden
//                 multiple
//                 onChange={handleFileSelect}
//               />

//               <Button size="icon" variant="outline" onClick={() => fileInputRef.current?.click()}>
//                 <Paperclip className="h-4 w-4" />
//               </Button>

//               {/* <Textarea
//                 ref={textareaRef}
//                 value={newMessage}
//                 onChange={e => setNewMessage(e.target.value)}
//                 placeholder="Type your message…"
//                 rows={1}
//                 className="resize-"
//               /> */}

//               <Textarea
//                         ref={textareaRef}
//                         value={newMessage}
//                         onChange={(e) => setNewMessage(e.target.value)}
//                         // onKeyDown={handleKeyDown}
//                         placeholder="Type your message here..."
//                         className="min-h-[44px] max-h-[120px] px-4 py-3 resize-none border-gray-300 focus:border-[#0F4C5C] focus:ring-[#0F4C5C]"
//                         disabled={isSending || !isConnected}
//                         rows={1}
//                         style={{ 
//                           overflow: 'hidden',
//                           height: 'auto'
//                         }}
//                       />

//               <Button
//                 onClick={sendMessage}
//                 disabled={isSending}
//                 className="bg-gradient-to-r from-[#0F4C5C] to-[#1B9AAA]"
//               >
//                 <Send className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </Card>
//       </main>
//     </div>
//   );
// };

// export default ClientChatPage;





import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

/* ================= TYPES ================= */

interface Message {
  id: number;
  sender_id: number;
  message: string;
  message_type: "text" | "image" | "file";
  file_url?: string;
  created_at: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_avatar?: string;
}

interface SupportInfo {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  viewCount: number;
  replyCount: number;
}

/* ================= COMPONENT ================= */

export default function ClientChatPage() {
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [support, setSupport] = useState<SupportInfo | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ================= FETCH SUPPORT ================= */

  useEffect(() => {
    apiClient.get("/chat/support").then(res => {
      setSupport(res.data.data);
    });
  }, []);

  /* ================= FETCH MESSAGES ================= */

  useEffect(() => {
    apiClient.get("/chat/support/messages").then(res => {
      console.log(res)
      setMessages( res.data.messages);
    });
  }, []);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {
    if (!text.trim() && !file) return;

    const form = new FormData();
    if (text) form.append("message", text);
    if (file) form.append("file", file);

    const res = await apiClient.sendSupportMessage();
    setMessages(prev => [...prev, res.data.message]);

    setText("");
    setFile(null);
    textareaRef.current!.style.height = "auto";
  };

  /* ================= EMOJI ================= */

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current!;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    setText(prev => prev.slice(0, start) + emoji + prev.slice(end));
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length;
      el.focus();
    }, 0);
  };

  /* ================= UI ================= */

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 bg-gray-100">

      {/* ================= SIDEBAR ================= */}
      <Card className="hidden lg:flex flex-col p-4 space-y-6">
        {support && (
          <>
            <div className="text-center">
              <Avatar className="w-20 h-20 mx-auto">
                <AvatarImage src={support.user.avatar} />
                <AvatarFallback>ST</AvatarFallback>
              </Avatar>
              <h3 className="mt-3 font-semibold">
                {support.user.firstName} {support.user.lastName}
              </h3>
              <Badge className="mt-2">Support</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">{messages.length}</p>
                <span className="text-xs text-gray-500">Messages</span>
              </div>
              <div>
                <p className="text-xl font-bold">{support.viewCount}</p>
                <span className="text-xs text-gray-500">Views</span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ================= CHAT ================= */}
      <Card className="lg:col-span-3 flex flex-col overflow-hidden">

        {/* Messages */}
        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-white"
        >
          {messages.map(m => {
            const isMe = m.sender_id === user?.id;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`inline-block max-w-[70%] px-3 py-2 rounded-xl text-sm leading-snug
                    ${isMe
                      ? "bg-gray-900 text-white rounded-br-sm"
                      : "bg-[#0F4C5C] text-white rounded-bl-sm"}
                  `}
                >
                  {m.message_type === "image" && (
                    <img
                      src={m.file_url}
                      className="rounded-lg mb-2 max-w-[260px] cursor-pointer"
                      onClick={() => setPreviewImage(m.file_url!)}
                    />
                  )}

                  {m.message_type === "file" && (
                    <a
                      href={m.file_url}
                      download
                      className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg"
                    >
                      <Download className="h-4 w-4" />
                      <span className="truncate">Download file</span>
                    </a>
                  )}

                  {m.message && <p>{m.message}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t p-4 bg-white">
          <div className="flex items-end gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message…"
              rows={1}
              className="resize-none max-h-[120px]"
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }}
            />

            <Button
              size="icon"
              variant="outline"
              onClick={() => insertEmoji("😊")}
            >
              <Smile className="h-4 w-4" />
            </Button>

            <Button onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>
      </Card>

      {/* Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} className="max-h-[90%] max-w-[90%]" />
          <Button
            variant="ghost"
            className="absolute top-6 right-6"
            onClick={() => setPreviewImage(null)}
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
