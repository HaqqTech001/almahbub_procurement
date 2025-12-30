import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';
import { formatDateTime, getStatusColor, getTimeAgo } from '@/lib/utils';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Building,
  Package,
  DollarSign,
  Calendar,
  FileText,
  Edit,
  Save,
  X,
  File,
  Download,
  Eye,
  MapPin,
} from 'lucide-react';

interface RequestDetail {
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
  phone?: string;
  product_name?: string;
  product_description?: string;
  request_number?: string;
  priority?: string;
  expected_delivery_date?: string;
  special_instructions?: string;
  delivery_address?: string;
  payment_method?: string;
  payment_status?: string;
  // New structured address fields
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
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
}

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (id) {
      fetchRequestDetail(id);
    }
  }, [id]);

  const fetchRequestDetail = async (requestId: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getRequest(requestId);
      
      if (response.success) {
        const requestData = response.data.request || response.data.order || response.data;
        setRequest(requestData);
        setAdminNotes(requestData.admin_notes || '');
        setSelectedStatus(requestData.status || 'received');
      }
    } catch (error) {
      console.error('Failed to fetch request detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!request) return;
    
    try {
      const response = await apiClient.updateRequest(request.id.toString(), { 
        status: selectedStatus,
        adminNotes: adminNotes 
      });
      
      if (response.success) {
        setRequest(prev => prev ? { ...prev, status: selectedStatus, admin_notes: adminNotes } : null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'received':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'reviewing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'discussion':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'sourcing':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'received', label: 'Received', color: 'bg-blue-100 text-blue-800' },
    { value: 'reviewing', label: 'Reviewing', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'discussion', label: 'In Discussion', color: 'bg-orange-100 text-orange-800' },
    { value: 'sourcing', label: 'Sourcing', color: 'bg-purple-100 text-purple-800' },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Not Found</h2>
        <p className="text-gray-600 mb-6">The request you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/requests')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/requests')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Request #{request.id}
            </h1>
            <p className="text-muted-foreground">
              {request.title || 'Procurement Request'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(request.status)}
            <Badge className={getStatusColor(String(request.status || 'unknown'))}>
              {String(request.status || 'unknown')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Client Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-teal-600 text-white text-lg">
                  {request.first_name?.[0]}{request.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">
                  {request.first_name} {request.last_name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {request.email}
                </p>
              </div>
            </div>
            
            <div className="grid gap-3 pt-2">
              <div className="flex items-center space-x-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Company:</span>
                <span>{request.company || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span>{request.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{request.email}</span>
              </div>
              {/* Display complete address from user object */}
              {(request.user?.address || request.street_address) && (
                <div className="flex items-start space-x-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-muted-foreground">Address:</div>
                  <div>
                    {request.user?.address?.street || request.street_address && (
                      <div>{request.user?.address?.street || request.street_address}</div>
                    )}
                    {(request.user?.address?.city || request.city) && (
                      <div>
                        {request.user?.address?.city || request.city}
                        {request.user?.address?.state && `, ${request.user?.address?.state}`}
                        {request.user?.address?.zipCode && ` ${request.user?.address?.zipCode}`}
                      </div>
                    )}
                    {(request.user?.address?.country || request.country) && (
                      <div>{request.user?.address?.country || request.country}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Request Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Quantity</label>
                <p className="font-medium">{request.quantity || 1}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Budget</label>
                <p className="font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {request.budget?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Product</label>
              <p className="font-medium">{request.product_name || request.title || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Request Number</label>
              <p className="font-medium">{request.request_number || `REQ-${request.id.toString().padStart(6, '0')}`}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Priority</label>
              <p className="font-medium capitalize">{request.priority || 'Normal'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Description & Specifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <p className="mt-1">{request.description || 'No description provided'}</p>
              </div>
              
              {request.special_instructions && (
                <div>
                  <label className="text-sm text-muted-foreground">Special Instructions</label>
                  <p className="mt-1 p-3 bg-yellow-50 rounded-lg text-sm">{request.special_instructions}</p>
                </div>
              )}
              
              {((request.deliveryAddress && (request.deliveryAddress.street !== 'Address to be provided')) || request.delivery_street) && (
                <div>
                  <label className="text-sm text-muted-foreground">Delivery Address</label>
                  <p className="mt-1">
                    {request.deliveryAddress?.companyName && (
                      <span className="font-medium">{request.deliveryAddress.companyName}</span>
                    )}
                    <span>{request.deliveryAddress?.street || request.delivery_street}</span>
                    {request.deliveryAddress?.city && (
                      <span>, {request.deliveryAddress.city}</span>
                    )}
                    {request.deliveryAddress?.state && (
                      <span>, {request.deliveryAddress.state}</span>
                    )}
                    {request.deliveryAddress?.zipCode && (
                      <span> {request.deliveryAddress.zipCode}</span>
                    )}
                    {request.deliveryAddress?.country && (
                      <span>, {request.deliveryAddress.country}</span>
                    )}
                  </p>
                  {request.deliveryAddress?.phone && (
                    <p className="text-sm text-muted-foreground mt-1">Phone: {request.deliveryAddress.phone}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Created</span>
              </div>
              <span className="text-sm font-medium">
                {formatDateTime(String(request.created_at || ''))}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Last Updated</span>
              </div>
              <span className="text-sm font-medium">
                {formatDateTime(String(request.updated_at || ''))}
              </span>
            </div>
            
            {request.expected_delivery_date && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Expected Delivery</span>
                </div>
                <span className="text-sm font-medium">
                  {formatDateTime(String(request.expected_delivery_date || ''))}
                </span>
              </div>
            )}
            
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                {getTimeAgo(String(request.created_at || ''))}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Files & Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <File className="h-5 w-5" />
              <span>Files & Attachments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {request.files && request.files.length > 0 ? (
              <div className="space-y-3">
                {Array.isArray(request.files) && request.files.map((file: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.filename || file.name || `File ${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.size ? `${(file.size / 1024).toFixed(2)} KB` : ''}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files attached</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Actions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Admin Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Update */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Update Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleStatusUpdate}
                  className="w-full"
                  disabled={!isEditing && selectedStatus === request.status}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </div>
            </div>
            
            {/* Admin Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Admin Notes</label>
              <Textarea
                placeholder="Add internal notes about this request..."
                value={adminNotes}
                onChange={(e) => {
                  setAdminNotes(e.target.value);
                  setIsEditing(true);
                }}
                rows={4}
                className="text-sm sm:text-base"
              />
              {isEditing && (
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleStatusUpdate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notes
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestDetailPage;
