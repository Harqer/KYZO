/**
 * AuthFlowManager - Molecular Component
 * Combines authentication atoms into a functional authentication flow
 * Groups of atoms bonded together that take on distinct new properties
 */

import { authService, AuthRequest, AuthResponse, OAuthProvider, OAuthToken } from '../atoms/AuthService';

export interface AuthFlowConfig {
  provider: string;
  scopes: string[];
  userId: string;
  agentId?: string;
  forceNew?: boolean;
  isDefault?: boolean;
}

export interface AuthFlowResult {
  success: boolean;
  status: 'completed' | 'pending' | 'connection_required' | 'token_expired' | 'error';
  authUrl?: string;
  token?: string;
  authId?: string;
  error?: string;
}

/**
 * Molecular authentication flow manager
 * Combines atomic auth operations into a cohesive authentication flow
 * Follows single responsibility principle for flow management
 */
export class AuthFlowManager {
  private readonly authService: typeof authService;

  constructor(authServiceInstance = authService) {
    this.authService = authServiceInstance;
  }

  /**
   * Complete authentication flow from start to finish
   * Molecular operation: combines multiple atomic operations
   */
  async executeAuthFlow(config: AuthFlowConfig): Promise<AuthFlowResult> {
    try {
      // Step 1: Check if token already exists
      const tokenExists = await this.authService.checkOAuthTokenExists(
        config.userId,
        config.provider
      );

      if (tokenExists && !config.forceNew) {
        // Token exists, retrieve it
        const tokens = await this.authService.listOAuthTokensForUser(config.userId);
        const existingToken = tokens.find(token => 
          token.providerId === config.provider && 
          (!config.isDefault || token.label === 'default')
        );

        if (existingToken && (!existingToken.expiresAt || new Date(existingToken.expiresAt) > new Date())) {
          return {
            success: true,
            status: 'completed',
            token: existingToken.token,
            authId: existingToken.id,
          };
        }
      }

      // Step 2: Start authentication process
      const authRequest: AuthRequest = {
        provider: config.provider,
        scopes: config.scopes,
        userId: config.userId,
        agentId: config.agentId,
        forceNew: config.forceNew,
        isDefault: config.isDefault,
      };

      const authResponse = await this.authService.authenticate(authRequest);

      // Step 3: Handle response based on status
      switch (authResponse.status) {
        case 'completed':
          return {
            success: true,
            status: 'completed',
            token: authResponse.token,
            authId: authResponse.authId,
          };

        case 'pending':
        case 'connection_required':
          return {
            success: false,
            status: authResponse.status,
            authUrl: authResponse.url,
            authId: authResponse.authId,
          };

        case 'token_expired':
          return {
            success: false,
            status: 'token_expired',
            error: 'Authentication token has expired',
          };

        default:
          return {
            success: false,
            status: 'error',
            error: 'Unknown authentication status',
          };
      }
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Authentication flow failed',
      };
    }
  }

  /**
   * Wait for authentication completion
   * Molecular operation: combines polling with status checking
   */
  async waitForAuthCompletion(
    authId: string,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 2000 // 2 seconds
  ): Promise<AuthFlowResult> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // In a real implementation, you would poll the auth status
        // For now, we'll simulate this with a timeout
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Check if auth is complete (this would be an actual API call)
        // const status = await this.authService.checkAuthStatus(authId);
        
        // For demonstration, we'll assume completion after some time
        if (Date.now() - startTime > 10000) { // 10 seconds for demo
          return {
            success: true,
            status: 'completed',
            token: 'demo-token',
            authId,
          };
        }
      } catch (error) {
        return {
          success: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Auth completion check failed',
        };
      }
    }

    return {
      success: false,
      status: 'error',
      error: 'Authentication timed out',
    };
  }

  /**
   * Get available OAuth providers
   * Molecular operation: combines provider listing with filtering
   */
  async getAvailableProviders(): Promise<OAuthProvider[]> {
    try {
      const providers = await this.authService.listOAuthProviders();
      return providers.filter(provider => provider.isActive);
    } catch (error) {
      throw new Error(`Failed to get available providers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revoke authentication for a provider
   * Molecular operation: combines token listing with deletion
   */
  async revokeAuthentication(userId: string, provider: string): Promise<boolean> {
    try {
      const tokens = await this.authService.listOAuthTokensForUser(userId);
      const providerTokens = tokens.filter(token => token.providerId === provider);
      
      let success = true;
      for (const token of providerTokens) {
        const deleted = await this.authService.deleteOAuthToken(token.id, userId);
        if (!deleted) {
          success = false;
        }
      }
      
      return success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh authentication token
   * Molecular operation: combines revocation with re-authentication
   */
  async refreshToken(config: AuthFlowConfig): Promise<AuthFlowResult> {
    // First revoke existing authentication
    await this.revokeAuthentication(config.userId, config.provider);
    
    // Then re-authenticate with forceNew: true
    return this.executeAuthFlow({
      ...config,
      forceNew: true,
    });
  }
}

// Export singleton instance
export const authFlowManager = new AuthFlowManager();
