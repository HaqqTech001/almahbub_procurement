import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSocketContext } from '@/contexts/SocketContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Grid3X3,
  Megaphone,
  MessageCircle,
  Settings,
  BarChart3,
  Bot,
  LogOut,
  Menu,
  X,
  Bell,
  BellRing,
} from 'lucide-react';

// Layout component that doesn't need children prop since we're using nested routes
// Just returns the layout structure with Outlet for nested content

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Procurement Requests',
    href: '/requests',
    icon: ShoppingCart,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Categories',
    href: '/categories',
    icon: Grid3X3,
  },
  {
    title: 'Product Catalog',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Announcements',
    href: '/announcements',
    icon: Megaphone,
  },
  {
    title: 'Client Chat',
    href: '/chat',
    icon: MessageCircle,
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: BellRing,
  },
  {
    title: 'Order Tracking',
    href: '/trackers',
    icon: BarChart3,
  },
  {
    title: 'AI Assistant',
    href: '/ai-assistant',
    icon: Bot,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, fetchUnreadCount } = useChatStore();
  const { isConnected } = useSocketContext();
  const { notifications, unreadCount: notificationCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-100 border-r border-gray-300 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6 border-b border-gray-300">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs md:text-sm">A</span>
              </div>
              <div>
                <h1 className="text-sm md:text-lg font-bold text-teal-600">Almahbub</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Admin Panel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 md:px-4 py-3 md:py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <item.icon className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">{item.title}</span>
                    <span className="sm:hidden">{item.title.split(' ')[0]}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="default" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {item.href === '/chat' && unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs hidden sm:flex">
                      {unreadCount}
                    </Badge>
                  )}
                  {item.href === '/notifications' && notificationCount > 0 && (
                    <Badge variant="destructive" className="text-xs hidden sm:flex">
                      {notificationCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-300 p-3 md:p-4">
            <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
              <Avatar className="h-8 w-8 md:h-10 md:w-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-teal-600 text-white text-xs md:text-sm">
                  {(() => {
                    const firstChar = user?.firstName?.[0] || '';
                    const lastChar = user?.lastName?.[0] || '';
                    const initials = (firstChar + lastChar).toUpperCase();
                    // Only show if it's a letter A-Z
                    return /^[A-Z]$/.test(initials) ? initials : '';
                  })()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 truncate hidden sm:block">
                  {user?.email}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs md:text-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b border-gray-300 bg-white px-3 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            {/* Breadcrumb or page title could go here */}
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-8 w-8 md:h-9 md:w-9"
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 bg-red-500 text-white text-[10px] md:text-xs rounded-full flex items-center justify-center min-w-[16px] md:min-w-[20px]">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Button>
              
              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-lg border z-50">
                  <div className="flex items-center justify-between p-3 md:p-4 border-b">
                    <h3 className="font-semibold text-sm md:text-base">Notifications</h3>
                    {notificationCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                        Mark all
                      </Button>
                    )}
                  </div>
                  <div className="max-h-64 md:max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-3 md:p-4 border-b hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.resource_type && notification.resource_id) {
                              navigate(`/${notification.resource_type}/${notification.resource_id}`);
                            }
                            setNotificationOpen(false);
                          }}
                        >
                          <div className="flex items-start space-x-2 md:space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 md:mt-2 ${!notification.is_read ? 'bg-blue-500' : 'bg-gray-300'} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{notification.title}</p>
                              <p className="text-xs text-gray-600 truncate">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <Avatar className="h-7 w-7 md:h-8 md:w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-teal-600 text-white text-xs">
                {(() => {
                  const firstChar = user?.firstName?.[0] || '';
                  const lastChar = user?.lastName?.[0] || '';
                  const initials = (firstChar + lastChar).toUpperCase();
                  // Only show if it's a letter A-Z
                  return /^[A-Z]$/.test(initials) ? initials : '';
                })()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 md:p-6 bg-gray-50 overflow-y-auto overflow-x-hidden">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;