import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Request {
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

const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [currentPage]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getRequests({ 
        page: currentPage,
        limit: 20 
      });
      
      if (response.success) {
        setRequests(response.data.requests);
        setFilteredRequests(response.data.requests);
        // Note: You'd typically get pagination info from the API
        setTotalPages(Math.ceil(response.data.requests.length / 20));
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request => {
        const title = String(request.title || '').toLowerCase();
        const firstName = String(request.first_name || '').toLowerCase();
        const lastName = String(request.last_name || '').toLowerCase();
        const email = String(request.email || '').toLowerCase();
        const company = String(request.company || '').toLowerCase();
        
        return title.includes(searchTerm.toLowerCase()) ||
               firstName.includes(searchTerm.toLowerCase()) ||
               lastName.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase()) ||
               company.includes(searchTerm.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    try {
      const response = await apiClient.updateRequest(requestId, { status: newStatus });
      if (response.success) {
        setRequests(prev => prev.map(request => 
          request.id === requestId ? { ...request, status: newStatus } : request
        ));
      }
    } catch (error) {
      console.error('Failed to update request status:', error);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        const response = await apiClient.deleteRequest(requestId);
        if (response.success) {
          setRequests(prev => prev.filter(request => request.id !== requestId));
        }
      } catch (error) {
        console.error('Failed to delete request:', error);
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
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Procurement Requests</h1>
          <p className="text-muted-foreground text-sm">
            Manage and track all client procurement requests
          </p>
        </div>
        <Button className="w-full sm:w-auto">
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
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-1 sm:flex-none min-w-[120px]"
              >
                <option value="all">All Statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Procurement Requests ({filteredRequests.length})</CardTitle>
          <CardDescription className="text-xs">
            A list of all client procurement requests in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(request.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-medium truncate">
                          #{request.id} - {String(request.title || 'N/A')}
                        </h4>
                        <Badge className={`${getStatusColor(String(request.status || 'unknown'))} text-xs`}>
                          {String(request.status || 'unknown')}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="truncate max-w-[120px]">
                          {String(request.first_name || 'N/A')} {String(request.last_name || 'N/A')}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate max-w-[150px]">{String(request.email || 'N/A')}</span>
                        {request.company && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate max-w-[120px]">{String(request.company || 'N/A')}</span>
                          </>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span>{getTimeAgo(String(request.created_at || ''))}</span>
                      </div>
                      
                      {request.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {String(request.description || 'No description')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:space-x-2 ml-auto sm:ml-0">
                    <select
                      value={String(request.status || 'received')}
                      onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-input bg-background rounded flex-1 sm:flex-none min-w-[100px]"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No requests match your search criteria' 
                  : 'No requests found'
                }
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2 order-1 sm:order-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
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

export default RequestsPage;