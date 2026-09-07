import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, CreditCard, Clock, CheckCircle, Search, Phone, Mail, AlertCircle, Package, User, Calendar, DollarSign, File, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import RequestProgressBar from '@/components/ui/RequestProgressBar';
import { formatDateTime, formatDate, formatCurrency, getStatusColor, getPriorityColor, parseDate } from '@/lib/dateUtils';

// Backend URL for serving static files (uploads)
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

// Helper function to get full image URL from relative path
const getFullImageUrl = (relativePath: string): string => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  return `${BACKEND_URL}/${relativePath}`;
};

interface ProcurementRequest {
  id: number;
  requestNumber: string;
  status: 'received' | 'reviewing' | 'in_discussion' | 'sourcing' | 'completed' | 'cancelled';
  totalAmount: number;
  currency: string;
  subtotal: number;
  tax: number;
  items: RequestItem[];
  deliveryAddress: DeliveryAddress;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  expectedDeliveryDate?: string;
  specialInstructions?: string;
  assignedTo?: string;
  notes?: string;
  budgetCurrency?: string;
  budgetAmount?: number;
}

interface RequestItem {
  id: number;
  productId?: number;
  productName: string;
  description: string;
  specifications: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
  category: string;
}

interface DeliveryAddress {
  fullName: string;
  companyName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ProcurementRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getOrder(id!);
      
      // Handle different API response structures
      let requestData = null;
      
      if (response.data?.data?.request) {
        // Nested data structure
        requestData = response.data.data.request;
      } else if (response.data?.request) {
        // Single level data structure
        requestData = response.data.request;
      } else if (response.data) {
        // Direct data
        requestData = response.data;
      } else if (response) {
        // Response is the data directly
        requestData = response;
      }
      
