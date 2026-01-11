import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Bell, ExternalLink, Send, Paperclip, MessageCircle, Heart, MessageSquare, Eye, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import ReactionButton from '@/components/ui/ReactionButton';
import RichInput from '@/components/ui/RichInput';
import ImageViewer from '@/components/ui/ImageViewer';
import { formatDate, formatDateShort, formatDateTime } from '@/lib/dateUtils';

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  media_files?: any[];
  first_name?: string;
  last_name?: string;
  reactions_count?: number;
  user_has_reacted?: boolean;
  reply_count?: number;
  views?: number;
}

// Video file with error tracking
interface VideoFile extends any {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  loadError?: boolean;
}

interface Reply {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  first_name?: string;
  last_name?: string;
  role?: string;
  avatar?: string;
  media_files?: any[];
}

const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [relatedAnnouncements, setRelatedAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Video error tracking state (keyed by file URL)
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchAnnouncementDetails();
      fetchReplies();
      trackView();
    }
  }, [id]);

  const trackView = async () => {
    try {
      // Generate or get session ID for unique view tracking
      let sessionId = localStorage.getItem('announcement_session_id');
      if (!sessionId) {
        sessionId = 'ann_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('announcement_session_id', sessionId);
      }

      await apiClient.request(`/announcements/${id}/view`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId
        }
      });
    } catch (error) {
      // Silently fail - view tracking is not critical
      console.log('View tracking failed:', error);
    }
  };

  const fetchAnnouncementDetails = async () => {
    try {
      setIsLoading(true);
      
      // First try to fetch the specific announcement directly
      try {
        const detailResponse = await apiClient.request<any>(`/announcements/${id}`);
        if (detailResponse.data && detailResponse.data.announcement) {
          setAnnouncement(detailResponse.data.announcement);
          
          // Get related announcements from the list
          const listResponse = await apiClient.getAnnouncements();
          const allAnnouncements = listResponse.data?.announcements || listResponse.data || [];
          const related = allAnnouncements
            .filter((ann: any) => 
              ann.id !== detailResponse.data.announcement.id && 
              (ann.category === detailResponse.data.announcement.category || true)
            )
            .slice(0, 3);
          setRelatedAnnouncements(related);
          return;
        }
      } catch (detailError) {
        console.log('Direct fetch failed, falling back to list search');
      }
      
      // Fallback: Fetch announcements list and find the specific one
      const response = await apiClient.getAnnouncements();
      const announcements = response.data?.announcements || response.data || [];
      
      // Find the specific announcement
      const foundAnnouncement = announcements.find((ann: any) => ann.id === parseInt(id!));
      
      if (foundAnnouncement) {
        setAnnouncement(foundAnnouncement);
        setReactionCount(foundAnnouncement.reactions_count || 0);
        setHasReacted(foundAnnouncement.user_has_reacted || false);
        
        // Get related announcements (same category or recent ones)
        const related = announcements
          .filter((ann: any) => 
            ann.id !== foundAnnouncement.id && 
            (ann.category === foundAnnouncement.category || true)
          )
          .slice(0, 3);
        setRelatedAnnouncements(related);
      } else {
        // Use mock data if not found
        setAnnouncement({
          id: parseInt(id!),
          title: 'System Maintenance Scheduled',
          content: `We are pleased to announce that our procurement platform will undergo scheduled maintenance to improve performance and add new features.

**What to expect:**
- Brief service interruption during the maintenance window
- Enhanced system performance and stability
- New procurement features and improvements
- Better user experience across all devices

**Maintenance Schedule:**
- Date: December 15, 2025
- Time: 2:00 AM - 4:00 AM EST
- Duration: Approximately 2 hours

**During this period:**
- The platform will be temporarily unavailable
- All procurement requests will be queued and processed after maintenance
- Customer support will be available via phone and email

**After maintenance:**
- Faster page load times
- Enhanced security features
- Improved mobile experience
- New procurement tools and dashboards

We apologize for any inconvenience this may cause and appreciate your patience as we work to improve your procurement experience.

For urgent procurement needs during this period, please contact our support team at support@almahbub.com or call +1 (555) 123-4567.`,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          category: 'System Updates',
          priority: 'high',
          reactions_count: 12,
          user_has_reacted: false,
          replies_count: 3
        });

        setRelatedAnnouncements([
          {
            id: 2,
            title: 'New Service Categories Added',
            content: 'We have expanded our service offerings to better serve your procurement needs.',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            category: 'Services',
            priority: 'medium'
          },
          {
            id: 3,
            title: 'Enhanced Security Features',
            content: 'Our platform now includes additional security measures to protect your data.',
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            category: 'Security',
            priority: 'high'
          }
        ]);
      }
    } catch (error: any) {
      console.error('Failed to fetch announcement details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await apiClient.getAnnouncementReplies(id!);
      const repliesData = response.data?.replies || response.data || [];
      setReplies(repliesData);
    } catch (error: any) {
      console.error('Failed to fetch replies:', error);
      setReplies([]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim() && selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add a message or attachment',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', replyContent);
      
      // Add files if any - use 'media' to match backend multer configuration
      selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      const response = await apiClient.postAnnouncementReply(id!, formData);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Your reply has been posted successfully',
        });
        setReplyContent('');
        setSelectedFiles([]);
        setShowReplyForm(false);
        fetchReplies(); // Refresh replies
        
        // Update replies count in announcement
        if (announcement) {
          setAnnouncement(prev => prev ? {
            ...prev,
            reply_count: (prev.reply_count || 0) + 1
          } : null);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to post reply. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleReaction = async () => {
    if (isReacting || !id) return;
    
    setIsReacting(true);
    // Optimistic UI update
    const wasReacted = hasReacted;
    setHasReacted(!wasReacted);
    setReactionCount(prev => wasReacted ? prev - 1 : prev + 1);
    
    try {
      const response = await apiClient.toggleAnnouncementReaction(id);
      if (response.success) {
        setHasReacted(response.data.isLiked);
        setReactionCount(response.data.count);
      }
    } catch (error: any) {
      // Revert on error
      setHasReacted(wasReacted);
      setReactionCount(prev => wasReacted ? prev + 1 : prev - 1);
      toast({
        title: 'Error',
        description: 'Failed to update reaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsReacting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (id: string) => {
    setSelectedFiles(prev => prev.filter((_, i) => i.toString() !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="bg-white rounded-lg p-8 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Announcement not found</h2>
            <p className="text-gray-600 mb-4">The announcement you're looking for doesn't exist or has been removed.</p>
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-slate-600 hover:text-slate-800 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Main Announcement */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {announcement.category && (
                    <Badge variant="secondary">{announcement.category}</Badge>
                  )}
                  {announcement.priority && (
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority} priority
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl md:text-3xl text-gray-900 mb-2">
                  {announcement.title}
                </CardTitle>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDateTime(announcement.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Published {formatDate(announcement.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <ReactionButton
                      count={reactionCount}
                      isActive={hasReacted}
                      onToggle={handleToggleReaction}
                      size="sm"
                    />
                    <span className="flex items-center text-gray-500">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {announcement.reply_count || replies.length} replies
                    </span>
                    {announcement.views !== undefined && (
                      <span className="flex items-center text-gray-500">
                        <Eye className="h-4 w-4 mr-1" />
                        {announcement.views} views
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Bell className="h-6 w-6 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {announcement.content.split('\n').map((paragraph, index) => {
                if (paragraph.trim() === '') return null;
                
                // Handle bold text
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h3 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3">
                      {paragraph.replace(/\*\*/g, '')}
                    </h3>
                  );
                }
                
                // Handle list items
                if (paragraph.startsWith('- ')) {
                  return (
                    <li key={index} className="text-gray-700 mb-2">
                      {paragraph.substring(2)}
                    </li>
                  );
                }
                
                return (
                  <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
              
              {/* Media Files */}
              {announcement.media_files && announcement.media_files.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-md font-semibold text-gray-900">Attachments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {announcement.media_files.map((file: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        {file.mimetype && file.mimetype.startsWith('video/') ? (
                          <div>
                            <div className="relative w-full h-48 bg-gray-900 rounded-lg mb-2 overflow-hidden">
                              {/* Show error UI if video failed to load */}
                              {videoErrors[apiClient.getFileUrl(file.url)] ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                                  <div className="text-center p-4">
                                    <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm mb-2">Unable to play video</p>
                                    <p className="text-xs text-gray-400 mb-3">
                                      Format may not be supported by your browser
                                    </p>
                                    <div className="text-xs text-gray-500 mb-3">
                                      <p>{file.mimetype}</p>
                                      <p className="mt-1">File: {file.originalname}</p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                      onClick={() => {
                                        const videoUrl = apiClient.getFileUrl(file.url);
                                        // Try to reload the video by resetting the error state
                                        setVideoErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors[videoUrl];
                                          return newErrors;
                                        });
                                      }}
                                    >
                                      Try Again
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-2 text-white hover:bg-white/10"
                                      onClick={() => window.open(apiClient.getFileUrl(file.url), '_blank')}
                                    >
                                      Open in new tab
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <video
                                    src={apiClient.getFileUrl(file.url)}
                                    controls
                                    className="w-full h-48 object-cover rounded-lg mb-2"
                                    preload="metadata"
                                    onError={(e) => {
                                      const video = e.currentTarget;
                                      const error = video.error;
                                      console.error('Video load error:', {
                                        code: error?.code,
                                        message: error?.message,
                                        networkState: video.networkState,
                                        readyState: video.readyState,
                                        src: video.src,
                                        mimetype: file.mimetype,
                                        filename: file.originalname
                                      });
                                      
                                      // Network error (file not found or server error)
                                      if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || 
                                          video.networkState === HTMLMediaElement.NETWORK_IDLE) {
                                        console.error('Video network error - file may not exist');
                                      }
                                      
                                      // Mark this video URL as having an error
                                      setVideoErrors(prev => ({
                                        ...prev,
                                        [apiClient.getFileUrl(file.url)]: true
                                      }));
                                    }}
                                    onLoadedData={() => {
                                      console.log('Video loaded successfully:', file.originalname);
                                    }}
                                  />
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <span className="text-sm text-gray-600 truncate">{file.originalname}</span>
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={apiClient.getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                                        Open Video
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 truncate">{file.originalname}</span>
                              <div className="flex items-center space-x-2">
                                {!videoErrors[apiClient.getFileUrl(file.url)] && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const video = (e.target as HTMLElement).closest('.border')?.querySelector('video') as HTMLVideoElement;
                                      if (video) {
                                        if (video.paused) {
                                          video.play();
                                        } else {
                                          video.pause();
                                        }
                                      }
                                    }}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Play/Pause
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" asChild>
                                  <a href={apiClient.getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : file.mimetype && file.mimetype.startsWith('image/') ? (
                          <div>
                            <img 
                              src={apiClient.getFileUrl(file.url)} 
                              alt={file.originalname}
                              className="w-full h-48 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                const imageFiles = announcement.media_files
                                  .filter((f: any) => f.mimetype && f.mimetype.startsWith('image/'))
                                  .map((f: any) => ({
                                    url: apiClient.getFileUrl(f.url),
                                    originalname: f.originalname,
                                    mimetype: f.mimetype
                                  }));
                                setImageViewerIndex(imageFiles.findIndex((img: any) => img.url === apiClient.getFileUrl(file.url)));
                                setImageViewerOpen(true);
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 truncate">{file.originalname}</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const imageFiles = announcement.media_files
                                    .filter((f: any) => f.mimetype && f.mimetype.startsWith('image/'))
                                    .map((f: any) => ({
                                      url: apiClient.getFileUrl(f.url),
                                      originalname: f.originalname,
                                      mimetype: f.mimetype
                                    }));
                                  setImageViewerIndex(imageFiles.findIndex((img: any) => img.url === apiClient.getFileUrl(file.url)));
                                  setImageViewerOpen(true);
                                }}
                              >
                                View Full Size
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Paperclip className="h-8 w-8 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.originalname}</p>
                              <p className="text-xs text-gray-500">
                                {file.mimetype} • {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={apiClient.getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                                Download
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Replies ({replies.length})
              </CardTitle>
              <Button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Reply to Announcement
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Reply Form */}
            {showReplyForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <RichInput
                  value={replyContent}
                  onChange={setReplyContent}
                  onSubmit={handleReplySubmit}
                  placeholder="Write your reply... (Supports emoji and attachments)"
                  showAttachments={true}
                />
              </div>
            )}
            
            {/* Replies List */}
            <div className="space-y-4">
              {replies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No replies yet. Be the first to respond!</p>
                </div>
              ) : (
                replies.map((reply) => (
                  <div key={reply.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reply.avatar} />
                      <AvatarFallback>
                        {reply.first_name?.[0]}{reply.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {reply.first_name} {reply.last_name}
                        </span>
                        {reply.role === 'admin' && (
                          <Badge variant="outline" className="text-xs">Admin</Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDateTime(reply.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{reply.content}</p>
                      
                      {/* Media Files */}
                      {reply.media_files && reply.media_files.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {reply.media_files.map((file: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                              <Paperclip className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{file.originalname}</span>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={apiClient.getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related Announcements */}
        {relatedAnnouncements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="h-5 w-5 mr-2" />
                Related Announcements
              </CardTitle>
              <CardDescription>
                Other recent updates and announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatedAnnouncements.map((related) => (
                  <Link 
                    key={related.id} 
                    to={`/announcement/${related.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{related.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {related.content.substring(0, 120)}...
                        </p>
                        <div className="flex items-center space-x-2">
                          {related.category && (
                            <Badge variant="outline" className="text-xs">
                              {related.category}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDateShort(related.created_at)}
                          </span>
                        </div>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnnouncementDetailPage;