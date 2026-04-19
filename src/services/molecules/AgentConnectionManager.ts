/**
 * AgentConnectionManager - Molecular Component
 * Combines agent service atoms into a functional connection management system
 * Groups of atoms bonded together that take on distinct new properties
 */

import { agentService, AgentConnection, CreateConnectionRequest, AgentDeployment } from '../atoms/AgentService';
import { authFlowManager, AuthFlowConfig } from './AuthFlowManager';

export interface AgentConnectionConfig {
  agentId: string;
  provider: string;
  scopes: string[];
  userId: string;
  providerAccountLabel?: string;
  isDefault?: boolean;
}

export interface AgentConnectionResult {
  success: boolean;
  connection?: AgentConnection;
  deployment?: AgentDeployment;
  error?: string;
}

export interface AgentManagementConfig {
  name: string;
  description?: string;
  agentId: string;
  connections: AgentConnectionConfig[];
  deploymentConfig?: Record<string, any>;
}

/**
 * Molecular agent connection manager
 * Combines atomic agent operations with authentication flows
 * Follows single responsibility principle for connection management
 */
export class AgentConnectionManager {
  private readonly agentService: typeof agentService;
  private readonly authFlowManager: typeof authFlowManager;

  constructor(
    agentServiceInstance = agentService,
    authFlowManagerInstance = authFlowManager
  ) {
    this.agentService = agentServiceInstance;
    this.authFlowManager = authFlowManagerInstance;
  }

  /**
   * Create complete agent connection with authentication
   * Molecular operation: combines auth flow with connection creation
   */
  async createAgentConnection(config: AgentConnectionConfig): Promise<AgentConnectionResult> {
    try {
      // Step 1: Authenticate with the provider
      const authConfig: AuthFlowConfig = {
        provider: config.provider,
        scopes: config.scopes,
        userId: config.userId,
        agentId: config.agentId,
        isDefault: config.isDefault,
      };

      const authResult = await this.authFlowManager.executeAuthFlow(authConfig);

      if (!authResult.success || authResult.status !== 'completed') {
        return {
          success: false,
          error: authResult.error || `Authentication failed with status: ${authResult.status}`,
        };
      }

      if (!authResult.token) {
        return {
          success: false,
          error: 'Authentication succeeded but no token received',
        };
      }

      // Step 2: Create the agent connection
      const connectionRequest: CreateConnectionRequest = {
        oauthTokenId: authResult.token,
      };

      const connection = await this.agentService.createConnection(config.agentId, connectionRequest);

      return {
        success: true,
        connection,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create agent connection',
      };
    }
  }

  /**
   * Setup complete agent with multiple connections
   * Molecular operation: combines multiple connection creations
   */
  async setupAgent(config: AgentManagementConfig): Promise<AgentConnectionResult> {
    try {
      const connections: AgentConnection[] = [];
      let lastError: string | undefined;

      // Create all connections
      for (const connectionConfig of config.connections) {
        const result = await this.createAgentConnection(connectionConfig);
        
        if (result.success && result.connection) {
          connections.push(result.connection);
        } else {
          lastError = result.error;
          // Continue trying other connections even if one fails
        }
      }

      if (connections.length === 0) {
        return {
          success: false,
          error: lastError || 'Failed to create any connections',
        };
      }

      // Create deployment if config provided
      let deployment: AgentDeployment | undefined;
      if (config.deploymentConfig) {
        try {
          deployment = await this.agentService.createDeployment({
            name: config.name,
            description: config.description,
            ...config.deploymentConfig,
          });
        } catch (error) {
          // Don't fail the whole operation if deployment fails
          console.warn('Deployment creation failed:', error);
        }
      }

      return {
        success: true,
        connection: connections[0], // Return first connection as primary
        deployment,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup agent',
      };
    }
  }

  /**
   * Get all connections for an agent
   * Molecular operation: combines connection listing with filtering
   */
  async getAgentConnections(agentId: string): Promise<AgentConnection[]> {
    try {
      return await this.agentService.listConnections(agentId);
    } catch (error) {
      throw new Error(`Failed to get agent connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove agent connection and clean up authentication
   * Molecular operation: combines connection removal with auth cleanup
   */
  async removeAgentConnection(agentId: string, connectionId: string, userId: string): Promise<boolean> {
    try {
      // Get connection details before removal for cleanup
      const connections = await this.agentService.listConnections(agentId);
      const connection = connections.find(c => c.id === connectionId);
      
      // Remove the connection
      const removed = await this.agentService.removeConnection(agentId, connectionId);
      
      // Clean up authentication if connection was found
      if (connection && removed) {
        await this.authFlowManager.revokeAuthentication(userId, connection.providerId);
      }
      
      return removed;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh agent connection
   * Molecular operation: combines connection refresh with auth refresh
   */
  async refreshAgentConnection(
    agentId: string, 
    connectionId: string, 
    userId: string
  ): Promise<AgentConnectionResult> {
    try {
      // Get current connection details
      const connections = await this.agentService.listConnections(agentId);
      const connection = connections.find(c => c.id === connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found',
        };
      }

      // Refresh authentication
      const authConfig: AuthFlowConfig = {
        provider: connection.providerId,
        scopes: connection.scopes,
        userId,
        agentId,
        isDefault: true,
      };

      const authResult = await this.authFlowManager.refreshToken(authConfig);

      if (!authResult.success || authResult.status !== 'completed') {
        return {
          success: false,
          error: authResult.error || `Authentication refresh failed with status: ${authResult.status}`,
        };
      }

      // Remove old connection and create new one
      await this.agentService.removeConnection(agentId, connectionId);
      
      const connectionRequest: CreateConnectionRequest = {
        oauthTokenId: authResult.token!,
      };

      const newConnection = await this.agentService.createConnection(agentId, connectionRequest);

      return {
        success: true,
        connection: newConnection,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh agent connection',
      };
    }
  }

  /**
   * Get agent deployment status
   * Molecular operation: combines deployment retrieval with status checking
   */
  async getAgentDeploymentStatus(deploymentId: string): Promise<AgentDeployment | null> {
    try {
      return await this.agentService.getDeployment(deploymentId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete agent and all its connections
   * Molecular operation: combines multiple deletions with cleanup
   */
  async deleteAgent(agentId: string, userId: string): Promise<boolean> {
    try {
      // Get all connections
      const connections = await this.agentService.listConnections(agentId);
      
      // Remove all connections and clean up auth
      let allConnectionsRemoved = true;
      for (const connection of connections) {
        const removed = await this.removeAgentConnection(agentId, connection.id, userId);
        if (!removed) {
          allConnectionsRemoved = false;
        }
      }

      return allConnectionsRemoved;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const agentConnectionManager = new AgentConnectionManager();