      if (requestData) {
        // Transform request data to match frontend expectations
        setRequest({
          id: requestData.id || parseInt(id!),
          requestNumber: requestData.request_number || requestData.requestNumber || `REQ-${String(requestData.id || id).padStart(6, '0')}`,
          status: requestData.status || 'received',
          totalAmount: requestData.total_amount || requestData.totalAmount || 0,
          currency: requestData.currency || requestData.budget_currency || 'USD',
          subtotal: requestData.subtotal || 0,
          tax: requestData.tax || 0,
          items: requestData.items || [{
            id: 1,
            productId: requestData.product_id,
            productName: requestData.product_name || requestData.title || 'Procurement Item',
            description: requestData.description || 'No description provided',
            specifications: requestData.specifications || 'Standard specifications',
            quantity: requestData.quantity || 1,
            unitPrice: requestData.unit_price || 0,
            totalPrice: requestData.total_amount || 0,
            category: 'General Procurement'
          }],
          deliveryAddress: {
            fullName: `${requestData.first_name || ''} ${requestData.last_name || ''}`.trim() || 'N/A',
            companyName: requestData.company || '',
            street: requestData.delivery_street || requestData.delivery_address || 'Address to be provided',
            city: requestData.delivery_city || 'City',
            state: requestData.delivery_state || 'State',
            zipCode: requestData.delivery_zipcode || '00000',
            country: requestData.delivery_country || 'Country',
            phone: requestData.phone || ''
          },
          paymentMethod: requestData.payment_method || 'Quote-based',
          paymentStatus: requestData.payment_status || 'pending',
          createdAt: requestData.created_at || requestData.createdAt || new Date().toISOString(),
          updatedAt: requestData.updated_at || requestData.updatedAt || new Date().toISOString(),
          description: requestData.description || 'No description provided',
          priority: requestData.priority || 'medium',
          expectedDeliveryDate: requestData.expected_delivery_date,
          specialInstructions: requestData.special_instructions,
          assignedTo: requestData.assigned_to || requestData.assignedTo,
          notes: requestData.admin_notes || requestData.notes,
          budgetCurrency: requestData.budget_currency || requestData.currency || 'USD',
          budgetAmount: requestData.budget_amount || requestData.budgetAmount || null,
        });
      } else {
        throw new Error('No request data found');
      }
    } catch (error: any) {
      console.error('Failed to fetch request details:', error);
      // Use sample data for demo
      setRequest({
        id: parseInt(id!),
        requestNumber: `REQ-${id?.padStart(6, '0')}`,
        status: 'reviewing',
        totalAmount: 175.00,
        currency: 'USD',
        subtotal: 175.00,
        tax: 14.00,
        items: [
          {
            id: 1,
            productId: 1,
            productName: 'Office Equipment',
            description: 'Professional office supplies for corporate use',
            specifications: 'High-quality materials, bulk order',
            quantity: 2,
            unitPrice: 50.00,
            totalPrice: 100.00,
            category: 'Office Supplies',
          },
          {
            id: 2,
            productId: 2,
            productName: 'Software License',
            description: 'Annual software licensing for business use',
            specifications: 'Latest version, multi-user license',
            quantity: 1,
            unitPrice: 75.00,
            totalPrice: 75.00,
            category: 'Software',
          },
        ],
        deliveryAddress: {
          fullName: 'John Doe',
          companyName: 'Sample Company',
          street: '123 Business Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          phone: '+1 (555) 123-4567',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: 'Corporate office setup and software requirements',
        priority: 'medium',
        expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        specialInstructions: 'Deliver during business hours only',
        assignedTo: 'Procurement Manager',
        notes: 'Priority client request - expedite if possible',
      });
    } finally {
      setIsLoading(false);
    }
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
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatBudget = (amount: number | undefined, currency: string | undefined) => {
    if (!amount || amount <= 0) return null;
    const curr = currency || 'NGN';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString, 'N/A');
  };

  const handleCancelRequest = async () => {
    try {
      await apiClient.cancelOrder(Number(id));
      toast({
        title: 'Request Cancelled',
        description: 'Your procurement request has been cancelled successfully.',
      });
      fetchRequestDetails(); // Refresh the request data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to cancel request',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Request not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 md:mb-8">
          <Link to="/my-requests" className="text-cyan-600 hover:text-cyan-800 flex items-center text-sm md:text-base">
            <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
            Back to My Requests
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 md:mb-8 tour-request-header">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Request #{request.requestNumber || 'Unknown'}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Created on {formatDate(request.createdAt || new Date().toISOString())}
              </p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{request.description || 'No description provided'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${getStatusColor(request.status || 'received')} text-sm`}>
                {getStatusIcon(request.status || 'received')}
                <span className="ml-1 capitalize">{String(request.status || 'received').replace('_', ' ')}</span>
              </Badge>
              <Badge className={`${getPriorityColor(String(request.priority || 'medium'))} text-sm`}>
                {String(request.priority || 'medium')} priority
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 md:mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">Request Progress</CardTitle>
            <CardDescription>Track the current status of your request</CardDescription>
          </CardHeader>
          <CardContent>
            <RequestProgressBar currentStatus={request.status || 'received'} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Request Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl">Request Items</CardTitle>
                <CardDescription>Items and services requested</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {request.items && request.items.length > 0 ? (
                    request.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 md:space-x-4 p-3 md:p-4 border rounded-lg gap-3">
                        {item.image && (
                          <img
                            src={getFullImageUrl(item.image)}
                            alt={item.productName}
                            className="w-full sm:w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm md:text-base">{item.productName}</h3>
                          <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 line-clamp-2">{item.description}</p>
                          <p className="text-xs md:text-sm text-gray-500 mt-1">
                            <span className="hidden sm:inline"><strong>Specs:</strong></span> {item.specifications}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                            <strong>Qty:</strong> {item.quantity} × {formatCurrency(item.unitPrice, request.currency || 'USD')}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-gray-900 text-sm md:text-base">
                            {formatCurrency(item.totalPrice, request.currency || 'USD')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-gray-300" />
                      <p className="text-sm md:text-base">No items specified in this request</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Request Timeline */}
            <Card className="tour-request-timeline">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl">Request Timeline</CardTitle>
                <CardDescription>Track your request progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm md:text-base">Request Received</p>
                      <p className="text-xs md:text-sm text-gray-600">{formatDate(request.createdAt || new Date().toISOString())}</p>
                    </div>
                  </div>
                  
                  {(['reviewing', 'in_discussion', 'sourcing', 'completed'].includes(request.status)) && (
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">Under Review</p>
                        <p className="text-xs md:text-sm text-gray-600">Our team is reviewing your request</p>
                      </div>
                    </div>
                  )}
                  
                  {(['in_discussion', 'sourcing', 'completed'].includes(request.status)) && (
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">In Discussion</p>
                        <p className="text-xs md:text-sm text-gray-600">Discussing requirements and clarifications</p>
                      </div>
                    </div>
                  )}
                  
                  {(['sourcing', 'completed'].includes(request.status)) && (
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">Sourcing</p>
                        <p className="text-xs md:text-sm text-gray-600">Finding the best suppliers and prices</p>
                      </div>
                    </div>
                  )}
                  
                  {(request.status === 'completed') && (
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">Completed</p>
                        <p className="text-xs md:text-sm text-gray-600">Your request has been fulfilled</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Request Summary */}
            <Card className="tour-request-summary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl">Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {request.budgetAmount && request.budgetAmount > 0 && (
                  <div className="flex justify-between text-sm md:text-base bg-green-50 p-3 rounded-lg">
                    <span className="text-green-800 font-medium">Budget:</span>
                    <span className="font-semibold text-green-800">
                      {formatBudget(request.budgetAmount, request.budgetCurrency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(request.subtotal || 0, request.currency || 'USD')}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(request.tax || 0, request.currency || 'USD')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base md:text-lg font-semibold">
                  <span>Total Estimated</span>
                  <span>{formatCurrency(request.totalAmount || 0, request.currency || 'USD')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="tour-delivery-info">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base md:text-lg">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.deliveryAddress ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{request.deliveryAddress.fullName}</p>
                    {request.deliveryAddress.companyName && (
                      <p className="text-gray-600">{request.deliveryAddress.companyName}</p>
                    )}
                    <p className="text-gray-600">{request.deliveryAddress.street}</p>
                    <p className="text-gray-600">
                      {request.deliveryAddress.city}, {request.deliveryAddress.state} {request.deliveryAddress.zipCode}
                    </p>
                    <p className="text-gray-600">{request.deliveryAddress.country}</p>
                    <p className="mt-2 text-gray-600">{request.deliveryAddress.phone}</p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No delivery address specified</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Request Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Request Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Priority:</span>
                  <Badge className={`${getPriorityColor(request.priority || 'medium')} text-xs`}>
                    {request.priority || 'medium'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span>{request.items?.length || 0}</span>
                </div>
                {request.expectedDeliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected:</span>
                    <span>{request.expectedDeliveryDate}</span>
                  </div>
                )}
                {request.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned To:</span>
                    <span className="text-right max-w-[60%] truncate">{request.assignedTo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span className="text-right">{formatDate(request.updatedAt || request.createdAt || new Date().toISOString())}</span>
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            {request.specialInstructions && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{request.specialInstructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {request.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{request.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-2 md:space-y-3">
              {(request.status === 'received') && (
                <Button
                  onClick={handleCancelRequest}
                  variant="outline"
                  className="w-full text-sm md:text-base h-10 md:h-11"
                >
                  Cancel Request
                </Button>
              )}
              
              <Button asChild variant="outline" className="w-full text-sm md:text-base h-10 md:h-11">
                <a href="/chat">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </a>
              </Button>
              
              <Button asChild variant="outline" className="w-full text-sm md:text-base h-10 md:h-11">
                <a href="tel:+2348100000000">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPage;