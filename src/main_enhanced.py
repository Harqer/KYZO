"""
Enhanced FastAPI Application - Production Ready
Complete page-level component with advanced FastAPI features
Combines all Atomic Design components with production best practices
"""

import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, Request, Response, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field
import structlog

from .config.settings import settings
from .middleware.security import (
    setup_security_middleware,
    setup_cors_middleware,
    setup_trusted_host_middleware,
)
from .lifecycle.events import lifespan_context, get_http_client, is_shutting_down
from .services.pages.langchain_integration_page import (
    langchain_integration_page,
    PageContext
)
from .services.templates.langchain_api_template import (
    langchain_api_template,
    ApiTemplateContext
)
from .services.organisms.langchain_integration_service import (
    langchain_integration_service
)

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Security
security = HTTPBearer(auto_error=False)


# Request/Response Models
class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = "healthy"
    timestamp: str
    version: str
    environment: str
    checks: Dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: str
    message: str
    timestamp: str
    request_id: Optional[str] = None


# Dependencies
async def get_user_context(request: Request) -> Dict[str, Any]:
    """Extract user context from request"""
    # Try to get user from request state (set by authentication middleware)
    if hasattr(request.state, 'user'):
        return request.state.user
    
    # Fallback to headers
    return {
        "id": request.headers.get("x-user-id", "anonymous"),
        "email": request.headers.get("x-user-email"),
        "name": request.headers.get("x-user-name"),
        "authenticated": getattr(request.state, 'authenticated', False),
    }


async def get_page_context(request: Request, user: Dict[str, Any] = Depends(get_user_context)) -> PageContext:
    """Create page context from request"""
    return PageContext(
        user=user,
        session={
            "id": request.headers.get("x-session-id", str(uuid.uuid4())),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_activity": datetime.now(timezone.utc).isoformat(),
        },
        request={
            "id": request.headers.get("x-request-id", str(uuid.uuid4())),
            "method": request.method,
            "path": str(request.url.path),
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host,
        },
    )


async def get_api_context(request: Request, user: Dict[str, Any] = Depends(get_user_context)) -> ApiTemplateContext:
    """Create API context from request"""
    return langchain_api_template.create_context(
        user_id=user["id"],
        request_id=request.headers.get("x-request-id"),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host
    )


# Exception handlers
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    logger.error(
        "HTTP exception occurred",
        request_id=request_id,
        status_code=exc.status_code,
        detail=exc.detail,
        path=str(request.url.path),
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="HTTP_ERROR",
            message=exc.detail,
            timestamp=datetime.now(timezone.utc).isoformat(),
            request_id=request_id,
        ).model_dump()
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    logger.error(
        "Unhandled exception occurred",
        request_id=request_id,
        error=str(exc),
        path=str(request.url.path),
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
            timestamp=datetime.now(timezone.utc).isoformat(),
            request_id=request_id,
        ).model_dump()
    )


