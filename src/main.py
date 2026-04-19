"""
Main FastAPI Application - Page Level Implementation
Complete page-level component that represents the final user interface
Combines all Atomic Design components into a cohesive API experience
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel

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


# Configuration
class Settings(BaseModel):
    """Application settings"""
    app_name: str = "Fashion Backend - LangChain Integration"
    version: str = "1.0.0"
    debug: bool = False
    cors_origins: list = ["*"]
    frontend_url: str = "http://localhost:3000"


settings = Settings()


# FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Complete LangChain integration following Atomic Design principles",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency for getting user context
async def get_user_context(request: Request) -> Dict[str, Any]:
    """Extract user context from request"""
    # In a real app, this would extract from JWT token or session
    return {
        "id": request.headers.get("x-user-id", "anonymous"),
        "email": request.headers.get("x-user-email"),
        "name": request.headers.get("x-user-name"),
        "preferences": {},
    }


# Dependency for getting page context
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


# Dependency for getting API context
async def get_api_context(request: Request, user: Dict[str, Any] = Depends(get_user_context)) -> ApiTemplateContext:
    """Create API context from request"""
    return langchain_api_template.create_context(
        user_id=user["id"],
        request_id=request.headers.get("x-request-id"),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host
    )


# Root endpoint
@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with API documentation"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>LangChain Integration API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .method { color: #fff; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
            .get { background: #61affe; }
            .post { background: #49cc90; }
            .delete { background: #f93e3e; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>LangChain Integration API</h1>
            <p>Complete LangChain integration following Atomic Design principles</p>
            
            <h2>Authentication Endpoints</h2>
            <div class="endpoint">
                <span class="method get">GET</span> /auth - Authentication page
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> /auth/{provider} - Start OAuth authentication
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> /auth/{provider}/callback - Handle OAuth callback
            </div>
            
            <h2>Agent Management Endpoints</h2>
            <div class="endpoint">
                <span class="method get">GET</span> /agents - List agents
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> /agents - Create new agent
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> /agents/{agentId} - Get agent status
            </div>
            <div class="endpoint">
                <span class="method delete">DELETE</span> /agents/{agentId} - Delete agent
            </div>
            
            <h2>Integration Management Endpoints</h2>
            <div class="endpoint">
                <span class="method get">GET</span> /integration - Get integration status
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> /integration/sync - Sync integrations
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> /integration/metrics - Get integration metrics
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> /integration/health - Health check
            </div>
            
            <h2>Settings Endpoints</h2>
            <div class="endpoint">
                <span class="method get">GET</span> /settings - Get settings
            </div>
            <div class="endpoint">
                <span class="method put">PUT</span> /settings/config - Update configuration
            </div>
            
            <p><a href="/docs">Interactive API Documentation</a></p>
            <p><a href="/redoc">ReDoc Documentation</a></p>
        </div>
    </body>
    </html>
    """


# Authentication routes
@app.get("/auth")
async def auth_page(context: PageContext = Depends(get_page_context)):
    """Render authentication page"""
    result = await langchain_integration_page.render_auth_page(context)
    
    if request.accepts("html"):
        # Return HTML page
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.post("/auth/{provider}")
async def start_auth(
    provider: str,
    request: Request,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Start OAuth authentication"""
    body = await request.json() if request.headers.get("content-type") == "application/json" else {}
    scopes = body.get("scopes", [])
    
    result = await langchain_api_template.handle_auth_template(context, provider, scopes)
    return JSONResponse(result.model_dump())


@app.get("/auth/{provider}/callback")
async def auth_callback(
    provider: str,
    request: Request,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Handle OAuth callback"""
    auth_params = dict(request.query_params)
    
    result = await langchain_api_template.handle_callback_template(context, provider, auth_params)
    
    # Check if this is a web callback (from OAuth provider)
    if "code" in auth_params or "error" in auth_params:
        # Redirect to frontend with result
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        if result.data and result.data.get("success"):
            redirect_url = f"{frontend_url}/auth/success?provider={provider}"
        else:
            error = result.error or "Unknown error"
            redirect_url = f"{frontend_url}/auth/error?provider={provider}&error={error}"
        
        return RedirectResponse(url=redirect_url)
    
    return JSONResponse(result.model_dump())


# Agent management routes
@app.get("/agents")
async def agents_page(context: PageContext = Depends(get_page_context)):
    """Render agents management page"""
    result = await langchain_integration_page.render_agents_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.post("/agents")
async def create_agent(
    request: Request,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Create new agent"""
    body = await request.json()
    
    result = await langchain_api_template.handle_agent_template(
        context, "create", config=body
    )
    return JSONResponse(result.model_dump())


@app.get("/agents/{agent_id}")
async def get_agent_status(
    agent_id: str,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Get agent status"""
    result = await langchain_api_template.handle_agent_template(
        context, "status", agent_id=agent_id
    )
    return JSONResponse(result.model_dump())


@app.delete("/agents/{agent_id}")
async def delete_agent(
    agent_id: str,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Delete agent"""
    result = await langchain_api_template.handle_agent_template(
        context, "delete", agent_id=agent_id
    )
    return JSONResponse(result.model_dump())


# Integration management routes
@app.get("/integration")
async def integration_status(context: PageContext = Depends(get_page_context)):
    """Get integration status page"""
    result = await langchain_integration_page.render_auth_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.post("/integration/sync")
async def sync_integrations(context: ApiTemplateContext = Depends(get_api_context)):
    """Sync integrations"""
    result = await langchain_api_template.handle_integration_template(context, "sync")
    return JSONResponse(result.model_dump())


@app.get("/integration/metrics")
async def get_metrics(context: PageContext = Depends(get_page_context)):
    """Get integration metrics page"""
    result = await langchain_integration_page.render_metrics_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.get("/integration/health")
async def health_check(context: ApiTemplateContext = Depends(get_api_context)):
    """Health check"""
    result = await langchain_api_template.handle_integration_template(context, "health")
    return JSONResponse(result.model_dump())


@app.get("/integration/status")
async def get_integration_status(context: ApiTemplateContext = Depends(get_api_context)):
    """Get integration status"""
    result = await langchain_api_template.handle_integration_template(context, "status")
    return JSONResponse(result.model_dump())


# Settings routes
@app.get("/settings")
async def settings_page(context: PageContext = Depends(get_page_context)):
    """Render settings page"""
    result = await langchain_integration_page.render_settings_page(context)
    
    if request.accepts("html"):
        return HTMLResponse(_generate_html_page(result["page"]))
    else:
        return JSONResponse(result)


@app.get("/settings/config")
async def get_settings(context: ApiTemplateContext = Depends(get_api_context)):
    """Get settings configuration"""
    result = await langchain_api_template.handle_settings_template(context, "get")
    return JSONResponse(result.model_dump())


@app.put("/settings/config")
async def update_settings(
    request: Request,
    context: ApiTemplateContext = Depends(get_api_context)
):
    """Update settings configuration"""
    body = await request.json()
    
    result = await langchain_api_template.handle_settings_template(
        context, "update", config=body
    )
    return JSONResponse(result.model_dump())


# API documentation endpoint
@app.get("/api/docs")
async def api_docs():
    """API documentation"""
    docs = {
        "title": "LangChain Integration API",
        "version": "1.0.0",
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


# Health check endpoint
@app.get("/health")
async def simple_health():
    """Simple health check"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


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
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug",
    )
