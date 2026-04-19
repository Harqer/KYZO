/**
 * LangChainIntegrationPage - Page Component
 * Complete page-level component that represents the final UI
 * Combines templates with actual content to create complete user experiences
 */

import { Request, Response } from 'express';
import { langChainApiTemplate } from '../templates/LangChainApiTemplate';
import { langChainIntegrationService } from '../organisms/LangChainIntegrationService';

export interface PageContext {
  user: {
    id: string;
    email?: string;
    name?: string;
    preferences?: Record<string, any>;
  };
  session: {
    id: string;
    createdAt: string;
    lastActivity: string;
  };
  request: {
    id: string;
    method: string;
    path: string;
    timestamp: string;
  };
}

export interface PageData {
  title: string;
  description: string;
  sections: PageSection[];
  navigation: PageNavigation;
  metadata: PageMetadata;
}

export interface PageSection {
  id: string;
  type: 'auth' | 'agents' | 'metrics' | 'settings';
  title: string;
  content: any;
  actions?: PageAction[];
}

export interface PageAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requiresAuth?: boolean;
}

export interface PageNavigation {
  current: string;
  items: NavigationItem[];
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  active: boolean;
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  lastUpdated: string;
  version: string;
}

/**
 * Page-level LangChain integration service
 * Represents complete user experiences with actual content
 * Places templates into the context of real user scenarios
 */
export class LangChainIntegrationPage {
  private readonly apiTemplate: typeof langChainApiTemplate;
  private readonly integrationService: typeof langChainIntegrationService;

  constructor() {
    this.apiTemplate = langChainApiTemplate;
    this.integrationService = langChainIntegrationService;
  }

  /**
   * Render authentication page
   * Page-level: combines auth template with user-specific content
   */
  async renderAuthPage(req: Request, res: Response): Promise<void> {
    const context = this.createPageContext(req);
    const pageData: PageData = {
      title: 'Authentication - LangChain Integration',
      description: 'Connect your accounts with LangChain providers',
      sections: [
        {
          id: 'auth-providers',
          type: 'auth',
          title: 'Available Providers',
          content: await this.getAuthProviderContent(context),
          actions: [
            {
              id: 'connect-google',
              label: 'Connect Google',
              type: 'primary',
              endpoint: '/api/auth/google',
              method: 'POST',
              requiresAuth: true,
            },
            {
              id: 'connect-github',
              label: 'Connect GitHub',
              type: 'secondary',
              endpoint: '/api/auth/github',
              method: 'POST',
              requiresAuth: true,
            },
          ],
        },
        {
          id: 'existing-connections',
          type: 'auth',
          title: 'Existing Connections',
          content: await this.getExistingConnectionsContent(context),
          actions: [
            {
              id: 'refresh-connections',
              label: 'Refresh All',
              type: 'secondary',
              endpoint: '/api/integration/sync',
              method: 'POST',
              requiresAuth: true,
            },
          ],
        },
      ],
      navigation: this.createNavigation('auth'),
      metadata: this.createPageMetadata('Authentication'),
    };

    await this.renderPage(req, res, pageData, context);
  }

  /**
   * Render agents management page
   * Page-level: combines agent template with deployment content
   */
  async renderAgentsPage(req: Request, res: Response): Promise<void> {
    const context = this.createPageContext(req);
    const pageData: PageData = {
      title: 'Agent Management - LangChain Integration',
      description: 'Manage your LangChain agents and deployments',
      sections: [
        {
          id: 'agent-list',
          type: 'agents',
          title: 'Your Agents',
          content: await this.getAgentListContent(context),
          actions: [
            {
              id: 'create-agent',
              label: 'Create New Agent',
              type: 'primary',
              endpoint: '/api/agents',
              method: 'POST',
              requiresAuth: true,
            },
          ],
        },
        {
          id: 'deployment-status',
          type: 'agents',
          title: 'Deployment Status',
          content: await this.getDeploymentStatusContent(context),
          actions: [
            {
              id: 'refresh-deployments',
              label: 'Refresh Status',
              type: 'secondary',
              endpoint: '/api/agents/status',
              method: 'GET',
              requiresAuth: true,
            },
          ],
        },
      ],
      navigation: this.createNavigation('agents'),
      metadata: this.createPageMetadata('Agent Management'),
    };

    await this.renderPage(req, res, pageData, context);
  }

  /**
   * Render metrics dashboard page
   * Page-level: combines metrics template with analytics content
   */
  async renderMetricsPage(req: Request, res: Response): Promise<void> {
    const context = this.createPageContext(req);
    const pageData: PageData = {
      title: 'Integration Metrics - LangChain Integration',
      description: 'Monitor your LangChain integration performance and usage',
      sections: [
        {
          id: 'overview-metrics',
          type: 'metrics',
          title: 'Overview',
          content: await this.getOverviewMetricsContent(context),
          actions: [
            {
              id: 'refresh-metrics',
              label: 'Refresh Metrics',
              type: 'secondary',
              endpoint: '/api/integration/metrics',
              method: 'GET',
              requiresAuth: true,
            },
          ],
        },
        {
          id: 'health-status',
          type: 'metrics',
          title: 'System Health',
          content: await this.getHealthStatusContent(context),
          actions: [
            {
              id: 'run-health-check',
              label: 'Run Health Check',
              type: 'primary',
              endpoint: '/api/integration/health',
              method: 'GET',
              requiresAuth: true,
            },
          ],
        },
      ],
      navigation: this.createNavigation('metrics'),
      metadata: this.createPageMetadata('Integration Metrics'),
    };

    await this.renderPage(req, res, pageData, context);
  }

  /**
   * Render settings page
   * Page-level: combines settings template with configuration content
   */
  async renderSettingsPage(req: Request, res: Response): Promise<void> {
    const context = this.createPageContext(req);
    const pageData: PageData = {
      title: 'Integration Settings - LangChain Integration',
      description: 'Configure your LangChain integration preferences',
      sections: [
        {
          id: 'api-configuration',
          type: 'settings',
          title: 'API Configuration',
          content: await this.getApiConfigurationContent(context),
          actions: [
            {
              id: 'save-config',
              label: 'Save Configuration',
              type: 'primary',
              endpoint: '/api/settings/config',
              method: 'PUT',
              requiresAuth: true,
            },
          ],
        },
        {
          id: 'user-preferences',
          type: 'settings',
          title: 'User Preferences',
          content: await this.getUserPreferencesContent(context),
          actions: [
            {
              id: 'save-preferences',
              label: 'Save Preferences',
              type: 'secondary',
              endpoint: '/api/settings/preferences',
              method: 'PUT',
              requiresAuth: true,
            },
          ],
        },
      ],
      navigation: this.createNavigation('settings'),
      metadata: this.createPageMetadata('Integration Settings'),
    };

    await this.renderPage(req, res, pageData, context);
  }

  /**
   * Render complete page with content
   * Page-level: combines template structure with actual content
   */
  private async renderPage(
    req: Request,
    res: Response,
    pageData: PageData,
    context: PageContext
  ): Promise<void> {
    // Determine response format based on request
    if (req.accepts('json')) {
      // Return JSON response for API consumers
      res.json({
        page: pageData,
        context: {
          user: context.user,
          sessionId: context.session.id,
        },
      });
    } else {
      // Return HTML response for web browsers
      const html = this.generateHtmlPage(pageData, context);
      res.send(html);
    }
  }

