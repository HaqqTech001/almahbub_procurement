import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageCircle,
  Megaphone,
  AlertCircle,
  CheckCircle,
  Info,
  FileText,
  ShoppingCart,
  TrendingUp,
  Trash2,
  CheckCheck,
} from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  resource_type?: string;
  resource_id?: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    isLoading 
  } = useNotificationStore();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.is_read;
    }
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-purple-500" />;
      case 'order':
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'new_user':
        return <TrendingUp className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 dark:bg-slate-800/50';
    
    switch (type) {
      case 'message':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
      case 'announcement':
        return 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800';
      case 'order':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-white dark:bg-slate-800 border';
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on resource type
    const resourceType = notification.resource_type || notification.type;
    const resourceId = notification.resource_id;

    switch (resourceType) {
      case 'message':
      case 'chat':
        navigate('/chat');
        break;
      case 'announcement':
        navigate('/announcements');
        break;
      case 'request':
        if (resourceId) {
          navigate(`/requests?id=${resourceId}`);
        } else {
          navigate('/requests');
        }
        break;
      case 'product':
        if (resourceId) {
          navigate(`/products?id=${resourceId}`);
        } else {
          navigate('/products');
        }
        break;
      case 'user':
        navigate('/users');
        break;
      case 'ai_response':
        navigate('/chat');
        break;
      default:
        // Default behavior - just mark as read
        console.log('Navigating to default notification action');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            View and manage all your notifications
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Badge variant="secondary" className="text-sm">
            {unreadCount} unread
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
          size="sm"
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Notifications
          </CardTitle>
          <CardDescription>
            Click on a notification to view details and navigate to the relevant section
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === 'unread' 
                  ? 'You have no unread notifications' 
                  : 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md
                    ${getNotificationColor(notification.type, notification.is_read)}
                    ${!notification.is_read ? 'border-l-4 border-l-primary' : ''}
                  `}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                        <h4 className={`font-medium text-sm sm:text-base ${!notification.is_read ? 'text-primary' : ''}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {/* Resource Type Badge */}
                      {notification.resource_type && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.resource_type}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-primary rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

          {/* Notification Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Messages</h4>
                    <p className="text-xs text-muted-foreground">
                      Click to go directly to the chat
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Announcements</h4>
                    <p className="text-xs text-muted-foreground">
                      View important updates here
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Requests</h4>
                    <p className="text-xs text-muted-foreground">
                      Track request updates instantly
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
    </div>
  );
};

export default NotificationsPage;