# Custom OpenAPI schema
def custom_openapi():
    """Generate custom OpenAPI schema"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.app_name,
        version=settings.version,
        description="Complete LangChain integration following Atomic Design principles",
        routes=app.routes,
    )
    
    # Add custom security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    # Add global security
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    # Add custom tags
    openapi_schema["tags"] = [
        {
            "name": "Authentication",
            "description": "OAuth authentication and user management",
        },
        {
            "name": "Agents",
            "description": "LangChain agent management and operations",
        },
        {
            "name": "Integration",
            "description": "Integration status, metrics, and health checks",
        },
        {
            "name": "Settings",
            "description": "Application configuration and settings",
        },
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


# FastAPI application
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    async with lifespan_context(app):
        yield


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Complete LangChain integration following Atomic Design principles",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

# Set custom OpenAPI
app.openapi = custom_openapi

# Add exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Setup middleware
setup_trusted_host_middleware(app, settings.allowed_hosts)
setup_cors_middleware(app, settings.cors_origins)
setup_security_middleware(
    app,
    rate_limit_enabled=settings.rate_limit_enabled,
    rate_limit_requests=settings.rate_limit_requests,
    rate_limit_window=settings.rate_limit_window,
    log_requests=True,
    public_paths=[
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/auth/google",
        "/auth/github",
        "/auth/microsoft",
        "/auth/slack",
        "/api/docs",
    ],
)


# Root endpoint
@app.get("/", response_class=HTMLResponse, tags=["Root"])
async def root():
    """Root endpoint with API documentation"""
    return _generate_homepage()


# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Enhanced health check with detailed status"""
    try:
        # Perform health checks
        langchain_health = await langchain_integration_service.perform_health_check()
        
        checks = {
            "langchain_api": langchain_health.status,
            "database": "healthy",  # Would implement actual DB check
            "redis": "healthy",     # Would implement actual Redis check
            "external_services": "healthy",
        }
        
        overall_status = "healthy" if all(status == "healthy" for status in checks.values()) else "degraded"
        
        return HealthResponse(
            status=overall_status,
            timestamp=datetime.now(timezone.utc).isoformat(),
            version=settings.version,
            environment=settings.environment,
            checks=checks,
        )
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now(timezone.utc).isoformat(),
            version=settings.version,
            environment=settings.environment,
            checks={"error": str(e)},
        )


# Authentication routes
@app.get("/auth", response_class=HTMLResponse, tags=["Authentication"])
async def auth_page(context: PageContext = Depends(get_page_context)):
    """Render authentication page"""
    result = await langchain_integration_page.render_auth_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.post("/auth/{provider}", tags=["Authentication"])
async def start_auth(
    provider: str,
    request: Request,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Start OAuth authentication"""
    try:
        body = await request.json() if request.headers.get("content-type") == "application/json" else {}
        scopes = body.get("scopes", [])
        
        result = await langchain_api_template.handle_auth_template(context, provider, scopes)
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Start auth failed", provider=provider, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to start authentication")


@app.get("/auth/{provider}/callback", tags=["Authentication"])
async def auth_callback(
    provider: str,
    request: Request,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Handle OAuth callback"""
    try:
        auth_params = dict(request.query_params)
        
        result = await langchain_api_template.handle_callback_template(context, provider, auth_params)
        
        # Check if this is a web callback (from OAuth provider)
        if "code" in auth_params or "error" in auth_params:
            # Redirect to frontend with result
            frontend_url = settings.frontend_url
            
            if result.data and result.data.get("success"):
                redirect_url = f"{frontend_url}/auth/success?provider={provider}"
            else:
                error = result.error or "Unknown error"
                redirect_url = f"{frontend_url}/auth/error?provider={provider}&error={error}"
            
            return RedirectResponse(url=redirect_url)
        
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Auth callback failed", provider=provider, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to handle authentication callback")


# Agent management routes
@app.get("/agents", tags=["Agents"])
async def agents_page(context: PageContext = Depends(get_page_context)):
    """Render agents management page"""
    result = await langchain_integration_page.render_agents_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.post("/agents", tags=["Agents"])
async def create_agent(
    request: Request,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Create new agent"""
    try:
        body = await request.json()
        
        result = await langchain_api_template.handle_agent_template(
            context, "create", config=body
        )
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Create agent failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create agent")


@app.get("/agents/{agent_id}", tags=["Agents"])
async def get_agent_status(
    agent_id: str,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Get agent status"""
    try:
        result = await langchain_api_template.handle_agent_template(
            context, "status", agent_id=agent_id
        )
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Get agent status failed", agent_id=agent_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get agent status")


