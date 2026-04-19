/**
 * LangChainApiTemplate - Template Component
 * Page-level object that places components into a layout
 * Articulates the design's underlying content structure
 */

import { Request, Response } from 'express';
import { langChainIntegrationService, UserIntegration, IntegrationMetrics } from '../organisms/LangChainIntegrationService';
import { authFlowManager, AuthFlowConfig } from '../molecules/AuthFlowManager';
import { agentConnectionManager, AgentManagementConfig } from '../molecules/AgentConnectionManager';

export interface ApiTemplateContext {
  userId: string;
  requestId: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

export interface AuthTemplateData {
  providers: string[];
  authUrl?: string;
  status: string;
  token?: string;
}

export interface AgentTemplateData {
  agentId: string;
  name: string;
  connections: number;
  deployments: number;
  status: string;
}

/**
 * Template-level API service for LangChain integration
 * Places components into a coherent API structure
 * Focuses on underlying content structure rather than final content
 */
export class LangChainApiTemplate {
  private readonly integrationService: typeof langChainIntegrationService;

  constructor() {
    this.integrationService = langChainIntegrationService;
  }

  /**
   * Template for authentication endpoints
   * Places auth components into a structured API response
   */
  async handleAuthTemplate(
    req: Request,
    res: Response,
    provider: string,
    scopes: string[] = []
  ): Promise<void> {
    const startTime = Date.now();
    const context = this.createContext(req);

    try {
      const authConfig: AuthFlowConfig = {
        provider,
        scopes: scopes.length > 0 ? scopes : this.integrationService.getConfig().defaultScopes,
        userId: context.userId,
      };

      const result = await authFlowManager.executeAuthFlow(authConfig);
      
      const responseData: AuthTemplateData = {
        providers: [provider],
        status: result.status,
        authUrl: result.authUrl,
        token: result.token,
      };

      const response = this.createApiResponse(responseData, context, startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(error, context, startTime);
      res.status(500).json(response);
    }
  }

  /**
   * Template for agent management endpoints
   * Places agent components into a structured API response
   */
  async handleAgentTemplate(
    req: Request,
    res: Response,
    action: 'create' | 'list' | 'delete' | 'status',
    agentId?: string
  ): Promise<void> {
    const startTime = Date.now();
    const context = this.createContext(req);

    try {
      let responseData: any;

      switch (action) {
        case 'create':
          if (!req.body) {
            throw new Error('Request body required for agent creation');
          }
          const agentConfig: AgentManagementConfig = {
            name: req.body.name,
            description: req.body.description,
            agentId: req.body.agentId || this.generateAgentId(),
            connections: req.body.connections || [],
            deploymentConfig: req.body.deploymentConfig,
          };
          const createResult = await agentConnectionManager.setupAgent(agentConfig);
          responseData = createResult;
          break;

        case 'list':
          const deployments = await agentConnectionManager.getAgentDeployments();
          responseData = deployments.map(d => ({
            agentId: d.id,
            name: d.name,
            connections: 0, // Would be calculated from actual connections
            deployments: 1,
            status: d.status,
          }));
          break;

        case 'status':
          if (!agentId) {
            throw new Error('Agent ID required for status check');
          }
          const deployment = await agentConnectionManager.getAgentDeploymentStatus(agentId);
          responseData = deployment ? {
            agentId: deployment.id,
            name: deployment.name,
            connections: 0,
            deployments: 1,
            status: deployment.status,
          } : null;
          break;

        case 'delete':
          if (!agentId) {
            throw new Error('Agent ID required for deletion');
          }
          const deleteResult = await agentConnectionManager.deleteAgent(agentId, context.userId);
          responseData = { deleted: deleteResult };
          break;

        default:
          throw new Error(`Unknown agent action: ${action}`);
      }

      const response = this.createApiResponse(responseData, context, startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(error, context, startTime);
      res.status(500).json(response);
    }
  }

  /**
   * Template for integration status endpoints
   * Places integration components into a structured API response
   */
  async handleIntegrationTemplate(
    req: Request,
    res: Response,
    action: 'status' | 'sync' | 'metrics' | 'health'
  ): Promise<void> {
    const startTime = Date.now();
    const context = this.createContext(req);

    try {
      let responseData: any;

      switch (action) {
        case 'status':
          const integration = await this.integrationService.initializeUserIntegration(
            context.userId,
            ['google', 'github', 'microsoft'] // Default providers
          );
          responseData = integration;
          break;

        case 'sync':
          const syncResult = await this.integrationService.syncUserIntegrations(context.userId);
          responseData = syncResult;
          break;

        case 'metrics':
          const metrics = await this.integrationService.getIntegrationMetrics(context.userId);
          responseData = metrics;
          break;

        case 'health':
          const health = await this.integrationService.performHealthCheck();
          responseData = health;
          break;

        default:
          throw new Error(`Unknown integration action: ${action}`);
      }

      const response = this.createApiResponse(responseData, context, startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(error, context, startTime);
      res.status(500).json(response);
    }
  }

  /**
   * Template for callback handling
   * Places callback components into a structured response
   */
  async handleCallbackTemplate(
    req: Request,
    res: Response,
    provider: string
  ): Promise<void> {
    const startTime = Date.now();
    const context = this.createContext(req);

    try {
      // Handle OAuth callback
      const authResult = await authFlowManager.waitForAuthCompletion(
        req.query.authId as string,
        60000, // 1 minute wait
        1000   // 1 second poll interval
      );

      const responseData = {
        provider,
        status: authResult.status,
        success: authResult.success,
        token: authResult.token,
        error: authResult.error,
      };

      const response = this.createApiResponse(responseData, context, startTime);
      
      // Redirect or return based on the request type
      if (req.accepts('html')) {
        // Redirect to frontend with success/error
        const redirectUrl = authResult.success 
          ? `${process.env.FRONTEND_URL}/auth/success?provider=${provider}`
          : `${process.env.FRONTEND_URL}/auth/error?provider=${provider}&error=${authResult.error}`;
        res.redirect(redirectUrl);
      } else {
        res.json(response);
      }
    } catch (error) {
      const response = this.createErrorResponse(error, context, startTime);
      res.status(500).json(response);
    }
  }

  /**
   * Create API context from request
   * Template helper: extracts context for all templates
   */
  private createContext(req: Request): ApiTemplateContext {
    return {
      userId: req.user?.id || req.headers['x-user-id'] as string || 'anonymous',
      requestId: req.headers['x-request-id'] as string || this.generateRequestId(),
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    };
  }

  /**
   * Create standardized API response
   * Template helper: creates consistent response structure
   */
  private createApiResponse<T>(
    data: T,
    context: ApiTemplateContext,
    startTime: number
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        requestId: context.requestId,
        timestamp: context.timestamp,
        processingTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Create standardized error response
   * Template helper: creates consistent error structure
   */
  private createErrorResponse(
    error: any,
    context: ApiTemplateContext,
    startTime: number
  ): ApiResponse {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        requestId: context.requestId,
        timestamp: context.timestamp,
        processingTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Generate unique request ID
   * Template helper: generates request identifiers
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique agent ID
   * Template helper: generates agent identifiers
   */
  private generateAgentId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get agent deployments (helper method)
   */
  private async getAgentDeployments(): Promise<any[]> {
    // This would use the agent service to get deployments
    // For now, return empty array as placeholder
    return [];
  }
}

// Export singleton instance
export const langChainApiTemplate = new LangChainApiTemplate();
