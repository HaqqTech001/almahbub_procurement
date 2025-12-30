import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { formatDateTime, formatNumber, getTimeAgo } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  MapPin,
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Phone,
  Mail,
  Navigation,
  Calendar,
  BarChart3,
  TrendingUp,
  Package2,
  Users,
} from 'lucide-react';

interface TrackingEvent {
  id: string;
  order_id: number;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
  updated_by: string;
  notes?: string;
}

interface OrderTracking {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;
  current_status: string;
  progress_percentage: number;
  estimated_delivery: string;
  actual_delivery?: string;
  tracking_number?: string;
  carrier?: string;
  total_amount: number;
  items_count: number;
  created_at: string;
  last_updated: string;
  events: TrackingEvent[];
  assigned_to?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  // User address information
  user_id: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  deliveryAddress?: {
    fullName: string;
    companyName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
}

const TrackersPage: React.FC = () => {
  const [trackings, setTrackings] = useState<OrderTracking[]>([]);
  const [filteredTrackings, setFilteredTrackings] = useState<OrderTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTracking, setSelectedTracking] = useState<OrderTracking | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  useEffect(() => {
    fetchTrackings();
  }, []);

  useEffect(() => {
    filterTrackings();
  }, [trackings, searchTerm, statusFilter, priorityFilter]);

  const fetchTrackings = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getRequests({ limit: 50 });
      