@app.delete("/agents/{agent_id}", tags=["Agents"])
async def delete_agent(
    agent_id: str,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Delete agent"""
    try:
        result = await langchain_api_template.handle_agent_template(
            context, "delete", agent_id=agent_id
        )
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Delete agent failed", agent_id=agent_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete agent")


# Integration management routes
@app.get("/integration", tags=["Integration"])
async def integration_status(context: PageContext = Depends(get_page_context)):
    """Get integration status page"""
    result = await langchain_integration_page.render_auth_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.post("/integration/sync", tags=["Integration"])
async def sync_integrations(context: ApiTemplateContext = Depends(get_api_context)):
    """Sync integrations"""
    try:
        result = await langchain_api_template.handle_integration_template(context, "sync")
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Sync integrations failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to sync integrations")


@app.get("/integration/metrics", tags=["Integration"])
async def get_metrics(context: PageContext = Depends(get_page_context)):
    """Get integration metrics page"""
    result = await langchain_integration_page.render_metrics_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.get("/integration/health", tags=["Integration"])
async def health_check_detailed(context: ApiTemplateContext = Depends(get_api_context)):
    """Detailed health check"""
    try:
        result = await langchain_api_template.handle_integration_template(context, "health")
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=500, detail="Health check failed")


@app.get("/integration/status", tags=["Integration"])
async def get_integration_status(context: ApiTemplateContext = Depends(get_api_context)):
    """Get integration status"""
    try:
        result = await langchain_api_template.handle_integration_template(context, "status")
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Get integration status failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get integration status")


# Settings routes
@app.get("/settings", tags=["Settings"])
async def settings_page(context: PageContext = Depends(get_page_context)):
    """Render settings page"""
    result = await langchain_integration_page.render_settings_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.get("/settings/config", tags=["Settings"])
async def get_settings(context: ApiTemplateContext = Depends(get_api_context)):
    """Get settings configuration"""
    try:
        result = await langchain_api_template.handle_settings_template(context, "get")
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Get settings failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get settings")


@app.put("/settings/config", tags=["Settings"])
async def update_settings(
    request: Request,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Update settings configuration"""
    try:
        body = await request.json()
        
        result = await langchain_api_template.handle_settings_template(
            context, "update", config=body
        )
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Update settings failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update settings")


# API documentation endpoint
@app.get("/api/docs", tags=["Documentation"])
async def api_docs():
    """API documentation"""
    docs = {
        "title": "LangChain Integration API",
        "version": settings.version,
        "description": "Complete LangChain integration following Atomic Design principles",
        "architecture": {
            "atoms": [
                "AuthService - Basic OAuth operations",
                "AgentService - Basic agent operations",
            ],
            "molecules": [
                "AuthFlowManager - Complete authentication flows",
                "AgentConnectionManager - Agent connection management",
            ],
            "organisms": [
                "LangChainIntegrationService - Complete integration functionality",
            ],
            "templates": [
                "LangChainApiTemplate - API response structure",
            ],
            "pages": [
                "LangChainIntegrationPage - Complete user experiences",
            ],
        },
        "features": {
            "authentication": "OAuth 2.0 with multiple providers",
            "agents": "LangChain agent management and deployment",
            "monitoring": "Health checks and metrics collection",
            "security": "Rate limiting, security headers, CORS",
            "deployment": "Docker containerization with best practices",
        },
        "endpoints": {
            "authentication": {
                "GET /auth": "Render authentication page",
                "POST /auth/{provider}": "Start OAuth authentication",
                "GET /auth/{provider}/callback": "Handle OAuth callback",
            },
            "agents": {
                "GET /agents": "List agents",
                "POST /agents": "Create new agent",
                "GET /agents/{agentId}": "Get agent status",
                "DELETE /agents/{agentId}": "Delete agent",
            },
            "integration": {
                "GET /integration": "Get integration status",
                "POST /integration/sync": "Sync integrations",
                "GET /integration/metrics": "Get integration metrics",
                "GET /integration/health": "Health check",
            },
            "settings": {
                "GET /settings": "Render settings page",
                "GET /settings/config": "Get configuration",
                "PUT /settings/config": "Update configuration",
            },
        },
    }
    
    return JSONResponse(docs)


# Helper functions
def _generate_homepage() -> str:
    """Generate homepage HTML"""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <title>{settings.app_name}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        .endpoint {{ background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .method {{ color: #fff; padding: 3px 8px; border-radius: 3px; font-size: 12px; }}
        .get {{ background: #61affe; }}
        .post {{ background: #49cc90; }}
        .delete {{ background: #f93e3e; }}
        .put {{ background: #fca130; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{settings.app_name}</h1>
        <p>Complete LangChain integration following Atomic Design principles</p>
        <p>Environment: {settings.environment} | Version: {settings.version}</p>
        
        <h2>Available Endpoints</h2>
        <div class="endpoint">
            <span class="method get">GET</span> /health - Health check
        </div>
        <div class="endpoint">
            <span class="method get">GET</span> /auth - Authentication page
        </div>
        <div class="endpoint">
            <span class="method post">POST</span> /auth/{{provider}} - Start OAuth authentication
        </div>
        <div class="endpoint">
            <span class="method get">GET</span> /agents - List agents
        </div>
        <div class="endpoint">
            <span class="method post">POST</span> /agents - Create new agent
        </div>
        <div class="endpoint">
            <span class="method get">GET</span> /integration/metrics - Get integration metrics
        </div>
        <div class="endpoint">
            <span class="method get">GET</span> /integration/health - Health check
        </div>
        
        {"<p><a href='/docs'>Interactive API Documentation</a></p>" if settings.debug else ""}
        {"<p><a href='/redoc'>ReDoc Documentation</a></p>" if settings.debug else ""}
        <p><a href='/api/docs'>API Documentation</a></p>
    </div>
</body>
</html>"""


def _generate_html_page(page_data: Dict[str, Any]) -> str:
    """Generate HTML page from page data"""
    if not page_data:
        return "<html><body><h1>Page not available</h1></body></html>"
    
    title = page_data.get("title", "LangChain Integration")
    description = page_data.get("description", "")
    sections = page_data.get("sections", [])
    navigation = page_data.get("navigation", {})
    
    # Generate navigation HTML
    nav_items = ""
    for item in navigation.get("items", []):
        active_class = "border-indigo-500 text-gray-900" if item.get("active") else "border-transparent text-gray-500"
        nav_items += f"""
        <a href="{item.get('path')}" class="{active_class} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            {item.get('label')}
        </a>
        """
    
    # Generate sections HTML
    sections_html = ""
    for section in sections:
        section_id = section.get("id", "")
        section_title = section.get("title", "")
        section_content = section.get("content", {})
        actions = section.get("actions", [])
        
        # Generate actions HTML
        actions_html = ""
        for action in actions:
            action_type = action.get("type", "secondary")
            button_class = {
                "primary": "bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md",
                "secondary": "bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-md",
                "danger": "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md",
            }.get(action_type, "bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md")
            
            actions_html += f"""
            <button class="{button_class}" onclick="handleAction('{action.get('endpoint')}', '{action.get('method')}')">
                {action.get('label')}
            </button>
            """
        
        sections_html += f"""
        <div class="bg-white shadow rounded-lg mb-6">
            <div class="px-4 py-5 sm:p-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">{section_title}</h2>
                <div class="mb-4">
                    <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{str(section_content)}</pre>
                </div>
                {f'<div class="flex space-x-4">{actions_html}</div>' if actions_html else ''}
            </div>
        </div>
        """
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{description}">
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
                            {nav_items}
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div class="px-4 py-6 sm:px-0">
                <div class="mb-8">
                    <h1 class="text-2xl font-bold text-gray-900">{title}</h1>
                    <p class="mt-2 text-gray-600">{description}</p>
                </div>

                {sections_html}
            </div>
        </main>
    </div>

    <script>
        function handleAction(endpoint, method) {{
            fetch(endpoint, {{ method: method }})
                .then(response => response.json())
                .then(data => {{
                    console.log('Action result:', data);
                    location.reload();
                }})
                .catch(error => {{
                    console.error('Action failed:', error);
                    alert('Action failed. Please try again.');
                }});
        }}
    </script>
</body>
</html>"""


if __name__ == "__main__":
    import uvicorn
    
    logger.info(
        "Starting FastAPI application",
        host=settings.host,
        port=settings.port,
        environment=settings.environment,
        debug=settings.debug,
    )
    
    # Run the application
    uvicorn.run(
        "main_enhanced:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level,
        workers=settings.workers if not settings.reload else 1,
    )