  /**
   * Create page context from request
   * Page-level: extracts comprehensive context for page rendering
   */
  private createPageContext(req: Request): PageContext {
    return {
      user: {
        id: req.user?.id || 'anonymous',
        email: req.user?.email,
        name: (req.user as any)?.name || (req.user as any)?.fullName || (req.user as any)?.username,
        preferences: (req.user as any)?.preferences || {},
      },
      session: {
        id: (req as any).sessionID || (req as any).session?.id || this.generateSessionId(),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      },
      request: {
        id: req.headers['x-request-id'] as string || this.generateRequestId(),
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create navigation for page
   * Page-level: creates consistent navigation structure
   */
  private createNavigation(current: string): PageNavigation {
    const items: NavigationItem[] = [
      { id: 'auth', label: 'Authentication', path: '/integration/auth', active: current === 'auth' },
      { id: 'agents', label: 'Agents', path: '/integration/agents', active: current === 'agents' },
      { id: 'metrics', label: 'Metrics', path: '/integration/metrics', active: current === 'metrics' },
      { id: 'settings', label: 'Settings', path: '/integration/settings', active: current === 'settings' },
    ];

    return {
      current,
      items,
    };
  }

  /**
   * Create page metadata
   * Page-level: creates SEO and metadata information
   */
  private createPageMetadata(pageType: string): PageMetadata {
    return {
      title: `${pageType} - LangChain Integration`,
      description: `Manage your ${pageType.toLowerCase()} with LangChain integration`,
      keywords: ['langchain', 'integration', pageType.toLowerCase(), 'ai', 'automation'],
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Generate HTML page
   * Page-level: creates complete HTML document
   */
  private generateHtmlPage(pageData: PageData, context: PageContext): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageData.metadata.title}</title>
    <meta name="description" content="${pageData.metadata.description}">
    <meta name="keywords" content="${pageData.metadata.keywords.join(', ')}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <h1 class="text-xl font-semibold text-gray-900">LangChain Integration</h1>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                            ${pageData.navigation.items.map(item => `
                                <a href="${item.path}" class="${item.active ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    ${item.label}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div class="px-4 py-6 sm:px-0">
                <div class="mb-8">
                    <h1 class="text-2xl font-bold text-gray-900">${pageData.title}</h1>
                    <p class="mt-2 text-gray-600">${pageData.description}</p>
                </div>

                ${pageData.sections.map(section => `
                    <div class="bg-white shadow rounded-lg mb-6">
                        <div class="px-4 py-5 sm:p-6">
                            <h2 class="text-lg font-medium text-gray-900 mb-4">${section.title}</h2>
                            <div class="mb-4">
                                <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">${JSON.stringify(section.content, null, 2)}</pre>
                            </div>
                            ${section.actions ? `
                                <div class="flex space-x-4">
                                    ${section.actions.map(action => `
                                        <button class="${this.getButtonClass(action.type)}" onclick="handleAction('${action.endpoint}', '${action.method}')">
                                            ${action.label}
                                        </button>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </main>
    </div>

    <script>
        function handleAction(endpoint, method) {
            fetch(endpoint, { method })
                .then(response => response.json())
                .then(data => {
                    console.log('Action result:', data);
                    location.reload();
                })
                .catch(error => {
                    console.error('Action failed:', error);
                    alert('Action failed. Please try again.');
                });
        }
    </script>
</body>
</html>`;
  }

  /**
   * Get button class based on action type
   */
  private getButtonClass(type: 'primary' | 'secondary' | 'danger'): string {
    switch (type) {
      case 'primary':
        return 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md';
      case 'secondary':
        return 'bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-md';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md';
    }
  }

  // Content getter methods (placeholders for actual implementation)
  private async getAuthProviderContent(context: PageContext): Promise<any> {
    return { message: 'Auth provider content for user: ' + context.user.id };
  }

  private async getExistingConnectionsContent(context: PageContext): Promise<any> {
    return { message: 'Existing connections for user: ' + context.user.id };
  }

  private async getAgentListContent(context: PageContext): Promise<any> {
    return { message: 'Agent list for user: ' + context.user.id };
  }

  private async getDeploymentStatusContent(context: PageContext): Promise<any> {
    return { message: 'Deployment status for user: ' + context.user.id };
  }

  private async getOverviewMetricsContent(context: PageContext): Promise<any> {
    return { message: 'Overview metrics for user: ' + context.user.id };
  }

  private async getHealthStatusContent(context: PageContext): Promise<any> {
    return { message: 'Health status for user: ' + context.user.id };
  }

  private async getApiConfigurationContent(context: PageContext): Promise<any> {
    return { message: 'API configuration for user: ' + context.user.id };
  }

  private async getUserPreferencesContent(context: PageContext): Promise<any> {
    return { message: 'User preferences for user: ' + context.user.id };
  }

  // Helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const langChainIntegrationPage = new LangChainIntegrationPage();
