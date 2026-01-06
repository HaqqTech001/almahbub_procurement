import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FileText, Eye, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface ProcurementRequest {
  id: number;
  title?: string;
  description?: string;
  status: 'received' | 'reviewing' | 'in_discussion' | 'sourcing' | 'completed' | 'cancelled';
  budget?: number;
  quantity?: number;
  urgency?: 'low' | 'medium' | 'high';
  delivery_location?: string;
  created_at: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company?: string;
  product_name?: string;
  // Legacy properties for compatibility
  requestNumber?: string;
  totalAmount?: number;
  createdAt?: string;
  priority?: 'low' | 'medium' | 'high';
}

const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ProcurementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchTerm, statusFilter, sortBy]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getMyOrders();
      setRequests(response.data.requests || response.data.orders || response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch requests:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch procurement requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = requests.filter(request => {
      // Safe string conversion with fallbacks
      const title = String(request.title || '').toLowerCase();
      const description = String(request.description || '').toLowerCase();
      const productName = String(request.product_name || '').toLowerCase();
      const company = String(request.company || '').toLowerCase();
      const firstName = String(request.first_name || '').toLowerCase();
      const lastName = String(request.last_name || '').toLowerCase();
      const email = String(request.email || '').toLowerCase();
      const requestNumber = String(request.id || '').toLowerCase();

      // Search filter - check multiple fields
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        title.includes(searchLower) ||
        description.includes(searchLower) ||
        productName.includes(searchLower) ||
        company.includes(searchLower) ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        email.includes(searchLower) ||
        requestNumber.includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || String(request.status || '') === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort requests
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const aDateA = new Date(a.created_at || a.createdAt || '');
          const bDateB = new Date(b.created_at || b.createdAt || '');
          return bDateB.getTime() - aDateA.getTime();
        case 'oldest':
          const aDateB = new Date(a.created_at || a.createdAt || '');
          const bDateC = new Date(b.created_at || b.createdAt || '');
          return aDateB.getTime() - bDateC.getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;
          return bPriority - aPriority;
        default:
          return 0;
      }
    });

    setFilteredRequests(filtered);
  };

  const getStatusIcon = (status: ProcurementRequest['status']) => {
    switch (status) {
      case 'received':
        return <FileText className="h-4 w-4" />;
      case 'reviewing':
        return <Clock className="h-4 w-4" />;
      case 'in_discussion':
        return <AlertCircle className="h-4 w-4" />;
      case 'sourcing':
        return <Search className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ProcurementRequest['status']) => {
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

  const getPriorityColor = (priority: ProcurementRequest['priority']) => {
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

  const formatCurrency = (amount: number | undefined | null, currency: string = 'USD') => {
    const numAmount = Number(amount) || 0;
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 tour-requests-header">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Procurement Requests</h1>
          <p className="text-gray-600">Track and manage your procurement requests</p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md tour-search-bar">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4 tour-filter-tabs">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="in_discussion">In Discussion</SelectItem>
                    <SelectItem value="sourcing">Sourcing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="amount-high">Amount: High to Low</SelectItem>
                    <SelectItem value="amount-low">Amount: Low to High</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-6">
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Showing {filteredRequests.length} of {requests.length} requests
            </p>
            <Link to="/create-request" className="tour-create-request-btn">
              <Button className="bg-gradient-brand hover:opacity-90 text-white">
                Create New Request
              </Button>
            </Link>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {requests.length === 0 ? 'No requests yet' : 'No requests found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {requests.length === 0 
                  ? 'Create your first procurement request to get started'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {requests.length === 0 && (
                <Link to="/create-request" className="tour-create-request-btn">
                  <Button className="bg-gradient-brand hover:opacity-90 text-white">
                    Create First Request
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {String(request.title || `Request #${request.id}`)}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-1 mt-1">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-shrink-0">{formatDate(String(request.created_at || request.createdAt || ''))}</span>
                          {request.company && (
                            <>
                              <span className="flex-shrink-0">•</span>
                              <span className="truncate">{String(request.company)}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(String(request.status || 'received'))}>
                            {getStatusIcon(String(request.status || 'received') as any)}
                            <span className="ml-1 capitalize">{String(request.status || 'received').replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={getPriorityColor(String(request.urgency || request.priority || 'medium'))}>
                            {String(request.urgency || request.priority || 'medium')}
                          </Badge>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(Number(request.budget || request.totalAmount || 0))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Request Description */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        {String(request.description || request.product_name || 'No description available')}
                      </p>
                    </div>

                    {/* Request Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-sm">
                      {request.quantity && (
                        <div className="flex items-center">
                          <span className="text-gray-500 min-w-[80px]">Quantity:</span>
                          <span className="ml-2 font-medium truncate">{String(request.quantity || 'N/A')}</span>
                        </div>
                      )}
                      {request.delivery_location && (
                        <div className="flex items-center">
                          <span className="text-gray-500 min-w-[80px]">Location:</span>
                          <span className="ml-2 font-medium truncate">{String(request.delivery_location || 'N/A')}</span>
                        </div>
                      )}
                      {request.urgency && (
                        <div className="flex items-center">
                          <span className="text-gray-500 min-w-[80px]">Urgency:</span>
                          <span className="ml-2 font-medium capitalize">{String(request.urgency || 'medium')}</span>
                        </div>
                      )}
                      {request.created_at && (
                        <div className="flex items-center">
                          <span className="text-gray-500 min-w-[80px]">Created:</span>
                          <span className="ml-2 font-medium truncate">{formatDate(String(request.created_at || ''))}</span>
                        </div>
                      )}
                    </div>

                    {/* Request Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                      <div className="text-sm text-gray-600 min-w-0">
                        {request.company && (
                          <p className="truncate">Company: {String(request.company)}</p>
                        )}
                        {request.first_name && request.last_name && (
                          <p className="truncate">Contact: {String(request.first_name)} {String(request.last_name)}</p>
                        )}
                      </div>
                      <Link to={`/request/${request.id}`} className="flex-shrink-0">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRequestsPage;