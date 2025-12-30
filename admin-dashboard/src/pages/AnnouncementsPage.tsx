import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { formatDateTime, getTimeAgo } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Eye,
  Send,
  X,
  Megaphone,
  Users,
  Clock,
  Star,
  Pin,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  Edit,
  Paperclip,
  MessageCircle,
} from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  summary: string;
  type: 'info' | 'maintenance' | 'update' | 'urgent' | 'promotion';
  status: 'draft' | 'published' | 'scheduled' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'customers' | 'admins' | 'users';
  published_at?: string;
  scheduled_for?: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  views: number;
  reads: number;
  reply_count: number;
  pinned: boolean;
  attachments: string[];
  tags: string[];
  media_files?: any[];
  first_name?: string;
  last_name?: string;
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

const AnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm, typeFilter, statusFilter, targetFilter]);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      // Fetch announcements from the API
      const response = await apiClient.getAnnouncements();
      console.log('Announcements API Response:', response);
      
      // Handle different response structures: response.data.announcements or response.data or response
      const announcementsData = response.data?.announcements || response.data || response;
      console.log('Announcements data:', announcementsData);
      
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = announcements;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(announcement => announcement.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(announcement => announcement.status === statusFilter);
    }

    // Target filter
    if (targetFilter !== 'all') {
      filtered = filtered.filter(announcement => announcement.target_audience === targetFilter);
    }

    setFilteredAnnouncements(filtered);
  };

  const handleDelete = async (announcementId: number) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await apiClient.deleteAnnouncement(announcementId);
        setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
      } catch (error) {
        console.error('Failed to delete announcement:', error);
      }
    }
  };

  const handleStatusUpdate = async (announcementId: number, newStatus: string) => {
    try {
      await apiClient.updateAnnouncement(announcementId, { status: newStatus });
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId 
          ? { 
              ...ann, 
              status: newStatus as any,
              published_at: newStatus === 'published' ? new Date().toISOString() : ann.published_at,
              updated_at: new Date().toISOString()
            }
          : ann
      ));
    } catch (error) {
      console.error('Failed to update announcement status:', error);
    }
  };

  const handlePinToggle = async (announcementId: number) => {
    try {
      const announcement = announcements.find(a => a.id === announcementId);
      if (announcement) {
        await apiClient.updateAnnouncement(announcementId, { pinned: !announcement.pinned });
        setAnnouncements(prev => prev.map(ann => 
          ann.id === announcementId 
            ? { ...ann, pinned: !ann.pinned, updated_at: new Date().toISOString() }
            : ann
        ));
      }
    } catch (error) {
      console.error('Failed to toggle pin status:', error);
    }
  };

  const openViewModal = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowViewModal(true);
    
    // Fetch replies for this announcement
    setIsLoadingReplies(true);
    try {
      const response = await apiClient.getAnnouncementReplies(announcement.id);
      const fetchedReplies = response.data?.replies || [];
      setReplies(fetchedReplies);
      
      // Update the reply_count in the local state if it differs
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcement.id 
          ? { ...ann, reply_count: fetchedReplies.length }
          : ann
      ));
    } catch (error) {
      console.error('Failed to fetch replies:', error);
      setReplies([]);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const fetchReplies = async (announcementId: number) => {
    try {
      const response = await apiClient.getAnnouncementReplies(announcementId);
      setReplies(response.data?.replies || []);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
      setReplies([]);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'update':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'promotion':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'promotion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  const stats = {
    total: announcements.length,
    published: announcements.filter(a => a.status === 'published').length,
    draft: announcements.filter(a => a.status === 'draft').length,
    pinned: announcements.filter(a => a.pinned).length,
    totalViews: announcements.reduce((sum, a) => sum + a.views, 0),
    totalReplies: announcements.reduce((sum, a) => sum + (a.reply_count || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage company announcements and communications
          </p>
        </div>
        <Button onClick={() => navigate('/announcements/create')} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All announcements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Send className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">
              Active announcements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              Not published yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pinned</CardTitle>
            <Pin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pinned}</div>
            <p className="text-xs text-muted-foreground">
              Featured items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All announcement views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
            <MessageCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReplies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All replies received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements by title, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="urgent">Urgent</option>
                <option value="maintenance">Maintenance</option>
                <option value="update">Update</option>
                <option value="promotion">Promotion</option>
                <option value="info">Info</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Audiences</option>
                <option value="all">Everyone</option>
                <option value="customers">Customers</option>
                <option value="admins">Admins</option>
                <option value="users">Users</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements ({filteredAnnouncements.length})</CardTitle>
          <CardDescription>
            Manage and monitor company announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements
                .sort((a, b) => {
                  // Sort by pinned first, then by published date
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  const dateA = new Date(a.published_at || a.created_at);
                  const dateB = new Date(b.published_at || b.created_at);
                  return dateB.getTime() - dateA.getTime();
                })
                .map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex flex-col sm:flex-row items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-start space-x-4 flex-1 w-full sm:w-auto">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(announcement.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium flex items-center">
                          {announcement.title}
                          {announcement.pinned && (
                            <Pin className="h-3 w-3 ml-1 text-blue-500 flex-shrink-0" />
                          )}
                        </h4>
                        <Badge className={getTypeColor(announcement.type)}>
                          {announcement.type}
                        </Badge>
                        <Badge className={getStatusColor(announcement.status)}>
                          {announcement.status}
                        </Badge>
                        <Badge className={getPriorityColor(announcement.priority)} variant="outline">
                          {announcement.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {announcement.summary}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                          {announcement.target_audience}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1 flex-shrink-0" />
                          {announcement.views}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          {announcement.reply_count || 0}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate max-w-[150px]">
                          {announcement.published_at 
                            ? `${getTimeAgo(announcement.published_at)}`
                            : `${getTimeAgo(announcement.created_at)}`
                          }
                        </span>
                      </div>
                      
                      {announcement.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {announcement.tags.slice(0, 4).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {announcement.tags.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{announcement.tags.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pl-14 sm:pl-0">
                    <select
                      value={announcement.status}
                      onChange={(e) => handleStatusUpdate(announcement.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-input bg-background rounded w-full sm:w-auto"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="expired">Expired</option>
                    </select>
                    
                    <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openViewModal(announcement)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/announcements/edit/${announcement.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePinToggle(announcement.id)}
                    >
                      <Pin className={`h-4 w-4 ${announcement.pinned ? 'text-blue-500' : 'text-gray-400'}`} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || targetFilter !== 'all'
                  ? 'No announcements match your search criteria'
                  : 'No announcements found'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Announcement Modal */}
      {showViewModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b gap-4">
              <div className="flex items-center space-x-3">
                {getTypeIcon(selectedAnnouncement.type)}
                <h2 className="text-lg sm:text-xl font-semibold">{selectedAnnouncement.title}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowViewModal(false);
                  setReplies([]);
                  fetchAnnouncements(); // Refresh to get updated reply counts
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={getTypeColor(selectedAnnouncement.type)}>
                  {selectedAnnouncement.type}
                </Badge>
                <Badge className={getStatusColor(selectedAnnouncement.status)}>
                  {selectedAnnouncement.status}
                </Badge>
                <Badge className={getPriorityColor(selectedAnnouncement.priority)} variant="outline">
                  {selectedAnnouncement.priority}
                </Badge>
                {selectedAnnouncement.pinned && (
                  <Badge variant="outline">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <p className="text-sm text-muted-foreground">{selectedAnnouncement.target_audience}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created By</label>
                  <p className="text-sm text-muted-foreground">{selectedAnnouncement.first_name} {selectedAnnouncement.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Published</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAnnouncement.published_at 
                      ? formatDateTime(selectedAnnouncement.published_at)
                      : 'Not published'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Views / Replies</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAnnouncement.views} views / {replies.length} replies
                  </p>
                </div>
              </div>
              
              <div className="prose max-w-none mb-6">
                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                <p className="text-muted-foreground mb-4">{selectedAnnouncement.summary}</p>
                
                <h3 className="text-lg font-semibold mb-2">Content</h3>
                <div className="whitespace-pre-wrap text-sm">{selectedAnnouncement.content}</div>
              </div>
              
              {/* Media Files */}
              {selectedAnnouncement.media_files && selectedAnnouncement.media_files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAnnouncement.media_files.map((file: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        {file.mimetype && file.mimetype.startsWith('image/') ? (
                          <div>
                            <img 
                              src={apiClient.getFileUrl(file.url)} 
                              alt={file.originalname}
                              className="w-full h-48 object-cover rounded-lg mb-2"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <span className="text-sm text-gray-600 truncate">{file.originalname}</span>
                              <Button variant="outline" size="sm" asChild>
                                <a href={apiClient.getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                                  View Full Size
                                </a>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Paperclip className="h-8 w-8 text-gray-400 flex-shrink-0" />
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
              
              {selectedAnnouncement.tags && selectedAnnouncement.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnnouncement.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Replies Section */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Replies ({isLoadingReplies ? 'Loading...' : replies.length})
                </h3>
                
                {isLoadingReplies ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : replies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No replies yet. Users haven't responded to this announcement.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reply.avatar} />
                            <AvatarFallback className="bg-teal-600 text-white text-sm">
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
                            
                            {/* Reply Media Files */}
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
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnnouncementsPage;