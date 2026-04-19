/**
 * AuthService - Atomic Service Component
 * Basic authentication service atom following Atomic Design principles
 * Can't be broken down further without ceasing to be functional
 */

import axios from 'axios';

export interface AuthRequest {
  provider: string;
  scopes: string[];
  userId?: string;
  lsUserId?: string;
  agentId?: string;
  useAgentBuilderPublicOAuth?: boolean;
  forceNew?: boolean;
  tokenId?: string;
  isDefault?: boolean;
}

export interface AuthResponse {
  status: 'completed' | 'pending' | 'connection_required' | 'token_expired';
  url?: string;
  authId?: string;
  token?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface OAuthProvider {
  id: string;
  name: string;
  provider: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthToken {
  id: string;
  userId: string;
  providerId: string;
  token: string;
  scopes: string[];
  expiresAt?: string;
  label?: string;
  createdAt: string;
}

/**
 * Atomic authentication service for LangChain integration
 * Handles basic OAuth operations with LangChain API
 */
export class AuthService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.LANGCHAIN_API_URL || 'https://api.langchain.com';
    this.apiKey = apiKey || process.env.LANGCHAIN_API_KEY || '';
  }

  /**
   * Authenticate with OAuth provider
   * Atomic operation: single responsibility authentication
   */
  async authenticate(request: AuthRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/auth/authenticate`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if OAuth token exists for user
   * Atomic operation: single responsibility token check
   */
  async checkOAuthTokenExists(userId: string, provider: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/auth/check-oauth-token-exists`,
        {
          params: { userId, provider },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.exists || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * List OAuth providers
   * Atomic operation: single responsibility provider listing
   */
  async listOAuthProviders(): Promise<OAuthProvider[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/auth/list-oauth-providers`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.providers || [];
    } catch (error) {
      throw new Error(`Failed to list OAuth providers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get specific OAuth provider
   * Atomic operation: single responsibility provider retrieval
   */
  async getOAuthProvider(providerId: string): Promise<OAuthProvider | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/auth/get-oauth-provider`,
        {
          params: { providerId },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.provider || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * List OAuth tokens for user
   * Atomic operation: single responsibility token listing
   */
  async listOAuthTokensForUser(userId: string): Promise<OAuthToken[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/auth/list-oauth-tokens-for-user`,
        {
          params: { userId },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.tokens || [];
    } catch (error) {
      throw new Error(`Failed to list OAuth tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete OAuth token
   * Atomic operation: single responsibility token deletion
   */
  async deleteOAuthToken(tokenId: string, userId: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseUrl}/v2/auth/delete-single-oauth-token`,
        {
          data: { tokenId, userId },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
