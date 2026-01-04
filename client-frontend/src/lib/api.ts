const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://almahbub-procurement.onrender.com/api/v1';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://almahbub-procurement.onrender.com';

// User-friendly error message mapping
const getUserFriendlyErrorMessage = (status: number, errorKey?: string, defaultMessage?: string): string => {
  const errorMessages: Record<number, string> = {
    400: defaultMessage || 'The information you provided is not valid. Please check and try again.',
    401: 'Your session has expired. Please log in again to continue.',
    403: 'You do not have permission to perform this action. Please contact support if you think this is an error.',
    404: 'The item you are looking for could not be found. It may have been removed or the link is incorrect.',
    409: 'This information already exists. Please try a different one.',
    422: 'The information you provided is incomplete or invalid. Please check all required fields.',
    429: 'You have made too many requests. Please wait a moment and try again.',
    500: 'Something went wrong on our server. Please try again later or contact support.',
    503: 'Our service is temporarily unavailable. Please try again later.',
  };

  // Specific error key mappings for more detailed messages
  const specificErrorMessages: Record<string, string> = {
    'Invalid verification token': 'This verification link is invalid or has expired. Please request a new verification email.',
    'Email already verified': 'Your email has already been verified. You can log in to your account.',
    'Invalid login credentials': 'The email or password you entered is incorrect. Please try again.',
    'Account not verified': 'Please verify your email address before logging in. Check your email for the verification link.',
    'Email verification required': 'You need to verify your email before you can log in. Please check your email for the verification link.',
    'Token expired': 'Your session has expired. Please log in again.',
    'Invalid token': 'Your session is invalid. Please log in again.',
    'User not found': 'No account exists with this email address. Please register first.',
    'Email already exists': 'An account with this email already exists. Please log in or use a different email.',
    'Password too short': 'Your password must be at least 6 characters long.',
    'Incorrect password': 'The password you entered is incorrect. Please try again.',
    'Same password': 'Your new password must be different from your current password.',
  };

  // Check for specific error message first
  if (defaultMessage) {
    for (const [key, message] of Object.entries(specificErrorMessages)) {
      if (defaultMessage.toLowerCase().includes(key.toLowerCase()) || 
          (errorKey && errorKey.toLowerCase().includes(key.toLowerCase()))) {
        return message;
      }
    }
  }

  // Return status-based message
  if (errorMessages[status]) {
    return errorMessages[status];
  }

  // Default fallback
  return defaultMessage || 'An unexpected error occurred. Please try again.';
};

