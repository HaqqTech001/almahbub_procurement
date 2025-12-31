import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { formatNumber, getTimeAgo } from '@/lib/utils';
import {
  ShoppingCart,
  Users,
  TrendingUp,
  MessageCircle,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  approvedOrders: number;
  completedOrders: number;
  todayOrders: number;
  unreadMessages: number;
  aiResponses: number;
}

interface OrderData {
  date: string;
  count: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<OrderData[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsResponse, requestsResponse, unreadChatResponse, aiStatsResponse] = await Promise.all([
        apiClient.getRequestStats(),
        apiClient.getRequests({ limit: 5 }),
        apiClient.getUnreadChatCount().catch(() => ({ success: true, data: { count: 0 } })),
        apiClient.getAIStats().catch(() => ({ success: true, data: { totalResponses: 0 } }))
      ]);
      console.log(requestsResponse)

      if (statsResponse.success) {
        setStats({
          ...statsResponse.data.overview,
          unreadMessages: unreadChatResponse.success ? unreadChatResponse.data.count : 0,
          aiResponses: aiStatsResponse.success ? aiStatsResponse.data.totalResponses : 0
        });
        setWeeklyData(statsResponse.data.weeklyData);
      }

      if (requestsResponse.success) {
        setRecentOrders(requestsResponse.data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default values on error
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        approvedOrders: 0,
        completedOrders: 0,
        todayOrders: 0,
        unreadMessages: 0,
        aiResponses: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mobile-gap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mobile-text">Dashboard</h1>
          <p className="text-sm lg:text-base text-muted-foreground mobile-text">
            Welcome back! Here's what's happening with your procurement requests and client communications.
          </p>
        </div>
        <Button size="sm" className="self-start lg:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-sm font-medium mobile-text">Total Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl lg:text-2xl font-bold">
              {formatNumber(Number(stats?.total_requests || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(stats?.today_requests || 0)} new today
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-sm font-medium mobile-text">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl lg:text-2xl font-bold">
              {formatNumber(Number(stats?.pending_requests || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-sm font-medium mobile-text">Processing</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl lg:text-2xl font-bold">
              {formatNumber(Number(stats?.processing_requests || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-sm font-medium mobile-text">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl lg:text-2xl font-bold">
              {formatNumber(Number(stats?.completed_requests || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="card-hover">
          <CardHeader className="mobile-padding">
            <CardTitle className="text-lg mobile-text">Requests This Week</CardTitle>
            <CardDescription className="text-xs mobile-text">
              Daily request volume for the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="mobile-padding">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#205562"
                  strokeWidth={2}
                  dot={{ fill: '#205562', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#205562' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="mobile-padding">
            <CardTitle className="text-lg mobile-text">Request Status Distribution</CardTitle>
            <CardDescription className="text-xs mobile-text">
              Current status breakdown of all requests
            </CardDescription>
          </CardHeader>
          <CardContent className="mobile-padding">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart
                data={[
                  { name: 'Pending', value: Number(stats?.pending_requests || 0), color: '#f59e0b' },
                  { name: 'Processing', value: Number(stats?.processing_requests || 0), color: '#3b82f6' },
                  { name: 'Approved', value: Number(stats?.approved_requests || 0), color: '#10b981' },
                  { name: 'Completed', value: Number(stats?.completed_requests || 0), color: '#8b5cf6' },
                ]}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#205562" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card className="card-hover">
        <CardHeader className="mobile-padding">
          <CardTitle className="text-lg mobile-text">Recent Requests</CardTitle>
          <CardDescription className="text-xs mobile-text">
            Latest procurement requests that need your attention
          </CardDescription>
        </CardHeader>
        <CardContent className="mobile-padding">
          <div className="space-y-3 sm:space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3 sm:gap-0"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium mobile-text">{String(order.title || 'N/A')}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {String(order.first_name || 'N/A')} {String(order.last_name || '')} • {String(order.company || 'No company')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:space-x-2">
                    <Badge className={`${getStatusColor(String(order.status || 'received'))} text-xs px-2 py-1`}>
                      {String(order.status || 'received')}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {getTimeAgo(String(order.created_at || ''))}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="mobile-padding">
            <CardTitle className="text-lg mobile-text">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 mobile-padding">
            <Button variant="outline" className="w-full justify-start text-sm h-9">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Process Requests
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm h-9">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm h-9">
              <MessageCircle className="h-4 w-4 mr-2" />
              Client Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="mobile-padding">
            <CardTitle className="text-lg mobile-text">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 mobile-padding">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm mobile-text">API Status</span>
              <Badge variant="success" className="text-xs px-2 py-1">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm mobile-text">Database</span>
              <Badge variant="success" className="text-xs px-2 py-1">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm mobile-text">Email Service</span>
              <Badge variant="success" className="text-xs px-2 py-1">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm mobile-text">Chat Service</span>
              <Badge variant="success" className="text-xs px-2 py-1">Online</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="mobile-padding">
            <CardTitle className="text-lg mobile-text">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 mobile-padding">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm mobile-text">New Requests</span>
              <span className="font-medium text-sm">{Number(stats?.todayOrders || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm mobile-text">Messages</span>
              <Badge variant="secondary" className="text-xs">
                {Number(stats?.unreadMessages || 0)} unread
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm mobile-text">Revenue</span>
              <span className="font-medium text-sm">$0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm mobile-text">AI Responses</span>
              <Badge variant="outline" className="text-xs">
                {Number(stats?.aiResponses || 0)} responses
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;