/**
 * LangChain Routes - Page Level Implementation
 * Complete page-level component that represents the final user interface
 * Combines all Atomic Design components into a cohesive API experience
 */

import { Router } from 'express';
import { langChainApiTemplate } from '../services/templates/LangChainApiTemplate';
import { langChainIntegrationPage } from '../services/pages/LangChainIntegrationPage';

const router = Router();

/**
 * Authentication routes
 * Page-level: combines atomic auth services with molecular flow management
 */
router.get('/auth', async (req, res) => {
  await langChainIntegrationPage.renderAuthPage(req, res);
});

router.post('/auth/:provider', async (req, res) => {
  const { provider } = req.params;
  const { scopes } = req.body;
  await langChainApiTemplate.handleAuthTemplate(req, res, provider, scopes);
});

router.get('/auth/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  await langChainApiTemplate.handleCallbackTemplate(req, res, provider);
});

/**
 * Agent management routes
 * Page-level: combines atomic agent services with molecular connection management
 */
router.get('/agents', async (req, res) => {
  await langChainIntegrationPage.renderAgentsPage(req, res);
});

router.post('/agents', async (req, res) => {
  await langChainApiTemplate.handleAgentTemplate(req, res, 'create');
});

router.get('/agents/:agentId', async (req, res) => {
  const { agentId } = req.params;
  await langChainApiTemplate.handleAgentTemplate(req, res, 'status', agentId);
});

router.delete('/agents/:agentId', async (req, res) => {
  const { agentId } = req.params;
  await langChainApiTemplate.handleAgentTemplate(req, res, 'delete', agentId);
});

/**
 * Integration management routes
 * Page-level: combines organism-level integration services with template-level structure
 */
router.get('/integration', async (req, res) => {
  await langChainIntegrationPage.renderAuthPage(req, res);
});

router.post('/integration/sync', async (req, res) => {
  await langChainApiTemplate.handleIntegrationTemplate(req, res, 'sync');
});

router.get('/integration/metrics', async (req, res) => {
  await langChainIntegrationPage.renderMetricsPage(req, res);
});

router.get('/integration/health', async (req, res) => {
  await langChainApiTemplate.handleIntegrationTemplate(req, res, 'health');
});

router.get('/integration/status', async (req, res) => {
  await langChainApiTemplate.handleIntegrationTemplate(req, res, 'status');
});

/**
 * Settings routes
 * Page-level: combines all components into configuration management
 */
router.get('/settings', async (req, res) => {
  await langChainIntegrationPage.renderSettingsPage(req, res);
});

/**
 * API documentation route
 * Page-level: provides complete API documentation
 */
router.get('/docs', async (req, res) => {
  const docs = {
    title: 'LangChain Integration API',
    version: '1.0.0',
    description: 'Complete LangChain integration following Atomic Design principles',
    endpoints: {
      authentication: {
        'GET /auth': 'Render authentication page',
        'POST /auth/:provider': 'Start OAuth authentication',
        'GET /auth/:provider/callback': 'Handle OAuth callback',
      },
      agents: {
        'GET /agents': 'List agents',
        'POST /agents': 'Create new agent',
        'GET /agents/:agentId': 'Get agent status',
        'DELETE /agents/:agentId': 'Delete agent',
      },
      integration: {
        'GET /integration': 'Get integration status',
        'POST /integration/sync': 'Sync integrations',
        'GET /integration/metrics': 'Get integration metrics',
        'GET /integration/health': 'Health check',
      },
      settings: {
        'GET /settings': 'Render settings page',
      },
    },
    architecture: {
      atoms: [
        'AuthService - Basic OAuth operations',
        'AgentService - Basic agent operations',
      ],
      molecules: [
        'AuthFlowManager - Complete authentication flows',
        'AgentConnectionManager - Agent connection management',
      ],
      organisms: [
        'LangChainIntegrationService - Complete integration functionality',
      ],
      templates: [
        'LangChainApiTemplate - API response structure',
      ],
      pages: [
        'LangChainIntegrationPage - Complete user experiences',
      ],
    },
  };

  res.json(docs);
});

export default router;
