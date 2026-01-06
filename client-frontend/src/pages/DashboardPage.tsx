import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Settings,
  Plus,
  Eye,
  Calendar,
  Bell,
  Star,
  ArrowRight,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  activeDiscussions: number;
  activeProjects: number;
  unreadMessages: number;
}

interface RecentRequest {
  id: number;
  requestNumber: string;
  status: string;
  title: string;
  createdAt: string;
  budget: number;
  priority: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  count?: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    activeDiscussions: 0,
    activeProjects: 0,
    unreadMessages: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      let requests = [];
      let announcementsData = [];
      let notificationsData = [];

      if (isAdmin) {
        // Admin sees all requests and all announcements
        try {
          const [ordersResponse, announcementsResponse, notificationsResponse] = await Promise.all([
            apiClient.getMyOrders({ limit: 50 }), // Get more for admin
            apiClient.getAnnouncements(),
            apiClient.getNotifications({ limit: 5 }),
          ]);
          console.log('Admin orders response:', ordersResponse);
          requests = ordersResponse.data?.requests || ordersResponse.data?.orders || ordersResponse.data?.data || ordersResponse.data || [];
          announcementsData = announcementsResponse.data?.announcements || announcementsResponse.data?.data || announcementsResponse.data || [];
          notificationsData = notificationsResponse.data?.notifications || notificationsResponse.data?.data || notificationsResponse.data || [];
        } catch (error) {
          console.warn('Admin data fetch failed:', error);
        }
      } else {
        // Regular users only see their own requests
        try {
          const [ordersResponse, announcementsResponse, notificationsResponse] = await Promise.all([
            apiClient.getMyOrders(),
            apiClient.getAnnouncements(),
            apiClient.getNotifications({ limit: 5 }),
          ]);
          console.log('User orders response:', ordersResponse);
          requests = ordersResponse.data?.requests || ordersResponse.data?.orders || ordersResponse.data?.data || ordersResponse.data || [];
          announcementsData = announcementsResponse.data?.announcements || announcementsResponse.data?.data || announcementsResponse.data || [];
          notificationsData = notificationsResponse.data?.notifications || notificationsResponse.data?.data || notificationsResponse.data || [];
        } catch (error) {
          console.warn('User data fetch failed:', error);
        }
      }

      // Calculate stats based on role
      let totalRequests, pendingRequests, completedRequests, activeProjects;

      if (isAdmin) {
        // Admin sees system-wide stats
        totalRequests = requests.length;
        pendingRequests = requests.filter((r: any) => ['received', 'reviewing', 'in_discussion'].includes(r.status)).length;
        completedRequests = requests.filter((r: any) => r.status === 'completed').length;
        activeProjects = requests.filter((r: any) => ['reviewing', 'in_discussion', 'sourcing'].includes(r.status)).length;
      } else {
        // Regular users see their personal stats
        totalRequests = requests.length;
        pendingRequests = requests.filter((r: any) => ['received', 'reviewing', 'in_discussion', 'pending'].includes(r.status)).length;
        completedRequests = requests.filter((r: any) => r.status === 'completed').length;
        activeProjects = requests.filter((r: any) => ['reviewing', 'in_discussion', 'sourcing','processing'].includes(r.status)).length;
      }
      console.log(pendingRequests)

      setStats({
        totalRequests,
        pendingRequests,
        completedRequests,
        activeDiscussions: pendingRequests,
        activeProjects,
        unreadMessages: 0,
      });

      // Set recent requests (last 5 for users, last 10 for admin)
      const limit = isAdmin ? 10 : 5;
      setRecentRequests(requests.slice(0, limit).map((r: any) => ({
        id: r.id,
        requestNumber: r.request_number || r.id,
        status: r.status,
        title: r.title || r.product_name || 'Request',
        createdAt: r.created_at || r.createdAt,
        budget: r.budget || r.totalAmount || 0,
        priority: r.urgency || r.priority || 'medium',
      })));

