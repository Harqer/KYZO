/**
 * API Service - Atomic Component
 * Basic API communication service that can't be broken down further
 * Handles communication between Expo app and FastAPI backend
 */

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// API configuration from app.json
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  provider: string;
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  provider?: string;
  last_active?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  provider: string;
  config?: Record<string, any>;
}

export interface AISandboxRequest {
  code: string;
  language: string;
  config?: {
    timeout_ms?: number;
    memory_mb?: number;
  };
}

export interface AIChatRequest {
  model_id: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

// API error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string) {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

// Main API service class
class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Get authentication token from secure storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getAuthToken();

    const headers = {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const responseText = await response.text();
      
      let data: ApiResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          success: false,
          error: 'Invalid JSON response',
          message: responseText,
          timestamp: new Date().toISOString(),
        };
      }

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || `HTTP ${response.status}`,
          response.status,
          data.error ? 'API_ERROR' : undefined
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('network')) {
        throw new NetworkError('Network connection failed');
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Authentication endpoints
   */
  async authenticate(provider: string, code?: string): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>('/auth/authenticate', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        code,
        scopes: ['profile', 'email'],
        user_id: 'mobile_user', // This would come from device info in real app
      }),
    });
  }

  async handleAuthCallback(provider: string, code: string, state?: string): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>(`/auth/${provider}/callback`, {
      method: 'POST',
      body: JSON.stringify({
        code,
        state,
      }),
    });
  }

  async getOAuthProviders(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/auth/providers');
  }

  /**
   * Agent management endpoints
   */
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    return this.makeRequest<Agent[]>('/agents');
  }

  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.makeRequest<Agent>(`/agents/${id}`);
  }

  async createAgent(request: CreateAgentRequest): Promise<ApiResponse<Agent>> {
    return this.makeRequest<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<ApiResponse<Agent>> {
    return this.makeRequest<Agent>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAgent(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async getAgentConnections(agentId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/agents/${agentId}/connections`);
  }

  async createAgentConnection(agentId: string, oauthTokenId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/agents/${agentId}/connections`, {
      method: 'POST',
      body: JSON.stringify({
        oauth_token_id: oauthTokenId,
      }),
    });
  }

  /**
   * Integration endpoints
   */
  async getIntegrationStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/integration');
  }

  async getIntegrationMetrics(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/integration/metrics');
  }

  async syncIntegrations(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/integration/sync', {
      method: 'POST',
    });
  }

  async getIntegrationHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/integration/health');
  }

  /**
   * AI Features endpoints
   */
  async executeCodeInSandbox(request: AISandboxRequest): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/sandbox/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async validateCodeSafety(code: string, language: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/sandbox/validate', {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
      }),
    });
  }

  async getSandboxStats(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/sandbox/stats');
  }

  async chatWithAI(request: AIChatRequest): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/gateway/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAvailableModels(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/gateway/models');
  }

  async getGatewayStats(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/gateway/stats');
  }

  async testModelConnectivity(modelId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/ai/gateway/test/${modelId}`);
  }

  async generateCodeWithAI(prompt: string, language: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/generate/code', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        language,
      }),
    });
  }

  async generateDocumentation(code: string, language: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/generate/documentation', {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
      }),
    });
  }

  async getWorkflowStats(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/ai/workflow/stats');
  }

  async getWorkflowResults(limit: number = 50): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/ai/workflow/results?limit=${limit}`);
  }

  /**
   * System endpoints
   */
  async getHealthStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/health');
  }

  async getApiDocs(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/docs');
  }

  /**
   * Utility methods
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  async clearAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_provider');
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// All types are already exported inline above
