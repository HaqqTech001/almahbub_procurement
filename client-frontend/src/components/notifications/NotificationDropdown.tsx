import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { getRelativeTime } from '@/lib/dateUtils';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50 border-gray-200';
    
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-lg shadow-lg border z-50 max-h-[calc(100vh-8rem)] overflow-hidden sm:w-80 sm:max-h-96">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-[10px] sm:text-xs px-1 sm:px-2"
                  >
                    <CheckCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Mark all read</span>
                    <span className="sm:hidden">Read all</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-48 overflow-y-auto sm:max-h-64">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="h-6 w-6 mx-auto mb-2 text-gray-300 sm:h-8 sm:w-8" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-2 sm:p-4 hover:bg-gray-50 transition-colors',
                        getNotificationColor(notification.type, notification.read)
                      )}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <span className="text-base sm:text-lg">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={cn(
                              'text-xs sm:text-sm font-medium',
                              notification.read ? 'text-gray-600' : 'text-gray-900'
                            )}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-0.5 sm:space-x-1 ml-1 sm:ml-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-5 w-5 sm:h-6 sm:w-6"
                                >
                                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeNotification(notification.id)}
                                className="h-5 w-5 sm:h-6 sm:w-6"
                              >
                                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className={cn(
                            'text-xs mt-0.5 sm:text-sm sm:mt-1',
                            notification.read ? 'text-gray-500' : 'text-gray-700'
                          )}>
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-1 text-[10px] sm:text-xs text-gray-400">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            <span>{getRelativeTime(notification.created_at, 'Unknown')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 sm:p-3 border-t bg-gray-50">
                <Link 
                  to="/notifications" 
                  className="block text-center text-xs sm:text-sm text-slate-600 hover:text-slate-800"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;