      // Set recent announcements (all active for admin, last 3 for users)
      const announcementLimit = isAdmin ? 10 : 3;
      setAnnouncements(announcementsData.slice(0, announcementLimit));

      // Set notifications
      setNotifications(notificationsData.slice(0, 5));

    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty data instead of mock data
      setStats({
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        activeDiscussions: 0,
        activeProjects: 0,
        unreadMessages: 0,
      });
      setRecentRequests([]);
      setAnnouncements([]);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
      case 'reviewing':
        return <Clock className="h-4 w-4" />;
      case 'in_discussion':
        return <MessageCircle className="h-4 w-4" />;
      case 'sourcing':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_discussion':
        return 'bg-orange-100 text-orange-800';
      case 'sourcing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return formatDate(dateString);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
      case 'completed':
        return <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />;
      case 'warning':
      case 'in_discussion':
        return <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />;
      case 'error':
      case 'cancelled':
        return <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />;
      case 'new_message':
        return <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />;
      default:
        return <div className="w-2 h-2 bg-teal-500 rounded-full mt-2" />;
    }
  };

  const quickActions: QuickAction[] = [
    ...(isAdmin ? [
      {
        title: 'Admin Panel',
        description: 'Manage users and system settings',
        icon: Settings,
        href: '/admin',
        color: 'bg-slate-600 hover:bg-slate-700',
      },
      {
        title: 'Manage Requests',
        description: 'Review and process all requests',
        icon: FileText,
        href: '/admin/requests',
        color: 'bg-purple-500 hover:bg-purple-600',
        count: stats.pendingRequests,
      },
    ] : [
      {
        title: 'Create New Request',
        description: 'Submit a new procurement request',
        icon: Plus,
        href: '/create-request',
        color: 'bg-teal-500 hover:bg-teal-600',
      },
      {
        title: 'My Requests',
        description: 'Track all your procurement requests',
        icon: FileText,
        href: '/my-requests',
        color: 'bg-purple-500 hover:bg-purple-600',
        count: stats.pendingRequests,
      },
    ]),
    {
      title: 'Browse Categories',
      description: 'Explore available products & services',
      icon: Package,
      href: '/categories',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Messages',
      description: 'View conversations and updates',
      icon: MessageCircle,
      href: '/chat',
      color: 'bg-green-500 hover:bg-green-600',
      count: stats.unreadMessages > 0 ? stats.unreadMessages : undefined,
    },
    {
      title: 'Profile Settings',
      description: 'Update your account information',
      icon: Settings,
      href: '/profile',
      color: 'bg-gray-500 hover:bg-gray-600',
    },
  ];

  // Calculate progress percentage
  const completionPercentage = stats.totalRequests > 0
    ? Math.round((stats.completedRequests / stats.totalRequests) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 tour-welcome">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            {isAdmin
              ? "Here's your admin dashboard overview. Manage requests, users, and system activities."
              : "Here's an overview of your procurement activities and quick access to important actions."
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 tour-stats">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {isAdmin ? 'Total Requests' : 'Total Requests'}
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalRequests}</div>
              <p className="text-xs text-gray-500 mt-1">
                {isAdmin ? 'All system requests' : 'All time procurement requests'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</div>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting review or discussion
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.completedRequests}</div>
              <p className="text-xs text-gray-500 mt-1">
                Successfully fulfilled
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Requests</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.activeProjects}</div>
              <p className="text-xs text-gray-500 mt-1">
                Currently in progress
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Zap className="h-5 w-5 mr-2 text-amber-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and shortcuts to get things done faster
                </CardDescription>
              </CardHeader>
              <CardContent className="tour-quick-actions">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} to={action.href}>
                      <div className="p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-teal-200 transition-all cursor-pointer group bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2.5 rounded-xl text-white shadow-md ${action.color} group-hover:scale-105 transition-transform`}>
                            <action.icon className="h-5 w-5" />
                          </div>
                          {action.count !== undefined && action.count > 0 && (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5">
                              {action.count}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-500">{action.description}</p>
                        <div className="flex items-center mt-3 text-teal-600 text-sm font-medium">
                          <span>Access</span>
                          <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card className="tour-recent-requests">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-gray-900">
                      <Activity className="h-5 w-5 mr-2 text-teal-500" />
                      {isAdmin ? 'Recent Requests' : 'Recent Requests'}
                    </CardTitle>
                    <CardDescription>
                      {isAdmin ? 'Latest system requests requiring attention' : 'Your latest procurement activities'}
                    </CardDescription>
                  </div>
                  <Link to={isAdmin ? "/admin/requests" : "/my-requests"}>
                    <Button variant="outline" size="sm" className="hover:bg-gray-100">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create your first procurement request to get started with your journey</p>
                    <Link to="/create-request">
                      <Button className="bg-gradient-brand hover:opacity-90 shadow-lg shadow-teal-500/20">
                        Create Request
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900">#{request.requestNumber}</span>
                            <Badge className={`${getStatusColor(request.status)} border-0`}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1 capitalize">{String(request.status).replace('_', ' ')}</span>
                            </Badge>
                            <Badge className={`${getPriorityColor(request.priority)} border-0 capitalize`}>
                              {request.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 font-medium">{request.title}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(request.createdAt)}
                            </span>
                            <span className="flex items-center">
                              <Target className="h-3 w-3 mr-1" />
                              Budget: ${(request.budget || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Link to={`/request/${request.id}`}>
                          <Button variant="ghost" size="sm" className="hover:bg-teal-50 text-gray-500 hover:text-teal-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Announcements */}
            {announcements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Bell className="h-5 w-5 mr-2 text-blue-500" />
                    Latest Announcements
                  </CardTitle>
                  <CardDescription>
                    Important updates and news
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <Link
                        key={announcement.id}
                        to={`/announcement/${announcement.id}`}
                        className="block p-4 border border-gray-100 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-teal-50 hover:to-white hover:border-teal-100 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{announcement.title}</h4>
                            <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                              {announcement.content}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatRelativeTime(announcement.created_at)}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 ml-4 mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Completion Rate</span>
                      <div className="text-3xl font-bold text-gray-900 mt-1">{completionPercentage}%</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Target</span>
                      <div className="text-sm font-semibold text-green-600">100%</div>
                    </div>
                  </div>
                  <Progress
                    value={completionPercentage}
                    className="h-3 bg-gray-100"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {stats.completedRequests} of {stats.totalRequests} requests completed
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Active Requests</span>
                    </div>
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                      {stats.pendingRequests}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">In Discussion</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      {stats.activeDiscussions}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      {stats.completedRequests}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity / Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Star className="h-5 w-5 mr-2 text-amber-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">Updates will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
              <CardHeader>
                <CardTitle className="text-gray-900 text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link to="/services" className="flex items-center p-2.5 hover:bg-white rounded-lg transition-all group">
                  <Package className="h-4 w-4 text-gray-400 mr-3 group-hover:text-teal-500" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">Browse Services</span>
                </Link>
                <Link to="/about" className="flex items-center p-2.5 hover:bg-white rounded-lg transition-all group">
                  <FileText className="h-4 w-4 text-gray-400 mr-3 group-hover:text-teal-500" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">About Us</span>
                </Link>
                <Link to="/faq" className="flex items-center p-2.5 hover:bg-white rounded-lg transition-all group">
                  <HelpCircle className="h-4 w-4 text-gray-400 mr-3 group-hover:text-teal-500" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">FAQ</span>
                </Link>
                <Link to="/contact" className="flex items-center p-2.5 hover:bg-white rounded-lg transition-all group">
                  <MessageCircle className="h-4 w-4 text-gray-400 mr-3 group-hover:text-teal-500" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">Contact Support</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add HelpCircle icon import
import { HelpCircle } from 'lucide-react';

export default DashboardPage;
