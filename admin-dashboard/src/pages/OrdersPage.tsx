import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { formatDateTime, getStatusColor, getTimeAgo } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface Order {
  id: number;
  title: string;
  description: string;
  status: string;
  budget?: number;
  quantity: number;
  files: any[];
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  product_name?: string;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getOrders({ 
        page: currentPage,
        limit: 20 
      });
      
      if (response.success) {
        setOrders(response.data.orders);
        setFilteredOrders(response.data.orders);
        // Note: You'd typically get pagination info from the API
        setTotalPages(Math.ceil(response.data.orders.length / 20));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const title = String(order.title || '').toLowerCase();
        const firstName = String(order.first_name || '').toLowerCase();
        const lastName = String(order.last_name || '').toLowerCase();
        const email = String(order.email || '').toLowerCase();
        const company = String(order.company || '').toLowerCase();
        
        return title.includes(searchTerm.toLowerCase()) ||
               firstName.includes(searchTerm.toLowerCase()) ||
               lastName.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase()) ||
               company.includes(searchTerm.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await apiClient.updateOrder(orderId, { status: newStatus });
      if (response.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const response = await apiClient.deleteOrder(orderId);
        if (response.success) {
          setOrders(prev => prev.filter(order => order.id !== orderId));
        }
      } catch (error) {
        console.error('Failed to delete order:', error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'reviewing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'discussion':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'sourcing':
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const statusOptions = [
    { value: 'received', label: 'Received', color: 'bg-blue-100 text-blue-800' },
    { value: 'reviewing', label: 'Reviewing', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'discussion', label: 'In Discussion', color: 'bg-orange-100 text-orange-800' },
    { value: 'sourcing', label: 'Sourcing', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement Requests</h1>
          <p className="text-muted-foreground">
            Manage and track all client procurement requests
          </p>
        </div>
        <Button className='text-white'>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests by title, client, or company..."
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
                <option value="all">All Statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Procurement Requests ({filteredOrders.length})</CardTitle>
          <CardDescription>
            A list of all client procurement requests in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(order.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium truncate">
                          #{order.id} - {String(order.title || 'N/A')}
                        </h4>
                        <Badge className={getStatusColor(String(order.status || 'unknown'))}>
                          {String(order.status || 'unknown')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          {String(order.first_name || 'N/A')} {String(order.last_name || 'N/A')}
                        </span>
                        <span>•</span>
                        <span>{String(order.email || 'N/A')}</span>
                        {order.company && (
                          <>
                            <span>•</span>
                            <span>{String(order.company || 'N/A')}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{getTimeAgo(String(order.created_at || ''))}</span>
                      </div>
                      
                      {order.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {String(order.description || 'No description')}
                        </p>
                      )}
                      
                      {order.admin_notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Admin Notes:</strong> {String(order.admin_notes || 'No notes')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={String(order.status || 'received')}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-input bg-background rounded"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No orders match your search criteria' 
                  : 'No orders found'
                }
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;