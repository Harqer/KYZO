/**
 * AgentService - Atomic Service Component
 * Basic agent connection service atom following Atomic Design principles
 * Can't be broken down further without ceasing to be functional
 */

import axios from 'axios';

export interface AgentConnection {
  id: string;
  agentId: string;
  oauthTokenId: string;
  providerId: string;
  providerAccountLabel: string;
  scopes: string[];
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateConnectionRequest {
  oauthTokenId: string;
}

export interface AgentDeployment {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'deploying' | 'failed';
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Atomic agent service for LangChain integration
 * Handles basic agent operations with LangChain API
 */
export class AgentService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.LANGCHAIN_API_URL || 'https://api.langchain.com';
    this.apiKey = apiKey || process.env.LANGCHAIN_API_KEY || '';
  }

  /**
   * Create agent connection
   * Atomic operation: single responsibility connection creation
   */
  async createConnection(agentId: string, request: CreateConnectionRequest): Promise<AgentConnection> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/auth/agents/${agentId}/connections`,
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
      throw new Error(`Failed to create agent connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List agent connections
   * Atomic operation: single responsibility connection listing
   */
  async listConnections(agentId: string): Promise<AgentConnection[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/auth/agents/${agentId}/connections`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.connections || [];
    } catch (error) {
      throw new Error(`Failed to list agent connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove agent connection
   * Atomic operation: single responsibility connection removal
   */
  async removeConnection(agentId: string, connectionId: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseUrl}/v2/auth/agents/${agentId}/connections/${connectionId}`,
        {
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

  /**
   * Create agent deployment
   * Atomic operation: single responsibility deployment creation
   */
  async createDeployment(config: Partial<AgentDeployment>): Promise<AgentDeployment> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/deployments`,
        config,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List agent deployments
   * Atomic operation: single responsibility deployment listing
   */
  async listDeployments(): Promise<AgentDeployment[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/deployments`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.deployments || [];
    } catch (error) {
      throw new Error(`Failed to list deployments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get deployment details
   * Atomic operation: single responsibility deployment retrieval
   */
  async getDeployment(deploymentId: string): Promise<AgentDeployment | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/deployments/${deploymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.deployment || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete deployment
   * Atomic operation: single responsibility deployment deletion
   */
  async deleteDeployment(deploymentId: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseUrl}/v2/deployments/${deploymentId}`,
        {
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
export const agentService = new AgentService();