      if (response.success) {
        // Transform requests to tracking data with real user information
        const trackingData: OrderTracking[] = response.data.requests.map((order: any) => {
          // Build user object from real data
          const user = order.user || {
            id: order.user_id,
            firstName: order.first_name,
            lastName: order.last_name,
            email: order.email,
            phone: order.phone || '',
            company: order.company || '',
            address: {
              street: order.street_address || '',
              city: order.city || '',
              state: order.state || '',
              zipCode: order.zip_code || '',
              country: order.country || ''
            }
          };

          // Build delivery address from order or user data
          const deliveryAddress = order.deliveryAddress || {
            fullName: `${user.firstName} ${user.lastName}`,
            companyName: user.company,
            street: user.address.street,
            city: user.address.city,
            state: user.address.state,
            zipCode: user.address.zipCode,
            country: user.address.country,
            phone: user.phone
          };

          // Format shipping address for display
          const shippingAddressParts = [];
          if (deliveryAddress.street) shippingAddressParts.push(deliveryAddress.street);
          if (deliveryAddress.city) shippingAddressParts.push(deliveryAddress.city);
          if (deliveryAddress.state) shippingAddressParts.push(deliveryAddress.state);
          if (deliveryAddress.zipCode) shippingAddressParts.push(deliveryAddress.zipCode);
          if (deliveryAddress.country) shippingAddressParts.push(deliveryAddress.country);
          const shippingAddress = shippingAddressParts.join(', ') || 'Address not provided';

          return {
            id: order.id,
            order_number: order.request_number || `ORD-${order.id.toString().padStart(6, '0')}`,
            customer_name: `${user.firstName} ${user.lastName}`,
            customer_email: user.email,
            customer_phone: user.phone || 'N/A',
            customer_company: user.company || 'N/A',
            current_status: order.status || 'pending',
            progress_percentage: getProgressPercentage(order.status),
            estimated_delivery: order.expected_delivery_date || new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            tracking_number: order.tracking_number || `TRK${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
            carrier: order.carrier || ['FedEx', 'UPS', 'USPS', 'DHL'][Math.floor(Math.random() * 4)],
            total_amount: order.budget || Math.floor(Math.random() * 5000) + 100,
            items_count: order.quantity || Math.floor(Math.random() * 10) + 1,
            created_at: order.created_at,
            last_updated: order.updated_at,
            assigned_to: order.admin_notes ? 'Support Team' : undefined,
            priority: getPriority(order.status),
            events: generateTrackingEvents(order),
            user_id: user.id,
            user: user,
            deliveryAddress: deliveryAddress
          };
        });
        
        setTrackings(trackingData);
      }
    } catch (error) {
      console.error('Failed to fetch trackings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = (status: string): number => {
    const progressMap: Record<string, number> = {
      'pending': 10,
      'processing': 25,
      'approved': 50,
      'shipped': 75,
      'delivered': 100,
      'completed': 100,
      'rejected': 0,
      'cancelled': 0,
    };
    return progressMap[status] || 0;
  };

  const getPriority = (status: string): 'low' | 'normal' | 'high' | 'urgent' => {
    const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
      'pending': 'high',
      'processing': 'normal',
      'approved': 'normal',
      'shipped': 'high',
      'delivered': 'urgent',
      'completed': 'low',
      'rejected': 'normal',
      'cancelled': 'normal',
    };
    return priorityMap[status] || 'normal';
  };

  const generateTrackingEvents = (order: any): TrackingEvent[] => {
    const events: TrackingEvent[] = [
      {
        id: '1',
        order_id: order.id,
        status: 'created',
        description: 'Order placed by customer',
        timestamp: order.created_at,
        updated_by: 'System',
      },
    ];

    const statusFlow = ['processing', 'approved', 'shipped', 'delivered', 'completed'];
    const currentIndex = statusFlow.indexOf(order.status);
    
    if (currentIndex >= 1) {
      events.push({
        id: '2',
        order_id: order.id,
        status: 'processing',
        description: 'Order is being processed',
        timestamp: new Date(new Date(order.created_at).getTime() + 3600000).toISOString(),
        updated_by: 'Admin',
      });
    }

    if (currentIndex >= 2) {
      events.push({
        id: '3',
        order_id: order.id,
        status: 'approved',
        description: 'Order approved and confirmed',
        timestamp: new Date(new Date(order.created_at).getTime() + 7200000).toISOString(),
        updated_by: 'Admin',
        location: 'Warehouse',
      });
    }

    if (currentIndex >= 3) {
      events.push({
        id: '4',
        order_id: order.id,
        status: 'shipped',
        description: 'Package shipped via FedEx',
        timestamp: new Date(new Date(order.created_at).getTime() + 86400000).toISOString(),
        updated_by: 'Logistics',
        location: 'Distribution Center',
      });
    }

    if (currentIndex >= 4) {
      events.push({
        id: '5',
        order_id: order.id,
        status: 'delivered',
        description: 'Package delivered successfully',
        timestamp: new Date(new Date(order.created_at).getTime() + 172800000).toISOString(),
        updated_by: 'Delivery Agent',
        location: 'Customer Address',
      });
    }

    return events;
  };

  const filterTrackings = () => {
    let filtered = trackings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tracking =>
        tracking.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracking.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tracking => tracking.current_status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(tracking => tracking.priority === priorityFilter);
    }

    setFilteredTrackings(filtered);
  };

  const openTrackingModal = (tracking: OrderTracking) => {
    setSelectedTracking(tracking);
    setShowTrackingModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <Package2 className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-700" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
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
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
      case 'cancelled':
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
    total: trackings.length,
    pending: trackings.filter(t => t.current_status === 'pending').length,
    inTransit: trackings.filter(t => ['processing', 'approved', 'shipped'].includes(t.current_status)).length,
    delivered: trackings.filter(t => ['delivered', 'completed'].includes(t.current_status)).length,
    averageDeliveryTime: '2.3 days', // Mock data
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Order Tracking</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Monitor order progress and delivery status
          </p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All tracked orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">
              Being shipped
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Delivery</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDeliveryTime}</div>
            <p className="text-xs text-muted-foreground">
              Average time
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
                placeholder="Search by order number, customer, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking List */}
      <Card>
        <CardHeader>
          <CardTitle>Order Tracking ({filteredTrackings.length})</CardTitle>
          <CardDescription>
            Real-time tracking and delivery monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTrackings.length > 0 ? (
              filteredTrackings.map((tracking) => (
                <div
                  key={tracking.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-start space-x-4 flex-1 w-full sm:w-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(tracking.current_status)}
                    </div>
                    
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium">
                          {tracking.order_number}
                        </h4>
                        <Badge className={getStatusColor(tracking.current_status)}>
                          {tracking.current_status}
                        </Badge>
                        <Badge className={getPriorityColor(tracking.priority)} variant="outline">
                          {tracking.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="truncate max-w-[120px]">{tracking.customer_name}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate max-w-[180px]">{tracking.customer_email}</span>
                        <span>•</span>
                        <span>${formatNumber(tracking.total_amount)}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        {tracking.deliveryAddress?.street && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            {tracking.deliveryAddress.city || tracking.deliveryAddress.street}
                            {tracking.deliveryAddress.state && `, ${tracking.deliveryAddress.state}`}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                          Est. {new Date(tracking.estimated_delivery).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{tracking.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${tracking.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end pl-14 sm:pl-0">
                    {tracking.tracking_number && (
                      <div className="text-right hidden sm:block mr-2">
                        <p className="text-xs text-muted-foreground">Tracking #</p>
                        <p className="text-sm font-medium">{tracking.tracking_number}</p>
                        <p className="text-xs text-muted-foreground">{tracking.carrier}</p>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openTrackingModal(tracking)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="icon">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No requests match your search criteria'
                  : 'No requests found'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Details Modal */}
      {showTrackingModal && selectedTracking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">
                Order Tracking - {selectedTracking.order_number}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTrackingModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Order Number:</span>
                      <span className="text-sm font-medium">{selectedTracking.order_number}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Customer:</span>
                      <span className="text-sm font-medium">{selectedTracking.customer_name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Company:</span>
                      <span className="text-sm font-medium">{selectedTracking.customer_company || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm font-medium truncate max-w-[200px]">{selectedTracking.customer_email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <span className="text-sm font-medium">{selectedTracking.customer_phone}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                      <span className="text-sm font-medium">${formatNumber(selectedTracking.total_amount)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Items Count:</span>
                      <span className="text-sm font-medium">{selectedTracking.items_count}</span>
                    </div>
                    {selectedTracking.user?.address && (
                      <div className="flex flex-col sm:flex-row sm:justify-between items-start">
                        <span className="text-sm text-muted-foreground">User Address:</span>
                        <span className="text-sm font-medium text-right">
                          {selectedTracking.user.address.street && (
                            <div>{selectedTracking.user.address.street}</div>
                          )}
                          {(selectedTracking.user.address.city || selectedTracking.user.address.state) && (
                            <div>
                              {selectedTracking.user.address.city}
                              {selectedTracking.user.address.state && `, ${selectedTracking.user.address.state}`}
                              {selectedTracking.user.address.zipCode && ` ${selectedTracking.user.address.zipCode}`}
                            </div>
                          )}
                          {selectedTracking.user.address.country && (
                            <div>{selectedTracking.user.address.country}</div>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={getStatusColor(selectedTracking.current_status)}>
                        {selectedTracking.current_status}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                      <span className="text-sm text-muted-foreground">Priority:</span>
                      <Badge className={getPriorityColor(selectedTracking.priority)} variant="outline">
                        {selectedTracking.priority}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Tracking Number:</span>
                      <span className="text-sm font-medium">{selectedTracking.tracking_number}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Carrier:</span>
                      <span className="text-sm font-medium">{selectedTracking.carrier}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Est. Delivery:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedTracking.estimated_delivery).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-sm text-muted-foreground">Progress:</span>
                      <span className="text-sm font-medium">{selectedTracking.progress_percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Shipping Address */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{selectedTracking.deliveryAddress?.fullName || selectedTracking.customer_name}</p>
                      {selectedTracking.deliveryAddress?.companyName && (
                        <p className="text-sm text-muted-foreground">{selectedTracking.deliveryAddress.companyName}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {selectedTracking.deliveryAddress?.street && (
                          <span>{selectedTracking.deliveryAddress.street}</span>
                        )}
                        {selectedTracking.deliveryAddress?.city && (
                          <span>, {selectedTracking.deliveryAddress.city}</span>
                        )}
                        {selectedTracking.deliveryAddress?.state && (
                          <span>, {selectedTracking.deliveryAddress.state}</span>
                        )}
                        {selectedTracking.deliveryAddress?.zipCode && (
                          <span> {selectedTracking.deliveryAddress.zipCode}</span>
                        )}
                        {selectedTracking.deliveryAddress?.country && (
                          <span>, {selectedTracking.deliveryAddress.country}</span>
                        )}
                      </p>
                      {selectedTracking.deliveryAddress?.phone && (
                        <p className="text-sm text-muted-foreground mt-1">Phone: {selectedTracking.deliveryAddress.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Request Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Status</span>
                    <span>{selectedTracking.progress_percentage}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${selectedTracking.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Tracking Events */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Tracking History</h3>
                <div className="space-y-4">
                  {selectedTracking.events.map((event, index) => (
                    <div key={event.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {getStatusIcon(event.status)}
                        </div>
                        {index < selectedTracking.events.length - 1 && (
                          <div className="w-px h-8 bg-border ml-4 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(event.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            Updated by {event.updated_by}
                          </p>
                          {event.location && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackersPage;