/**
 * LangChainIntegrationService - Organism Component
 * Combines molecules into complete LangChain integration functionality
 * Relatively complex UI components composed of groups of molecules and/or atoms
 */

import { authFlowManager, AuthFlowConfig } from '../molecules/AuthFlowManager';
import { agentConnectionManager, AgentManagementConfig } from '../molecules/AgentConnectionManager';
import { authService } from '../atoms/AuthService';
import { agentService, AgentDeployment } from '../atoms/AgentService';

export interface LangChainConfig {
  apiUrl: string;
  apiKey: string;
  defaultScopes: string[];
  timeoutMs: number;
}

export interface UserIntegration {
  userId: string;
  providers: string[];
  agents: string[];
  deployments: string[];
  lastSync: string;
  status: 'active' | 'inactive' | 'error';
}

export interface IntegrationMetrics {
  totalConnections: number;
  activeConnections: number;
  totalDeployments: number;
  activeDeployments: number;
  errors: number;
  lastActivity: string;
}

/**
 * Organism-level LangChain integration service
 * Combines authentication, agent management, and deployment functionality
 * Forms distinct sections of the integration interface
 */
export class LangChainIntegrationService {
  private readonly config: LangChainConfig;
  private readonly authFlowManager: typeof authFlowManager;
  private readonly agentConnectionManager: typeof agentConnectionManager;
  private readonly agentService: typeof agentService;

  constructor(config: Partial<LangChainConfig> = {}) {
    this.config = {
      apiUrl: config.apiUrl || process.env.LANGCHAIN_API_URL || 'https://api.langchain.com',
      apiKey: config.apiKey || process.env.LANGCHAIN_API_KEY || '',
      defaultScopes: config.defaultScopes || ['read', 'write'],
      timeoutMs: config.timeoutMs || 300000,
    };

    // Initialize services with config
    this.authFlowManager = authFlowManager;
    this.agentConnectionManager = agentConnectionManager;
    this.agentService = agentService;
  }

  /**
   * Initialize complete user integration
   * Organism operation: combines multiple molecular operations
   */
  async initializeUserIntegration(userId: string, providers: string[]): Promise<UserIntegration> {
    try {
      const availableProviders = await this.authFlowManager.getAvailableProviders();
      const validProviders = providers.filter(p => availableProviders.some(ap => ap.provider === p));

      const integration: UserIntegration = {
        userId,
        providers: validProviders,
        agents: [],
        deployments: [],
        lastSync: new Date().toISOString(),
        status: 'active',
      };

      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize user integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup complete agent with authentication and deployment
   * Organism operation: combines molecular operations into complete workflow
   */
  async setupCompleteAgent(config: AgentManagementConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Setup agent with connections
      const connectionResult = await this.agentConnectionManager.setupAgent(config);
      
      if (!connectionResult.success) {
        return {
          success: false,
          error: connectionResult.error,
        };
      }

      // If deployment was created, verify it's active
      if (connectionResult.deployment) {
        const deployment = await this.agentConnectionManager.getAgentDeploymentStatus(
          connectionResult.deployment.id
        );
        
        if (!deployment || deployment.status !== 'active') {
          return {
            success: false,
            error: 'Agent setup succeeded but deployment is not active',
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup complete agent',
      };
    }
  }

  /**
   * Get integration metrics for monitoring
   * Organism operation: combines data from multiple sources
   */
  async getIntegrationMetrics(userId?: string): Promise<IntegrationMetrics> {
    try {
      // Get all deployments
      const deployments = await this.agentService.listDeployments();
      const activeDeployments = deployments.filter((d: AgentDeployment) => d.status === 'active');

      // Get connections for user if provided
      let totalConnections = 0;
      let activeConnections = 0;
      
      if (userId) {
        // This would require iterating through user's agents to get connections
        // For now, we'll use placeholder logic
        totalConnections = 0;
        activeConnections = 0;
      }

      return {
        totalConnections,
        activeConnections,
        totalDeployments: deployments.length,
        activeDeployments: activeDeployments.length,
        errors: 0, // Would be calculated from error logs
        lastActivity: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to get integration metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for entire integration
   * Organism operation: combines multiple health checks
   */
  async performHealthCheck(): Promise<{ 
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    details: Record<string, string>;
  }> {
    const checks: Record<string, boolean> = {};
    const details: Record<string, string> = {};

    try {
      // Check API connectivity
      try {
        await authService.listOAuthProviders();
        checks.api = true;
        details.api = 'API connectivity successful';
      } catch (error) {
        checks.api = false;
        details.api = `API connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      // Check configuration
      checks.config = !!(this.config.apiUrl && this.config.apiKey);
      details.config = checks.config ? 'Configuration valid' : 'Missing API URL or key';

      // Check timeout settings
      checks.timeout = this.config.timeoutMs > 0;
      details.timeout = checks.timeout ? `Timeout set to ${this.config.timeoutMs}ms` : 'Invalid timeout setting';

      // Determine overall status
      const failedChecks = Object.values(checks).filter(check => !check).length;
      let status: 'healthy' | 'degraded' | 'unhealthy';
      
      if (failedChecks === 0) {
        status = 'healthy';
      } else if (failedChecks <= 1) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return { status, checks, details };
    } catch (error) {
      return {
        status: 'unhealthy',
        checks: {},
        details: { error: error instanceof Error ? error.message : 'Health check failed' },
      };
    }
  }

  /**
   * Cleanup user integration
   * Organism operation: combines multiple cleanup operations
   */
  async cleanupUserIntegration(userId: string): Promise<{ success: boolean; cleaned: string[]; errors: string[] }> {
    const cleaned: string[] = [];
    const errors: string[] = [];

    try {
      // Get user's OAuth tokens
      const tokens = await authService.listOAuthTokensForUser(userId);
      
      // Revoke all tokens
      for (const token of tokens) {
        try {
          const revoked = await authService.deleteOAuthToken(token.id, userId);
          if (revoked) {
            cleaned.push(`Token for ${token.providerId}`);
          } else {
            errors.push(`Failed to revoke token for ${token.providerId}`);
          }
        } catch (error) {
          errors.push(`Error revoking token for ${token.providerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Note: In a real implementation, you would also clean up agent connections and deployments
      // This would require tracking which agents belong to which users

      return {
        success: errors.length === 0,
        cleaned,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        cleaned,
        errors: [...errors, `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Sync user integrations
   * Organism operation: combines sync operations across providers
   */
  async syncUserIntegrations(userId: string): Promise<{ 
    synced: string[]; 
    failed: string[]; 
    errors: string[] 
  }> {
    const synced: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    try {
      const providers = await this.authFlowManager.getAvailableProviders();
      
      for (const provider of providers) {
        if (!provider.isActive) continue;

        try {
          // Check if user has valid token for this provider
          const hasToken = await authService.checkOAuthTokenExists(userId, provider.provider);
          
          if (hasToken) {
            synced.push(provider.provider);
          } else {
            failed.push(provider.provider);
          }
        } catch (error) {
          errors.push(`${provider.provider}: ${error instanceof Error ? error.message : 'Sync failed'}`);
        }
      }

      return { synced, failed, errors };
    } catch (error) {
      return {
        synced,
        failed,
        errors: [...errors, `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Get configuration
   */
  getConfig(): LangChainConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LangChainConfig>): void {
    Object.assign(this.config, newConfig);
  }
}

// Export singleton instance
export const langChainIntegrationService = new LangChainIntegrationService();
