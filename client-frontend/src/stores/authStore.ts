import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api';

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
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  updatePassword: (data: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
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
            // Check if user email is verified
            if (!response.data.user.emailVerified) {
              const verificationError = new Error('Email verification required');
              (verificationError as any).needsVerification = true;
              throw verificationError;
            }
            
            // Set token in both state and API client
            apiClient.setToken(response.data.token);
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          
          // Re-throw the error so it can be handled by the UI
          throw error;
        }
      },

      register: async (userData: any) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.register(userData);
          
          if (response.success) {
            // Don't auto-login after registration - user must verify email first
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            
            // Clear the API token since user isn't verified yet
            apiClient.logout();
            
            return {
              success: true,
              message: response.message,
              needsVerification: true
            };
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        apiClient.logout();
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
          const { token } = get();
          if (token) {
            apiClient.setToken(token);
            const response = await apiClient.getCurrentUser();
            
            if (response.success) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Token is invalid
              apiClient.logout();
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else {
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

      updateProfile: async (data: any) => {
        try {
          const response = await apiClient.updateProfile(data);
          if (response.success) {
            set({
              user: { ...get().user, ...response.data.user },
            });
          } else {
            throw new Error(response.message || 'Profile update failed');
          }
        } catch (error) {
          throw error;
        }
      },

      updatePassword: async (data: any) => {
        try {
          const response = await apiClient.updatePassword(data);
          if (!response.success) {
            throw new Error(response.message || 'Password update failed');
          }
        } catch (error) {
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        try {
          const response = await apiClient.forgotPassword(email);
          if (!response.success) {
            throw new Error(response.message || 'Failed to send reset email');
          }
        } catch (error) {
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        try {
          const response = await apiClient.resetPassword(token, password);
          if (!response.success) {
            throw new Error(response.message || 'Password reset failed');
          }
        } catch (error) {
          throw error;
        }
      },

      verifyEmail: async (token: string) => {
        try {
          const response = await apiClient.verifyEmail(token);
          if (response.success) {
            set({
              user: { ...get().user, ...response.data.user },
            });
          } else {
            throw new Error(response.message || 'Email verification failed');
          }
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'almahbub-client-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);