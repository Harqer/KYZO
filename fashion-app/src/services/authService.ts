/**
 * Authentication Service - Backend Integration
 * Handles user authentication, session management, and auth state
 */

import * as SecureStore from 'expo-secure-store';
import { apiService, ApiResponse, AuthResponse } from './api';
import { webhookService } from './webhookService';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  phone?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,
  };
  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    this.initializeFromStorage();
    this.setupWebhookListeners();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth state from secure storage
   */
  private async initializeFromStorage(): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('auth_user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.updateAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error);
    }
  }

  /**
   * Setup webhook listeners for auth events
   */
  private setupWebhookListeners(): void {
    const handleAuthUpdate = (data: any) => {
      console.log('Auth webhook update:', data);
      if (data.type === 'user_updated' && this.authState.user) {
        // Update user data if it matches current user
        if (data.user_id === this.authState.user.id) {
          this.updateAuthState({
            ...this.authState,
            user: { ...this.authState.user, ...data.updates },
          });
        }
      }
    };

    webhookService.registerEventHandler('auth_update', handleAuthUpdate);
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.authState);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Update auth state and notify listeners
   */
  private updateAuthState(newState: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...newState };
    this.listeners.forEach(listener => listener(this.authState));
  }

  /**
   * Save auth data to secure storage
   */
  private async saveAuthData(token: string, user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save auth data:', error);
      throw error;
    }
  }

  /**
   * Clear auth data from secure storage
   */
  private async clearAuthData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
      await SecureStore.deleteItemAsync('auth_provider');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<void> {
    this.updateAuthState({ loading: true, error: null });
    
    try {
      const response = await apiService.makeRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data) {
        const { token, user } = response.data;
        await this.saveAuthData(token, user);
        
        this.updateAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
        });

        // Subscribe to user-specific webhooks
        await webhookService.subscribeToEvents(['user_updated', 'order_status', 'cart_update']);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.updateAuthState({
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<void> {
    this.updateAuthState({ loading: true, error: null });
    
    try {
      const response = await apiService.makeRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success && response.data) {
        const { token, user } = response.data;
        await this.saveAuthData(token, user);
        
        this.updateAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
        });

        // Subscribe to user-specific webhooks
        await webhookService.subscribeToEvents(['user_updated', 'order_status', 'cart_update']);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.updateAuthState({
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Login with OAuth provider
   */
  async loginWithProvider(provider: string): Promise<void> {
    this.updateAuthState({ loading: true, error: null });
    
    try {
      const response = await apiService.authenticate(provider);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        await this.saveAuthData(token, user);
        
        this.updateAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
        });

        // Subscribe to user-specific webhooks
        await webhookService.subscribeToEvents(['user_updated', 'order_status', 'cart_update']);
      } else {
        throw new Error(response.error || 'OAuth login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth login failed';
      this.updateAuthState({
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await apiService.makeRequest<void>('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Backend logout failed:', error);
    } finally {
      // Always clear local data even if backend call fails
      await this.clearAuthData();
      
      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      });

      // Unsubscribe from user-specific webhooks
      await webhookService.unsubscribeFromEvents(['user_updated', 'order_status', 'cart_update']);
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<void> {
    if (!this.authState.token) return;
    
    try {
      const response = await apiService.makeRequest<AuthResponse>('/auth/refresh', {
        method: 'POST',
      });

      if (response.success && response.data) {
        const { token, user } = response.data;
        await this.saveAuthData(token, user);
        
        this.updateAuthState({
          token,
          user,
        });
      } else {
        // Refresh failed, logout user
        await this.logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<void> {
    if (!this.authState.user) return;
    
    try {
      const response = await apiService.makeRequest<User>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (response.success && response.data) {
        const updatedUser = response.data;
        await this.saveAuthData(this.authState.token!, updatedUser);
        
        this.updateAuthState({
          user: updatedUser,
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiService.makeRequest<void>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiService.makeRequest<void>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Failed to request password reset:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiService.makeRequest<void>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiService.makeRequest<User>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      if (response.success && response.data) {
        const updatedUser = response.data;
        await this.saveAuthData(this.authState.token!, updatedUser);
        
        this.updateAuthState({
          user: updatedUser,
        });
      }
    } catch (error) {
      console.error('Failed to verify email:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
