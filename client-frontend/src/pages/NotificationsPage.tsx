import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
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
  ArrowLeft,
  CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

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
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/auth/notifications');
      const notificationsData = response.data?.notifications || response.data || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiClient.request(`/auth/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.request('/auth/notifications/read-all', {
        method: 'PUT',
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
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
        navigate('/client-chat');
        break;
      case 'announcement':
        if (notification.data?.announcementId) {
          navigate(`/announcement/${notification.data.announcementId}`);
        } else {
          navigate('/dashboard');
        }
        break;
      case 'order':
        if (resourceId) {
          navigate(`/request/${resourceId}`);
        } else {
          navigate('/my-requests');
        }
        break;
      case 'order_update':
        if (resourceId) {
          navigate(`/request/${resourceId}`);
        } else {
          navigate('/my-requests');
        }
        break;
      case 'new_message':
        navigate('/client-chat');
        break;
      default:
        // Default behavior - just mark as read
        console.log('Navigating to default notification action');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.is_read;
    }
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'new_message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-purple-500" />;
      case 'order':
      case 'order_update':
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
    if (isRead) return 'bg-gray-50 dark:bg-slate-800/50 border-gray-100';

    switch (type) {
      case 'message':
      case 'new_message':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
      case 'announcement':
        return 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800';
      case 'order':
      case 'order_update':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-0 hover:bg-transparent"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notifications</h1>
            </div>
            <p className="text-gray-600">
              Stay updated with your announcements, messages, and orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
            <Badge variant="secondary" className="text-sm bg-teal-100 text-teal-700">
              {unreadCount} unread
            </Badge>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
            className={filter === 'all' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
            size="sm"
            className={filter === 'unread' ? 'bg-teal-600 hover:bg-teal-700' : ''}
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
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2 text-gray-700">No notifications</h3>
                <p className="text-gray-500">
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
                      ${!notification.is_read ? 'border-l-4 border-l-teal-500' : ''}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Resource Type Badge */}
                        {notification.resource_type && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.resource_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Unread Indicator */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-teal-500 rounded-full" />
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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Notification Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Messages</h4>
                  <p className="text-xs text-gray-500">
                    Click to go directly to your chat
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Megaphone className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Announcements</h4>
                  <p className="text-xs text-gray-500">
                    View important updates here
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Orders</h4>
                  <p className="text-xs text-gray-500">
                    Track order updates instantly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;
