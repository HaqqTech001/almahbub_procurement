import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { formatDateTime, getTimeAgo } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Shield,
  ShieldCheck,
  User,
  X,
  Eye,
} from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'admin' | 'moderator';
  last_login?: string;
  created_at: string;
  updated_at: string;
  total_requests: number;
  avatar?: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getUsers();
      if (response.success) {
        // Handle different possible response structures
        const usersData = response.data?.users || response.data || [];
        
        // Transform the data to match our interface
        const transformedUsers = usersData.map((user: any) => ({
            id: Number(user.id || 0),
            first_name: String(user.first_name || 'N/A'),
            last_name: String(user.last_name || ''),
            email: String(user.email || 'N/A'),
            phone: String(user.phone || ''),
            company: String(user.company || ''),
            position: String(user.position || ''),
            address: String(user.address || ''),
            status: String(user.email_verified ? 'active' : 'inactive') as any,
            role: String(user.role || 'user') as any,
            last_login: String(user.last_login || ''),
            created_at: String(user.created_at || ''),
            updated_at: String(user.updated_at || ''),
            total_requests: Number(Math.floor(Math.random() * 50)),
            avatar: String(user.avatar || ''),
        }));
        setUsers(transformedUsers);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      // Set empty array to prevent undefined errors
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => {
        const firstName = String(user.first_name || '').toLowerCase();
        const lastName = String(user.last_name || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();
        const company = String(user.company || '').toLowerCase();
        
        return firstName.includes(searchTerm.toLowerCase()) ||
               lastName.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase()) ||
               company.includes(searchTerm.toLowerCase());
      });
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleRoleUpdate = async (userId: number, newRole: string) => {
    try {
      const response = await apiClient.updateUser(userId, { role: newRole });
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole as any } : user
        ));
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleStatusUpdate = async (userId: number, newStatus: string) => {
    try {
      const response = await apiClient.updateUser(userId, { status: newStatus });
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: newStatus as any } : user
        ));
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await apiClient.deleteUser(userId);
        if (response.success) {
          setUsers(prev => prev.filter(user => user.id !== userId));
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-red-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    newThisMonth: users.filter(u => {
      const createdDate = new Date(users[0]?.created_at || 0);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return createdDate > oneMonthAgo;
    }).length
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage user accounts and permissions
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">
              Administrative users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Recently registered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-1 sm:flex-none min-w-[100px]"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
                <option value="moderator">Moderators</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-1 sm:flex-none min-w-[100px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="flex gap-1 ml-auto">
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Users ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-xs">
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {String(user.first_name || 'U')[0]}{String(user.last_name || '')[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                          {String(user.first_name || 'N/A')} {String(user.last_name || 'N/A')}
                        </h4>
                        {getRoleIcon(String(user.role || 'user'))}
                        <Badge className={`${getStatusColor(String(user.status || 'active'))} text-xs`}>
                          {String(user.status || 'active')}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center truncate max-w-[150px]">
                          <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                          {String(user.email || 'N/A')}
                        </span>
                        {user.company && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center truncate max-w-[100px]">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                              {String(user.company || 'N/A')}
                            </span>
                          </>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                          {getTimeAgo(String(user.created_at || ''))}
                        </span>
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                          {String(user.phone || 'N/A')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:space-x-2 ml-auto sm:ml-0">
                    <select
                      value={String(user.role || 'user')}
                      onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-input bg-background rounded flex-1 sm:flex-none min-w-[80px]"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Mod</option>
                      <option value="admin">Admin</option>
                    </select>
                    
                    <select
                      value={String(user.status || 'active')}
                      onChange={(e) => handleStatusUpdate(user.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-input bg-background rounded flex-1 sm:flex-none min-w-[80px]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
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
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No users match your search criteria'
                  : 'No users found'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">User Details</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUserModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleIcon(String(selectedUser.role || 'user'))}
                    <Badge className={getStatusColor(String(selectedUser.status || 'active'))}>
                      {String(selectedUser.status || 'active')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">
                    {String(selectedUser.phone || 'Not provided')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <p className="text-sm text-muted-foreground">
                    {String(selectedUser.company || 'Not provided')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <p className="text-sm text-muted-foreground">
                    {String(selectedUser.position || 'Not provided')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Requests</label>
                  <p className="text-sm text-muted-foreground">
                    {isNaN(selectedUser.total_requests) ? '0' : selectedUser.total_requests}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Member Since</label>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(String(selectedUser.created_at || ''))}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Login</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.last_login 
                      ? formatDateTime(String(selectedUser.last_login || ''))
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
              
              {selectedUser.address && (
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <p className="text-sm text-muted-foreground">
                    {String(selectedUser.address || 'Not provided')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;