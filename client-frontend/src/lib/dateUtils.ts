/**
 * Date and Time Utility Functions
 * Provides consistent date formatting and display across the application
 */

/**
 * Safely parse a date string into a Date object
 * Handles various date formats and invalid inputs
 */
export const parseDate = (dateString: string | Date | null | undefined): Date | null => {
  if (!dateString || dateString === 'null' || dateString === 'undefined' || dateString === '') {
    return null;
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
};

/**
 * Check if a date is valid
 */
export const isValidDate = (dateString: string | Date | null | undefined): boolean => {
  return parseDate(dateString) !== null;
};

/**
 * Format a date to a readable string with time
 * Format: "January 15, 2024 at 2:30 PM"
 */
export const formatDateTime = (dateString: string | Date | null | undefined, defaultText: string = 'N/A'): string => {
  const date = parseDate(dateString);
  if (!date) return defaultText;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a date to a readable string without time
 * Format: "January 15, 2024"
 */
export const formatDate = (dateString: string | Date | null | undefined, defaultText: string = 'N/A'): string => {
  const date = parseDate(dateString);
  if (!date) return defaultText;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format a date to a short string
 * Format: "Jan 15, 2024"
 */
export const formatDateShort = (dateString: string | Date | null | undefined, defaultText: string = 'N/A'): string => {
  const date = parseDate(dateString);
  if (!date) return defaultText;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string | Date | null | undefined): string => {
  const date = parseDate(dateString);
  if (!date) return '';
  
  return date.toISOString().split('T')[0];
};

/**
 * Get relative time string (e.g., "2 hours ago", "Just now", "3 days ago")
 */
export const getRelativeTime = (dateString: string | Date | null | undefined, defaultText: string = 'Unknown'): string => {
  const date = parseDate(dateString);
  if (!date) return defaultText;
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Future dates
  if (diffInSeconds < 0) {
    return formatDateTime(dateString, defaultText);
  }
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  // Less than 1 hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  // Less than 24 hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  // Less than 7 days
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  // Less than 30 days
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  // Less than 12 months
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  
  // More than a year
  const diffInYears = Math.floor(diffInDays / 365);
  if (diffInYears < 5) {
    return `${diffInYears}y ago`;
  }
  
  // Very old date, show formatted date
  return formatDateShort(dateString, defaultText);
};

/**
 * Get relative time for dates within the last hour (for chat messages)
 * Shows "Just now" for very recent, then seconds/minutes
 */
export const getChatTime = (dateString: string | Date | null | undefined, defaultText: string = 'Unknown'): string => {
  const date = parseDate(dateString);
  if (!date) return defaultText;
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 0) {
    // Future date - show time only
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format duration in milliseconds to human readable string
 * e.g., "2 hours", "3 days", "1 week"
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
};

/**
 * Get status color class based on request status
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status?.toLowerCase() || '';
  
  switch (statusLower) {
    case 'received':
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'reviewing':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_discussion':
    case 'discussion':
      return 'bg-orange-100 text-orange-800';
    case 'sourcing':
    case 'processing':
      return 'bg-purple-100 text-purple-800';
    case 'approved':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get priority color class
 */
export const getPriorityColor = (priority: string): string => {
  const priorityLower = priority?.toLowerCase() || '';
  
  switch (priorityLower) {
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

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
