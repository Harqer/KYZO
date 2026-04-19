"""
Agent-Friendly API Service - Atomic Component
Provides llms.txt standard compliance and agent-friendly documentation
Basic building block for AI agent integration
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger(__name__)


class LLMSConfig(BaseModel):
    """llms.txt configuration model"""
    project_name: str
    description: str
    version: str
    sections: Dict[str, List[Dict[str, str]]] = Field(default_factory=dict)


class DocumentationLink(BaseModel):
    """Documentation link model"""
    title: str
    url: str
    description: str
    content_type: Optional[str] = None


class AgentFriendlyServiceError(Exception):
    """Custom exception for agent-friendly service errors"""
    pass


class AgentFriendlyService:
    """
    Atomic component for agent-friendly API services
    Provides llms.txt standard compliance and documentation endpoints
    Basic building block that can't be broken down further
    """
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.config = LLMSConfig(
            project_name="Fashion Backend - LangChain Integration",
            description="Complete LangChain integration following Atomic Design principles with OAuth authentication, agent management, and AI sandbox capabilities",
            version="1.0.0",
            sections={
                "api": [],
                "documentation": [],
                "authentication": [],
                "agents": [],
                "integration": [],
                "ai_features": [],
                "monitoring": [],
                "deployment": []
            }
        )
        self._initialize_sections()
    
    def _initialize_sections(self):
        """Initialize documentation sections"""
        # API endpoints
        self.config.sections["api"] = [
            {
                "title": "API Documentation",
                "url": f"{self.base_url}/api/docs",
                "description": "Complete API documentation with OpenAPI spec"
            },
            {
                "title": "OpenAPI Schema",
                "url": f"{self.base_url}/openapi.json",
                "description": "Raw OpenAPI schema for machine processing"
            },
            {
                "title": "Health Check",
                "url": f"{self.base_url}/health",
                "description": "Application health status and dependency checks"
            }
        ]
        
        # Documentation
        self.config.sections["documentation"] = [
            {
                "title": "Full Documentation",
                "url": f"{self.base_url}/llms-full.txt",
                "description": "Complete documentation in single file"
            },
            {
                "title": "API Reference",
                "url": f"{self.base_url}/api/docs.md",
                "description": "API reference documentation in markdown"
            },
            {
                "title": "Architecture Guide",
                "url": f"{self.base_url}/docs/architecture",
                "description": "Atomic Design architecture documentation"
            }
        ]
        
        # Authentication
        self.config.sections["authentication"] = [
            {
                "title": "OAuth Providers",
                "url": f"{self.base_url}/auth/providers",
                "description": "Available OAuth authentication providers"
            },
            {
                "title": "Authentication Flow",
                "url": f"{self.base_url}/auth/flow",
                "description": "Complete OAuth authentication flow documentation"
            },
            {
                "title": "Token Management",
                "url": f"{self.base_url}/auth/tokens",
                "description": "OAuth token management and refresh"
            }
        ]
        
        # Agents
        self.config.sections["agents"] = [
            {
                "title": "Agent Management",
                "url": f"{self.base_url}/agents",
                "description": "LangChain agent creation and management"
            },
            {
                "title": "Agent Connections",
                "url": f"{self.base_url}/agents/connections",
                "description": "Agent connection management with OAuth"
            },
            {
                "title": "Agent Deployments",
                "url": f"{self.base_url}/agents/deployments",
                "description": "Agent deployment and status monitoring"
            }
        ]
        
        # Integration
        self.config.sections["integration"] = [
            {
                "title": "Integration Status",
                "url": f"{self.base_url}/integration/status",
                "description": "Overall integration status and health"
            },
            {
                "title": "Integration Metrics",
                "url": f"{self.base_url}/integration/metrics",
                "description": "Performance metrics and usage statistics"
            },
            {
                "title": "Integration Sync",
                "url": f"{self.base_url}/integration/sync",
                "description": "Synchronize integrations with external services"
            }
        ]
        
        # AI Features
        self.config.sections["ai_features"] = [
            {
                "title": "AI Sandbox",
                "url": f"{self.base_url}/ai/sandbox",
                "description": "Secure AI code execution sandbox"
            },
            {
                "title": "AI Gateway",
                "url": f"{self.base_url}/ai/gateway",
                "description": "Vercel AI Gateway integration for model access"
            },
            {
                "title": "Code Generation",
                "url": f"{self.base_url}/ai/generate",
                "description": "AI-powered code generation and assistance"
            }
        ]
        
        # Monitoring
        self.config.sections["monitoring"] = [
            {
                "title": "System Metrics",
                "url": f"{self.base_url}/metrics/system",
                "description": "System performance and resource metrics"
            },
            {
                "title": "API Metrics",
                "url": f"{self.base_url}/metrics/api",
                "description": "API performance and usage metrics"
            },
            {
                "title": "Error Tracking",
                "url": f"{self.base_url}/metrics/errors",
                "description": "Error tracking and alerting"
            }
        ]
        
        # Deployment
        self.config.sections["deployment"] = [
            {
                "title": "Docker Configuration",
                "url": f"{self.base_url}/deployment/docker",
                "description": "Docker container configuration and deployment"
            },
            {
                "title": "Environment Setup",
                "url": f"{self.base_url}/deployment/environment",
                "description": "Environment configuration and setup"
            },
            {
                "title": "CI/CD Pipeline",
                "url": f"{self.base_url}/deployment/cicd",
                "description": "Continuous integration and deployment pipeline"
            }
        ]
    
    def generate_llms_txt(self) -> str:
        """
        Generate llms.txt content following the standard
        Returns plain text content for agent consumption
        """
        try:
            lines = []
            
            # Header with project name
            lines.append(f"# {self.config.project_name}")
            
            # Summary in blockquote
            lines.append(f"> {self.config.description}")
            
            # Description paragraph
            lines.append("")
            lines.append(f"{self.config.description} Version {self.config.version}.")
            lines.append("")
            
            # Generate sections
            for section_name, links in self.config.sections.items():
                if not links:
                    continue
                    
                lines.append(f"## {section_name.title()}")
                lines.append("")
                
                for link in links:
                    title = link.get("title", "")
                    url = link.get("url", "")
                    description = link.get("description", "")
                    
                    if title and url:
                        lines.append(f"- [{title}]({url}): {description}")
                
                lines.append("")
            
            return "\n".join(lines)
            
        except Exception as e:
            logger.error("Failed to generate llms.txt", error=str(e))
            raise AgentFriendlyServiceError(f"Failed to generate llms.txt: {str(e)}")
    
    def generate_llms_full_txt(self) -> str:
        """
        Generate llms-full.txt with complete documentation
        Returns comprehensive documentation in single file
        """
        try:
            lines = []
            
            # Header
            lines.append(f"# {self.config.project_name}")
            lines.append(f"> {self.config.description}")
            lines.append("")
            lines.append(f"**Version:** {self.config.version}")
            lines.append(f"**Generated:** {datetime.now(timezone.utc).isoformat()}")
            lines.append("")
            
            # Table of contents
            lines.append("## Table of Contents")
            lines.append("")
            for section_name in self.config.sections.keys():
                if self.config.sections[section_name]:
                    lines.append(f"- [{section_name.title()}](#{section_name.lower().replace(' ', '-')})")
            lines.append("")
            
            # Full documentation sections
            for section_name, links in self.config.sections.items():
                if not links:
                    continue
                    
                lines.append(f"## {section_name.title()}")
                lines.append("")
                
                for link in links:
                    title = link.get("title", "")
                    url = link.get("url", "")
                    description = link.get("description", "")
                    content_type = link.get("content_type", "")
                    
                    lines.append(f"### {title}")
                    lines.append("")
                    lines.append(f"**URL:** {url}")
                    if content_type:
                        lines.append(f"**Content Type:** {content_type}")
                    lines.append("")
                    lines.append(f"{description}")
                    lines.append("")
                    lines.append(f"[Access {title}]({url})")
                    lines.append("")
            
            # Additional information
            lines.append("## Additional Information")
            lines.append("")
            lines.append("### Atomic Design Architecture")
            lines.append("")
            lines.append("This API follows Brad Frost's Atomic Design methodology:")
            lines.append("")
            lines.append("- **Atoms:** Basic building blocks (AuthService, AgentService)")
            lines.append("- **Molecules:** Groups of atoms (AuthFlowManager, AgentConnectionManager)")
            lines.append("- **Organisms:** Complex components (LangChainIntegrationService)")
            lines.append("- **Templates:** Page structure (LangChainApiTemplate)")
            lines.append("- **Pages:** Complete experiences (LangChainIntegrationPage)")
            lines.append("")
            
            lines.append("### AI Integration Features")
            lines.append("")
            lines.append("- **AI Sandbox:** Secure code execution environment")
            lines.append("- **AI Gateway:** Unified model access through Vercel")
            lines.append("- **Agent-Friendly APIs:** llms.txt standard compliance")
            lines.append("- **Code Generation:** AI-powered development assistance")
            lines.append("")
            
            lines.append("### Security & Performance")
            lines.append("")
            lines.append("- **Rate Limiting:** Configurable request limits")
            lines.append("- **Security Headers:** CSP, HSTS, XSS protection")
            lines.append("- **CORS:** Cross-origin resource sharing")
            lines.append("- **Authentication:** JWT-based auth with OAuth")
            lines.append("- **Monitoring:** Structured logging and metrics")
            lines.append("")
            
            return "\n".join(lines)
            
        except Exception as e:
            logger.error("Failed to generate llms-full.txt", error=str(e))
            raise AgentFriendlyServiceError(f"Failed to generate llms-full.txt: {str(e)}")
    
    def generate_api_docs_md(self) -> str:
        """
        Generate API documentation in markdown format
        Returns detailed API documentation for developers and agents
        """
        try:
            lines = []
            
            # Header
            lines.append(f"# {self.config.project_name} API Documentation")
            lines.append("")
            lines.append(f"{self.config.description}")
            lines.append("")
            lines.append(f"**Version:** {self.config.version}")
            lines.append(f"**Base URL:** {self.base_url}")
            lines.append("")
            
            # Authentication section
            lines.append("## Authentication")
            lines.append("")
            lines.append("This API uses OAuth 2.0 for authentication. Supported providers:")
            lines.append("")
            lines.append("- Google OAuth")
            lines.append("- GitHub OAuth")
            lines.append("- Microsoft OAuth")
            lines.append("- Slack OAuth")
            lines.append("")
            lines.append("### Authentication Flow")
            lines.append("")
            lines.append("1. Initiate OAuth with `/auth/{provider}`")
            lines.append("2. Redirect user to OAuth provider")
            lines.append("3. Handle callback at `/auth/{provider}/callback`")
            lines.append("4. Exchange code for access token")
            lines.append("5. Use token for authenticated requests")
            lines.append("")
            
            # API endpoints
            lines.append("## API Endpoints")
            lines.append("")
            
            # Group endpoints by category
            endpoint_categories = {
                "Authentication": [
                    {
                        "method": "GET",
                        "path": "/auth",
                        "description": "Render authentication page"
                    },
                    {
                        "method": "POST",
                        "path": "/auth/{provider}",
                        "description": "Start OAuth authentication"
                    },
                    {
                        "method": "GET",
                        "path": "/auth/{provider}/callback",
                        "description": "Handle OAuth callback"
                    }
                ],
                "Agents": [
                    {
                        "method": "GET",
                        "path": "/agents",
                        "description": "List agents"
                    },
                    {
                        "method": "POST",
                        "path": "/agents",
                        "description": "Create new agent"
                    },
                    {
                        "method": "GET",
                        "path": "/agents/{agent_id}",
                        "description": "Get agent status"
                    },
                    {
                        "method": "DELETE",
                        "path": "/agents/{agent_id}",
                        "description": "Delete agent"
                    }
                ],
                "Integration": [
                    {
                        "method": "GET",
                        "path": "/integration",
                        "description": "Get integration status"
                    },
                    {
                        "method": "POST",
                        "path": "/integration/sync",
                        "description": "Sync integrations"
                    },
                    {
                        "method": "GET",
                        "path": "/integration/metrics",
                        "description": "Get integration metrics"
                    },
                    {
                        "method": "GET",
                        "path": "/integration/health",
                        "description": "Health check"
                    }
                ],
                "AI Features": [
                    {
                        "method": "POST",
                        "path": "/ai/sandbox/execute",
                        "description": "Execute code in secure sandbox"
                    },
                    {
                        "method": "POST",
                        "path": "/ai/gateway/chat",
                        "description": "Chat with AI models"
                    },
                    {
                        "method": "POST",
                        "path": "/ai/generate/code",
                        "description": "Generate code with AI"
                    }
                ]
            }
            
            for category, endpoints in endpoint_categories.items():
                lines.append(f"### {category}")
                lines.append("")
                
                for endpoint in endpoints:
                    method = endpoint["method"]
                    path = endpoint["path"]
                    description = endpoint["description"]
                    
                    lines.append(f"**{method} {path}**")
                    lines.append("")
                    lines.append(f"{description}")
                    lines.append("")
            
            # Error handling
            lines.append("## Error Handling")
            lines.append("")
            lines.append("The API uses standard HTTP status codes:")
            lines.append("")
            lines.append("- `200 OK`: Request successful")
            lines.append("- `400 Bad Request`: Invalid request parameters")
            lines.append("- `401 Unauthorized`: Authentication required")
            lines.append("- `403 Forbidden`: Insufficient permissions")
            lines.append("- `404 Not Found`: Resource not found")
            lines.append("- `429 Too Many Requests`: Rate limit exceeded")
            lines.append("- `500 Internal Server Error`: Server error")
            lines.append("")
            
            # Rate limiting
            lines.append("## Rate Limiting")
            lines.append("")
            lines.append("API requests are rate limited to prevent abuse:")
            lines.append("")
            lines.append("- **Default limit:** 100 requests per minute")
            lines.append("- **Per-user limits:** Based on authentication")
            lines.append("- **Burst allowance:** Temporary burst capacity")
            lines.append("")
            
            # SDK and libraries
            lines.append("## SDK and Libraries")
            lines.append("")
            lines.append("Official SDKs are available for:")
            lines.append("")
            lines.append("- **Python:** FastAPI with async support")
            lines.append("- **JavaScript/TypeScript:** Coming soon")
            lines.append("- **Other languages:** Community contributions welcome")
            lines.append("")
            
            return "\n".join(lines)
            
        except Exception as e:
            logger.error("Failed to generate API docs", error=str(e))
            raise AgentFriendlyServiceError(f"Failed to generate API docs: {str(e)}")
    
    def add_documentation_link(self, section: str, link: DocumentationLink) -> None:
        """
        Add a documentation link to a specific section
        Atomic operation: adds a single link
        """
        try:
            if section not in self.config.sections:
                self.config.sections[section] = []
            
            self.config.sections[section].append({
                "title": link.title,
                "url": link.url,
                "description": link.description,
                "content_type": link.content_type
            })
            
            logger.info("Added documentation link", section=section, title=link.title)
            
        except Exception as e:
            logger.error("Failed to add documentation link", section=section, error=str(e))
            raise AgentFriendlyServiceError(f"Failed to add documentation link: {str(e)}")
    
    def remove_documentation_link(self, section: str, title: str) -> bool:
        """
        Remove a documentation link from a specific section
        Atomic operation: removes a single link
        """
        try:
            if section not in self.config.sections:
                return False
            
            original_length = len(self.config.sections[section])
            self.config.sections[section] = [
                link for link in self.config.sections[section]
                if link.get("title") != title
            ]
            
            removed = len(self.config.sections[section]) < original_length
            if removed:
                logger.info("Removed documentation link", section=section, title=title)
            
            return removed
            
        except Exception as e:
            logger.error("Failed to remove documentation link", section=section, error=str(e))
            raise AgentFriendlyServiceError(f"Failed to remove documentation link: {str(e)}")
    
    def get_section_links(self, section: str) -> List[Dict[str, str]]:
        """
        Get all links in a specific section
        Atomic operation: retrieves section data
        """
        try:
            return self.config.sections.get(section, [])
        except Exception as e:
            logger.error("Failed to get section links", section=section, error=str(e))
            raise AgentFriendlyServiceError(f"Failed to get section links: {str(e)}")
    
    def update_config(self, **kwargs) -> None:
        """
        Update service configuration
        Atomic operation: updates configuration
        """
        try:
            for key, value in kwargs.items():
                if hasattr(self.config, key):
                    setattr(self.config, key, value)
            
            logger.info("Updated agent-friendly service configuration", updates=list(kwargs.keys()))
            
        except Exception as e:
            logger.error("Failed to update configuration", error=str(e))
            raise AgentFriendlyServiceError(f"Failed to update configuration: {str(e)}")


# Singleton instance
agent_friendly_service = AgentFriendlyService()