// Helper function to get the token - always reads fresh from localStorage
const getStoredToken = (): string | null => {
  // First try the direct client_token (set by setToken method)
  const directToken = localStorage.getItem('client_token');
  if (directToken) return directToken;
  
  // Try zustand persist format
  const zustandData = localStorage.getItem('almahbub-client-auth');
  if (zustandData) {
    try {
      const parsed = JSON.parse(zustandData);
      const token = parsed.state?.token || parsed.token;
      if (token) return token;
    } catch (e) {
      console.error('Error parsing auth token:', e);
    }
  }
  
  return null;
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('client_token', token);
    } else {
      localStorage.removeItem('client_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Always get fresh token from localStorage
    const token = getStoredToken();
    
    // For FormData requests, don't set Content-Type header
    const defaultHeaders: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    const config: RequestInit = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '' }));
        
        // Special handling for email verification errors
        if (response.status === 403 && errorData.error === 'Email verification required') {
          const verificationError = new Error('You need to verify your email address before logging in. Please check your email for the verification link.');
          (verificationError as any).needsVerification = true;
          (verificationError as any).status = response.status;
          throw verificationError;
        }
        
        // Special handling for invalid verification token
        if (response.status === 400 && errorData.error?.includes('verification token')) {
          throw new Error('This verification link is invalid or has already been used. Please request a new verification email.');
        }
        
        // Special handling for already verified email
        if (response.status === 400 && errorData.error?.includes('already verified')) {
          throw new Error('Your email has already been verified. You can now log in to your account.');
        }
        
        // Convert to user-friendly message
        const userFriendlyMessage = getUserFriendlyErrorMessage(
          response.status,
          errorData.error,
          errorData.message
        );
        
        throw new Error(userFriendlyMessage);
      }

      // Handle responses that might not be JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return { success: true } as T;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth methods
  async register(userData: any) {
    const response = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.success) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // Generic GET method for flexibility
  async get(endpoint: string) {
    return this.request<any>(endpoint);
  }

  async updateProfile(data: any) {
    return this.request<any>('/auth/updatedetails', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(data: any) {
    return this.request<any>('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string) {
    return this.request<any>('/auth/forgotpassword', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request<any>(`/auth/resetpassword/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async verifyEmail(token: string) {
    return this.request<any>(`/auth/verify-email/${token}`, {
      method: 'POST',
    });
  }

  // Categories
  async getCategories() {
    return this.request<any>('/categories');
  }

  async getCategory(id: string) {
    return this.request<any>(`/categories/${id}`);
  }

  async getCategoryBySlug(slug: string) {
    return this.request<any>(`/categories/slug/${slug}`);
  }

  async getSubcategories(parentId: string) {
    return this.request<any>(`/categories/parent/${parentId}`);
  }

  // Products
  async getProducts(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/products${queryString}`);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  // Orders
  async createOrder(orderData: any) {
    const formData = new FormData();
    
    Object.keys(orderData).forEach(key => {
      if (key === 'files' && orderData[key]) {
        orderData[key].forEach((file: File) => {
          formData.append('files', file);
        });
      } else if (orderData[key] !== undefined && orderData[key] !== null) {
        formData.append(key, orderData[key]);
      }
    });

    return this.request<any>('/orders', {
      method: 'POST',
      body: formData,
    });
  }

  async getMyOrders(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/requests${queryString}`);
  }

  async getOrder(id: string) {
    return this.request<any>(`/requests/${id}`);
  }

  async getOrderTracking(orderId: string) {
    return this.request<any>(`/requests/tracker/${orderId}`);
  }

  // ========== CHAT API METHODS ==========

  // Get chat conversations (for admin)
  async getChatConversations() {
    return this.request<any>('/chat/conversations');
  }

  // Get messages for a conversation
  async getChatMessages(userId: string, params?: { limit?: number; before?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.before) queryParams.append('before', params.before);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<any>(`/chat/conversation/${userId}${queryString}`);
  }

  // Send a chat message
  async sendChatMessage(receiverId: string, content: string, attachments?: File[]) {
    const formData = new FormData();
    formData.append('message', content);
    formData.append('receiverId', receiverId);
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        formData.append('file', file);
      });
    }

    return this.request<any>('/chat/send', {
      method: 'POST',
      body: formData,
    });
  }

  // Get or create a chat room
  async getOrCreateChatRoom(userId: string) {
    return this.request<any>(`/chat/conversation/${userId}`, {
      method: 'GET',
    });
  }

  // Mark messages as read
  async markChatMessagesAsRead(userId: string) {
    return this.request<any>(`/chat/markread/${userId}`, {
      method: 'PUT',
    });
  }

  // Get unread message count
  async getUnreadMessageCount() {
    return this.request<any>('/chat/unread/count');
  }

  // Delete a message
  async deleteChatMessage(messageId: string) {
    return this.request<any>(`/chat/message/${messageId}`, {
      method: 'DELETE',
    });
  }

  // ========== CHATBOT SETTINGS API (Admin) ==========

  // Get chatbot settings
  async getChatbotSettings() {
    return this.request<any>('/admin/chatbot-settings');
  }

  // Update chatbot settings
  async updateChatbotSettings(settings: {
    enabled: boolean;
    autoReplyEnabled: boolean;
    welcomeMessage?: string;
    autoReplyMessage?: string;
    keywords?: string[];
    responseDelay?: number;
  }) {
    return this.request<any>('/admin/chatbot-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ========== LEGACY CHAT METHODS (kept for backward compatibility) ==========
  async getConversations() {
    return this.request<any>('/chat/conversations');
  }

  async getConversation(userId: string, params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/chat/conversation/${userId}${queryString}`);
  }

  async sendMessage(data: any) {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'file' && data[key]) {
        formData.append(key, data[key]);
      } else if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    return this.request<any>('/chat/send', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  async markAsRead(userId: string) {
    return this.request<any>(`/chat/markread/${userId}`, {
      method: 'PUT',
    });
  }

  async getUnreadCount() {
    return this.request<any>('/chat/unread/count');
  }

  // ========== CLIENT SUPPORT CHAT METHODS ==========

  // Get support conversation (for clients to chat with admin)
  async getSupportConversation() {
    return this.request<any>('/chat/support');
  }

  // Get messages with support/admin
  async getSupportMessages(params?: { limit?: number; before?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.before) queryParams.append('before', params.before);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<any>(`/chat/support/messages${queryString}`);
  }

  // Send message to support/admin
  async sendSupportMessage(message: string, attachments?: File[], orderId?: string) {
    const formData = new FormData();
    formData.append('message', message);
    if (orderId) formData.append('orderId', orderId);
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        formData.append('file', file);
      });
    }

    return this.request<any>('/chat/support/send', {
      method: 'POST',
      body: formData,
    });
  }

  // ========== ANNOUNCEMENTS API ==========

  // Get all announcements
  async getAnnouncements(params?: { page?: number; limit?: number; category?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<any>(`/announcements${queryString}`);
  }

  // Get single announcement
  async getAnnouncement(id: string | number) {
    return this.request<any>(`/announcements/${id}`);
  }

  // Create announcement with media
  async createAnnouncement(data: {
    title: string;
    content: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    isActive?: boolean;
    media?: File[];
  }) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.category) formData.append('category', data.category);
    if (data.priority) formData.append('priority', data.priority);
    if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
    
    if (data.media && data.media.length > 0) {
      data.media.forEach(file => {
        formData.append('media', file);
      });
    }

    return this.request<any>('/announcements', {
      method: 'POST',
      body: formData,
    });
  }

  // Update announcement
  async updateAnnouncement(id: string | number, data: {
    title?: string;
    content?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    isActive?: boolean;
    media?: File[];
    removeMedia?: string[];
  }) {
    const formData = new FormData();
    
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.category) formData.append('category', data.category);
    if (data.priority) formData.append('priority', data.priority);
    if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
    if (data.removeMedia && data.removeMedia.length > 0) {
      data.removeMedia.forEach(id => formData.append('removeMedia[]', id));
    }
    
    if (data.media && data.media.length > 0) {
      data.media.forEach(file => {
        formData.append('media', file);
      });
    }

    return this.request<any>(`/announcements/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  // Delete announcement
  async deleteAnnouncement(id: string | number) {
    return this.request<any>(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // Get announcement replies
  async getAnnouncementReplies(announcementId: string | number) {
    return this.request<any>(`/announcements/${announcementId}/replies`);
  }

  // Post announcement reply
  async postAnnouncementReply(announcementId: string | number, data: FormData) {
    return this.request<any>(`/announcements/${announcementId}/replies`, {
      method: 'POST',
      body: data,
    });
  }

  // Announcement Reactions
  async toggleAnnouncementReaction(announcementId: string | number, reactionType: string = 'like') {
    return this.request<any>(`/announcements/${announcementId}/react`, {
      method: 'POST',
      body: JSON.stringify({ type: reactionType }),
    });
  }

  async getAnnouncementReactions(announcementId: string | number) {
    return this.request<any>(`/announcements/${announcementId}/reactions`);
  }

  // FAQ
  async getFAQs() {
    return this.request<any>('/faqs');
  }

  // ========== NOTIFICATIONS API ==========

  // Get notifications
  async getNotifications(params?: { page?: number; limit?: number; type?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<any>(`/auth/notifications${queryString}`);
  }

  // Mark notification as read
  async markNotificationAsRead(id: string | number) {
    return this.request<any>(`/auth/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    return this.request<any>('/auth/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Get unread notification count
  async getUnreadNotificationCount() {
    return this.request<any>('/auth/notifications/unread/count');
  }

  // Delete notification
  async deleteNotification(id: string | number) {
    return this.request<any>(`/auth/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // File upload
  async uploadFile(file: File, endpoint: string = '/upload') {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<any>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  // AI Assistant
  async getAIResponse(message: string, orderId?: string, context?: any) {
    return this.request<any>('/ai/auto-respond', {
      method: 'POST',
      body: JSON.stringify({
        message,
        orderId,
        context,
      }),
    });
  }

  // ========== ADMIN USERS API ==========
  
  async getAdminUsers() {
    return this.request<any>('/admin/users');
  }

  async getUserById(id: string) {
    return this.request<any>(`/admin/users/${id}`);
  }

  async updateUserRole(id: string, role: string) {
    return this.request<any>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Generate correct file URL for uploaded files
  getFileUrl(filePath: string): string {
    if (!filePath) return '';
    
    // If filePath already contains full URL, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Construct full URL to backend
    return `${BASE_URL}/${cleanPath}`;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
