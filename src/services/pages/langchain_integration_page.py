"""
LangChain Integration Page - Page Component
Complete page-level component that represents the final UI
Combines templates with actual content to create complete user experiences
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from ..templates.langchain_api_template import (
    LangChainApiTemplate,
    ApiTemplateContext,
    ApiResponse,
    AuthTemplateData,
    AgentTemplateData
)
from ..organisms.langchain_integration_service import (
    LangChainIntegrationService,
    UserIntegration,
    IntegrationMetrics
)
from ..molecules.auth_flow_manager import AuthFlowConfig
from ..molecules.agent_connection_manager import AgentManagementConfig


class PageContext(BaseModel):
    """Page context model"""
    user: Dict[str, Any] = Field(default_factory=dict)
    session: Dict[str, Any] = Field(default_factory=dict)
    request: Dict[str, Any] = Field(default_factory=dict)


class PageSection(BaseModel):
    """Page section model"""
    id: str
    type: str  # auth, agents, metrics, settings
    title: str
    content: Any
    actions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class PageNavigation(BaseModel):
    """Page navigation model"""
    current: str
    items: List[Dict[str, Any]] = Field(default_factory=list)


class PageMetadata(BaseModel):
    """Page metadata model"""
    title: str
    description: str
    keywords: List[str] = Field(default_factory=list)
    last_updated: str
    version: str = "1.0.0"


class PageData(BaseModel):
    """Complete page data model"""
    title: str
    description: str
    sections: List[PageSection] = Field(default_factory=list)
    navigation: PageNavigation
    metadata: PageMetadata


class LangChainIntegrationPageError(Exception):
    """Custom exception for page errors"""
    pass


class LangChainIntegrationPage:
    """
    Page-level LangChain integration service
    Represents complete user experiences with actual content
    Places templates into the context of real user scenarios
    """
    
    def __init__(
        self,
        api_template: Optional[LangChainApiTemplate] = None,
        integration_service: Optional[LangChainIntegrationService] = None
    ):
        self.api_template = api_template or LangChainApiTemplate()
        self.integration_service = integration_service or LangChainIntegrationService()
    
    async def render_auth_page(self, context: PageContext) -> Dict[str, Any]:
        """
        Render authentication page
        Page-level: combines auth template with user-specific content
        """
        try:
            api_context = self.api_template.create_context(
                user_id=context.user.get("id", "anonymous"),
                request_id=context.request.get("id"),
                user_agent=context.request.get("user_agent"),
                ip_address=context.request.get("ip_address")
            )
            
            # Get auth provider content
            auth_response = await self.api_template.handle_auth_template(
                api_context,
                "google",  # Default provider
                ["read", "write"]
            )
            
            # Get existing connections
            existing_response = await self.api_template.handle_integration_template(
                api_context,
                "status"
            )
            
            page_data = PageData(
                title="Authentication - LangChain Integration",
                description="Connect your accounts with LangChain providers",
                sections=[
                    PageSection(
                        id="auth-providers",
                        type="auth",
                        title="Available Providers",
                        content=auth_response.data if auth_response.success else {"error": auth_response.error},
                        actions=[
                            {
                                "id": "connect-google",
                                "label": "Connect Google",
                                "type": "primary",
                                "endpoint": "/api/auth/google",
                                "method": "POST",
                                "requires_auth": True,
                            },
                            {
                                "id": "connect-github",
                                "label": "Connect GitHub",
                                "type": "secondary",
                                "endpoint": "/api/auth/github",
                                "method": "POST",
                                "requires_auth": True,
                            },
                        ],
                    ),
                    PageSection(
                        id="existing-connections",
                        type="auth",
                        title="Existing Connections",
                        content=existing_response.data if existing_response.success else {"error": existing_response.error},
                        actions=[
                            {
                                "id": "refresh-connections",
                                "label": "Refresh All",
                                "type": "secondary",
                                "endpoint": "/api/integration/sync",
                                "method": "POST",
                                "requires_auth": True,
                            },
                        ],
                    ),
                ],
                navigation=self._create_navigation("auth"),
                metadata=self._create_page_metadata("Authentication"),
            )
            
            return self._render_page_response(page_data, context)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "page": None,
            }
    
    async def render_agents_page(self, context: PageContext) -> Dict[str, Any]:
        """
        Render agents management page
        Page-level: combines agent template with deployment content
        """
        try:
            api_context = self.api_template.create_context(
                user_id=context.user.get("id", "anonymous"),
                request_id=context.request.get("id"),
                user_agent=context.request.get("user_agent"),
                ip_address=context.request.get("ip_address")
            )
            
            # Get agent list
            agents_response = await self.api_template.handle_agent_template(
                api_context,
                "list"
            )
            
            # Get deployment status
            metrics_response = await self.api_template.handle_integration_template(
                api_context,
                "metrics"
            )
            
            page_data = PageData(
                title="Agent Management - LangChain Integration",
                description="Manage your LangChain agents and deployments",
                sections=[
                    PageSection(
                        id="agent-list",
                        type="agents",
                        title="Your Agents",
                        content=agents_response.data if agents_response.success else {"error": agents_response.error},
                        actions=[
                            {
                                "id": "create-agent",
                                "label": "Create New Agent",
                                "type": "primary",
                                "endpoint": "/api/agents",
                                "method": "POST",
                                "requires_auth": True,
                            },
                        ],
                    ),
                    PageSection(
                        id="deployment-status",
                        type="agents",
                        title="Deployment Status",
                        content=metrics_response.data if metrics_response.success else {"error": metrics_response.error},
                        actions=[
                            {
                                "id": "refresh-deployments",
                                "label": "Refresh Status",
                                "type": "secondary",
                                "endpoint": "/api/integration/metrics",
                                "method": "GET",
                                "requires_auth": True,
                            },
                        ],
                    ),
                ],
                navigation=self._create_navigation("agents"),
                metadata=self._create_page_metadata("Agent Management"),
            )
            
            return self._render_page_response(page_data, context)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "page": None,
            }
    
    async def render_metrics_page(self, context: PageContext) -> Dict[str, Any]:
        """
        Render metrics dashboard page
        Page-level: combines metrics template with analytics content
        """
        try:
            api_context = self.api_template.create_context(
                user_id=context.user.get("id", "anonymous"),
                request_id=context.request.get("id"),
                user_agent=context.request.get("user_agent"),
                ip_address=context.request.get("ip_address")
            )
            
            # Get overview metrics
            metrics_response = await self.api_template.handle_integration_template(
                api_context,
                "metrics"
            )
            
            # Get health status
            health_response = await self.api_template.handle_integration_template(
                api_context,
                "health"
            )
            
            # Get user summary
            summary_response = await self.api_template.handle_integration_template(
                api_context,
                "summary"
            )
            
            page_data = PageData(
                title="Integration Metrics - LangChain Integration",
                description="Monitor your LangChain integration performance and usage",
                sections=[
                    PageSection(
                        id="overview-metrics",
                        type="metrics",
                        title="Overview",
                        content={
                            "metrics": metrics_response.data if metrics_response.success else {"error": metrics_response.error},
                            "summary": summary_response.data if summary_response.success else {"error": summary_response.error},
                        },
                        actions=[
                            {
                                "id": "refresh-metrics",
                                "label": "Refresh Metrics",
                                "type": "secondary",
                                "endpoint": "/api/integration/metrics",
                                "method": "GET",
                                "requires_auth": True,
                            },
                        ],
                    ),
                    PageSection(
                        id="health-status",
                        type="metrics",
                        title="System Health",
                        content=health_response.data if health_response.success else {"error": health_response.error},
                        actions=[
                            {
                                "id": "run-health-check",
                                "label": "Run Health Check",
                                "type": "primary",
                                "endpoint": "/api/integration/health",
                                "method": "GET",
                                "requires_auth": True,
                            },
                        ],
                    ),
                ],
                navigation=self._create_navigation("metrics"),
                metadata=self._create_page_metadata("Integration Metrics"),
            )
            
            return self._render_page_response(page_data, context)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "page": None,
            }
    
    async def render_settings_page(self, context: PageContext) -> Dict[str, Any]:
        """
        Render settings page
        Page-level: combines settings template with configuration content
        """
        try:
            api_context = self.api_template.create_context(
                user_id=context.user.get("id", "anonymous"),
                request_id=context.request.get("id"),
                user_agent=context.request.get("user_agent"),
                ip_address=context.request.get("ip_address")
            )
            
            # Get API configuration
            config_response = await self.api_template.handle_settings_template(
                api_context,
                "get"
            )
            
            page_data = PageData(
                title="Integration Settings - LangChain Integration",
                description="Configure your LangChain integration preferences",
                sections=[
                    PageSection(
                        id="api-configuration",
                        type="settings",
                        title="API Configuration",
                        content=config_response.data if config_response.success else {"error": config_response.error},
                        actions=[
                            {
                                "id": "save-config",
                                "label": "Save Configuration",
                                "type": "primary",
                                "endpoint": "/api/settings/config",
                                "method": "PUT",
                                "requires_auth": True,
                            },
                        ],
                    ),
                    PageSection(
                        id="user-preferences",
                        type="settings",
                        title="User Preferences",
                        content={
                            "theme": "light",
                            "notifications": True,
                            "auto_sync": False,
                        },
                        actions=[
                            {
                                "id": "save-preferences",
                                "label": "Save Preferences",
                                "type": "secondary",
                                "endpoint": "/api/settings/preferences",
                                "method": "PUT",
                                "requires_auth": True,
                            },
                        ],
                    ),
                ],
                navigation=self._create_navigation("settings"),
                metadata=self._create_page_metadata("Integration Settings"),
            )
            
            return self._render_page_response(page_data, context)
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "page": None,
            }
    
    def _create_navigation(self, current: str) -> PageNavigation:
        """
        Create navigation for page
        Page-level: creates consistent navigation structure
        """
        items = [
            {"id": "auth", "label": "Authentication", "path": "/integration/auth", "active": current == "auth"},
            {"id": "agents", "label": "Agents", "path": "/integration/agents", "active": current == "agents"},
            {"id": "metrics", "label": "Metrics", "path": "/integration/metrics", "active": current == "metrics"},
            {"id": "settings", "label": "Settings", "path": "/integration/settings", "active": current == "settings"},
        ]
        
        return PageNavigation(current=current, items=items)
    
    def _create_page_metadata(self, page_type: str) -> PageMetadata:
        """
        Create page metadata
        Page-level: creates SEO and metadata information
        """
        return PageMetadata(
            title=f"{page_type} - LangChain Integration",
            description=f"Manage your {page_type.lower()} with LangChain integration",
            keywords=["langchain", "integration", page_type.lower(), "ai", "automation"],
            last_updated=datetime.now(timezone.utc).isoformat(),
            version="1.0.0",
        )
    
    def _render_page_response(self, page_data: PageData, context: PageContext) -> Dict[str, Any]:
        """
        Render complete page response
        Page-level: combines template structure with actual content
        """
        return {
            "success": True,
            "page": page_data.model_dump(),
            "context": {
                "user": context.user,
                "session_id": context.session.get("id"),
            },
        }


# Singleton instance
langchain_integration_page = LangChainIntegrationPage()
