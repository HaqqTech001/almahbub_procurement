const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Get token from zustand auth store storage and sync to localStorage
const getAndSyncToken = (): string | null => {
  try {
    // First check direct admin_token
    const localToken = localStorage.getItem('admin_token');
    if (localToken) {
      return localToken;
    }
    
    // Check zustand persist format
    const authData = localStorage.getItem('almahbub-admin-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      const token = parsed.state?.token || parsed.token || null;
      
      // If found in zustand persist, sync to localStorage for future use
      if (token) {
        localStorage.setItem('admin_token', token);
        console.log('Synced token from zustand to localStorage');
      }
      
      return token;
    }
    
    return null;
  } catch (e) {
    console.error('Error getting token:', e);
    return null;
  }
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  }

  private getToken(): string | null {
    return getAndSyncToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get latest token
    const token = this.getToken();
    
    // Debug log
    console.log('API Request token status:', token ? 'present' : 'missing');
    console.log('Request URL:', url);
    console.log('Request method:', options.method || 'GET');
    
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
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      }
      return { success: true } as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<any>('/auth/admin/login', {
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

  // Orders
  async getOrders(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/orders${queryString}`);
  }

  async getMyOrders(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/orders${queryString}`);
  }

  async getOrder(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async updateOrder(id: string, data: any) {
    return this.request<any>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrder(id: string) {
    return this.request<any>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async getOrderStats() {
    return this.request<any>('/orders/admin/stats/overview');
  }

  // Users
  async getUsers(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/users${queryString}`);
  }

  async getUser(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories() {
    return this.request<any>('/categories');
  }

  async getCategory(id: string) {
    return this.request<any>(`/categories/${id}`);
  }

  async createCategory(data: any) {
    return this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: any) {
    return this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Products
  async getProducts(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/products${queryString}`);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== ANNOUNCEMENTS API ==========

  async getAnnouncements(params?: { page?: number; limit?: number; status?: string; type?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<any>(`/announcements${queryString}`);
  }

  async getAnnouncement(id: string) {
    return this.request<any>(`/announcements/${id}`);
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    summary?: string;
    type?: string;
    status?: string;
    priority?: string;
    target_audience?: string;
    scheduled_for?: string;
    expires_at?: string;
    pinned?: boolean;
    tags?: string[];
    media?: File[];
  }) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.summary) formData.append('summary', data.summary);
    if (data.type) formData.append('type', data.type);
    if (data.status) formData.append('status', data.status);
    if (data.priority) formData.append('priority', data.priority);
    if (data.target_audience) formData.append('target_audience', data.target_audience);
    if (data.scheduled_for) formData.append('scheduled_for', data.scheduled_for);
    if (data.expires_at) formData.append('expires_at', data.expires_at);
    if (data.pinned !== undefined) formData.append('pinned', data.pinned.toString());
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    
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

  async updateAnnouncement(id: string, data: {
    title?: string;
    content?: string;
    summary?: string;
    type?: string;
    status?: string;
    priority?: string;
    target_audience?: string;
    scheduled_for?: string;
    expires_at?: string;
    pinned?: boolean;
    tags?: string[];
    media?: File[];
    removeMedia?: string[];
  }) {
    const formData = new FormData();
    
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.summary) formData.append('summary', data.summary);
    if (data.type) formData.append('type', data.type);
    if (data.status) formData.append('status', data.status);
    if (data.priority) formData.append('priority', data.priority);
    if (data.target_audience) formData.append('target_audience', data.target_audience);
    if (data.scheduled_for) formData.append('scheduled_for', data.scheduled_for);
    if (data.expires_at) formData.append('expires_at', data.expires_at);
    if (data.pinned !== undefined) formData.append('pinned', data.pinned.toString());
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    
    if (data.removeMedia && data.removeMedia.length > 0) {
      data.removeMedia.forEach(mediaId => formData.append('removeMedia', mediaId));
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

  async deleteAnnouncement(id: string) {
    return this.request<any>(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  async publishAnnouncement(id: string) {
    return this.request<any>(`/announcements/${id}/publish`, {
      method: 'POST',
    });
  }

  async unpublishAnnouncement(id: string) {
    return this.request<any>(`/announcements/${id}/unpublish`, {
      method: 'POST',
    });
  }

  // ========== CHAT API ==========

  async getChatConversations(params?: { status?: string; priority?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<any>(`/chat/conversations${queryString}`);
  }

  async getChatMessages(conversationId: string, params?: { limit?: number; before?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.before) queryParams.append('before', params.before);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<any>(`/chat/conversation/${conversationId}${queryString}`);
  }

  async sendChatMessage(conversationId: string, content: string, attachments?: File[]) {
    const formData = new FormData();
    formData.append('message', content);
    formData.append('receiverId', conversationId);
    
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

  async markChatAsRead(conversationId: string) {
    return this.request<any>(`/chat/markread/${conversationId}`, {
      method: 'PUT',
    });
  }

  async closeConversation(conversationId: string) {
    return this.request<any>(`/chat/conversations/${conversationId}/close`, {
      method: 'POST',
    });
  }

  async assignConversation(conversationId: string, adminId: string) {
    return this.request<any>(`/chat/conversations/${conversationId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ adminId }),
    });
  }

  async getUnreadChatCount() {
    return this.request<any>('/chat/unread/count');
  }

  // ========== CHATBOT SETTINGS API ==========

  async getChatbotSettings() {
    return this.request<any>('/admin/chatbot-settings');
  }

  async updateChatbotSettings(settings: {
    enabled?: boolean;
    autoReplyEnabled?: boolean;
    welcomeMessage?: string;
    autoReplyMessage?: string;
    keywords?: string[];
    responseDelay?: number;
    businessHours?: { start: string; end: string };
    responseTemplate?: string;
  }) {
    return this.request<any>('/admin/chatbot-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getChatbotStats() {
    return this.request<any>('/admin/chatbot/stats');
  }

  // Trackers
  async getTrackers() {
    return this.request<any>('/tracker');
  }

  async getOrderTrackers(orderId: string) {
    return this.request<any>(`/tracker/order/${orderId}`);
  }

  async createTracker(data: any) {
    return this.request<any>('/tracker', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTracker(id: string, data: any) {
    return this.request<any>(`/tracker/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTracker(id: string) {
    return this.request<any>(`/tracker/${id}`, {
      method: 'DELETE',
    });
  }

  // AI Assistant
  async getAIKnowledge(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/ai/knowledge${queryString}`);
  }

  async createAIKnowledge(data: any) {
    return this.request<any>('/ai/knowledge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAIKnowledge(id: string, data: any) {
    return this.request<any>(`/ai/knowledge/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAIStats() {
    return this.request<any>('/ai/stats');
  }

  async learnFromResponse(data: any) {
    return this.request<any>('/ai/learn', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // File upload
  async uploadFile(file: File, endpoint: string = '/upload') {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<any>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
