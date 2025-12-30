import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api';

// Immediate token sync at module load time
// This ensures the token is available in localStorage as early as possible
const syncTokenToLocalStorage = () => {
  try {
    const authData = localStorage.getItem('almahbub-admin-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      const token = parsed.state?.token || parsed.token || null;
      if (token && token !== localStorage.getItem('admin_token')) {
        localStorage.setItem('admin_token', token);
        console.log('Early token sync: token synced from zustand to localStorage');
      }
    }
  } catch (e) {
    console.error('Early token sync failed:', e);
  }
};

// Run immediate sync
syncTokenToLocalStorage();

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  company?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.login(email, password);
          
          if (response.success) {
            const token = response.data.token;
            
            // Save token to both localStorage and zustand persist for compatibility
            localStorage.setItem('admin_token', token);
            apiClient.setToken(token);
            
            set({
              user: response.data.user,
              token: token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        apiClient.logout();
        localStorage.removeItem('admin_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initialize: async () => {
        try {
          // Double-check and sync token to localStorage
          let token = localStorage.getItem('admin_token');
          
          // If not in localStorage, try zustand persist
          if (!token) {
            const authData = localStorage.getItem('almahbub-admin-auth');
            if (authData) {
              try {
                const parsed = JSON.parse(authData);
                token = parsed.state?.token || parsed.token || null;
                if (token) {
                  localStorage.setItem('admin_token', token);
                  console.log('Initialize: token synced from zustand to localStorage');
                }
              } catch (e) {
                token = null;
              }
            }
          }
          
          console.log('Initialize: token status', token ? 'found' : 'not found');
          
          if (token) {
            apiClient.setToken(token);
            const response = await apiClient.getCurrentUser();
            
            if (response.success) {
              // Ensure token is in localStorage
              localStorage.setItem('admin_token', token);
              
              set({
                user: response.data.user,
                token: token,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Token is invalid - clear everything
              apiClient.logout();
              localStorage.removeItem('admin_token');
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else {
            console.log('Initialize: no token found, setting isLoading to false');
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          apiClient.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'almahbub-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
