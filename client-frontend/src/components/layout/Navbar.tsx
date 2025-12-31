import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChatStore } from '@/stores/chatStore';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { 
  Menu, 
  X, 
  Home, 
  Grid3X3, 
  ShoppingCart, 
  User, 
  MessageCircle, 
  LogOut,
  Bell,
  Search,
  BellRing
} from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { unreadCount, fetchUnreadCount } = useChatStore();

  // Fetch unread count on mount and periodically (only when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // Refresh every 60 seconds to avoid rate limiting
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Services', href: '/services', icon: Grid3X3 },
    ...(isAuthenticated ? [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'My Requests', href: '/my-requests', icon: ShoppingCart },
      // { name: 'Chat', href: '/client-chat', icon: MessageCircle },
      { name: 'Profile', href: '/profile', icon: User },
    ] : []),
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0e7490] to-[#164e63] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0e7490]">Almahbub</h1>
              <p className="text-xs text-gray-500">International</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                  item.name === 'Chat'
                    ? 'text-[#0e7490] hover:text-[#0e7490]'
                    : 'text-gray-700 hover:text-[#0e7490]'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
                {item.name === 'Chat' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationDropdown />
                
                {/* Chat Link with Badge */}
                <div className="relative">
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link to="/client-chat">
                      <MessageCircle className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-[#0e7490] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(() => {
                          const firstChar = user?.firstName?.[0] || '';
                          const lastChar = user?.lastName?.[0] || '';
                          const initials = (firstChar + lastChar).toUpperCase();
                          // Only show if it's a letter, not a number or special character
                          return /^[A-Z]$/.test(initials) ? initials : '';
                        })()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.firstName || 'User'}
                    </span>
                  </Button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Home className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                      <Link
                        to="/my-requests"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-3" />
                        My Requests
                      </Link>
                      <Link
                        to="/client-chat"
                        className="flex items-center px-4 py-2.5 text-sm text-[#0e7490] hover:bg-gray-50 transition-colors font-medium"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <MessageCircle className="h-4 w-4 mr-3" />
                        Chat
                        {unreadCount > 0 && (
                          <span className="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/notifications"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <BellRing className="h-4 w-4 mr-3" />
                        Notifications
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" asChild className="text-gray-700 hover:text-[#0e7490]">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild className="bg-[#0e7490] hover:bg-[#155e75] text-white">
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Mobile Notification and Chat Icons */}
            {isAuthenticated && (
              <div className="flex items-center justify-center space-x-4 mb-4 px-3">
                <NotificationDropdown />
                <Link 
                  to="/client-chat" 
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageCircle className="h-6 w-6 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </div>
            )}
            
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    item.name === 'Chat'
                      ? 'bg-[#0e7490]/10 text-[#0e7490] font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.name === 'Chat' && unreadCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              ))}
              
              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button className="w-full bg-[#0e7490] hover:bg-[#155e75]" asChild>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}

              {isAuthenticated && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="w-10 h-10 bg-[#0e7490] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {(() => {
                          const firstChar = user?.firstName?.[0] || '';
                          const lastChar = user?.lastName?.[0] || '';
                          const initials = (firstChar + lastChar).toUpperCase();
                          // Only show if it's a letter, not a number or special character
                          return /^[A-Z]$/.test(initials) ? initials : '';
                        })()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user?.firstName || 'User'} {user?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign out
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;