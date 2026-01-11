import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Bell, 
  Search, 
  Filter,
  Eye,
  MessageCircle,
  Heart,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import  Skeleton  from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, formatTimeAgo } from '@/lib/dateUtils';

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

const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getAnnouncements({ per_page: 100 });
      const announcementsData = response.data?.announcements || response.data || [];
      
      // Ensure it's an array before filtering
      const announcementsArray = Array.isArray(announcementsData) ? announcementsData : [];
      
      // Extract unique categories
      const uniqueCategories = [...new Set(
        announcementsArray
          .filter((a: Announcement) => a.category)
          .map((a: Announcement) => a.category)
      )] as string[];
      
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getAnnouncements({ page: 1, per_page: 10 });
      const announcementsData = response.data?.announcements || response.data || [];
      
      // Ensure it's an array
      const data = Array.isArray(announcementsData) ? announcementsData : [];
      
      setAnnouncements(data);
      setHasMore(response.data?.next_page !== null);
      setPage(1);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreAnnouncements = async () => {
    if (isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const response = await apiClient.getAnnouncements({ page: nextPage, per_page: 10 });
      const announcementsData = response.data?.announcements || response.data || [];
      
      // Ensure it's an array
      const data = Array.isArray(announcementsData) ? announcementsData : [];
      
      setAnnouncements(prev => [...prev, ...data]);
      setHasMore(response.data?.next_page !== null);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more announcements:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filterAnnouncements = () => {
    // Ensure announcements is an array before spreading
    const announcementsArray = Array.isArray(announcements) ? announcements : [];
    let filtered = [...announcementsArray];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        a => a.title?.toLowerCase().includes(term) || 
            a.content?.toLowerCase().includes(term) ||
            (a.category && a.category.toLowerCase().includes(term))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    setFilteredAnnouncements(filtered);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateText = (text: string, maxLength: number) => {
    const stripped = stripHtml(text);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Announcements</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Announcements</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest news and announcements
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
        
        {(searchTerm || selectedCategory) && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredAnnouncements.length} result{filteredAnnouncements.length !== 1 ? 's' : ''} found
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filters'
              : 'Check back later for new announcements'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <Card 
              key={announcement.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <Link to={`/announcement/${announcement.id}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Icon/Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bell className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {announcement.title}
                        </h3>
                        {announcement.priority && (
                          <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                            {announcement.priority}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {truncateText(announcement.content, 150)}
                      </p>
                      
                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(announcement.created_at)}
                        </span>
                        
                        {announcement.category && (
                          <Badge variant="outline" className="text-xs">
                            {announcement.category}
                          </Badge>
                        )}
                        
                        {announcement.views !== undefined && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {announcement.views} views
                          </span>
                        )}
                        
                        {announcement.reactions_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {announcement.reactions_count}
                          </span>
                        )}
                        
                        {announcement.reply_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {announcement.reply_count} replies
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="flex-shrink-0 self-center">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
          
          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMoreAnnouncements}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
