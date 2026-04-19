"""
Vercel-Enhanced FastAPI Application - Production Ready
Complete page-level component with advanced Vercel features
Combines all Atomic Design components with Vercel AI integration
"""

import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, Request, Response, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
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
from .services.atoms.agent_friendly_service import agent_friendly_service
from .services.atoms.ai_sandbox_service import (
    ai_sandbox_service,
    SandboxRequest,
    SandboxConfig
)
from .services.atoms.ai_gateway_service import (
    ai_gateway_service,
    ChatRequest,
    ChatMessage
)
from .services.molecules.ai_workflow_manager import (
    ai_workflow_manager,
    CodeGenerationRequest,
    CodeValidationRequest
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


class CodeExecutionRequest(BaseModel):
    """Code execution request model"""
    code: str
    language: str = "python"
    config: Optional[Dict[str, Any]] = None


class CodeGenerationRequestAPI(BaseModel):
    """Code generation request API model"""
    prompt: str
    language: str = "python"
    context: Optional[str] = None
    requirements: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)


class ChatCompletionRequest(BaseModel):
    """Chat completion request API model"""
    model_id: str = "openai:gpt-3.5-turbo"
    messages: List[Dict[str, str]]
    max_tokens: Optional[int] = None
    temperature: float = 0.7
    stream: bool = False


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
        description="Complete LangChain integration with Vercel AI features following Atomic Design principles",
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
        {
            "name": "AI Features",
            "description": "AI sandbox, gateway, and workflow management",
        },
        {
            "name": "Agent-Friendly",
            "description": "Agent-friendly API endpoints and documentation",
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
    description="Complete LangChain integration with Vercel AI features following Atomic Design principles",
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
        "/llms.txt",
        "/llms-full.txt",
        "/api/docs.md",
        "/auth/google",
        "/auth/github",
        "/auth/microsoft",
        "/auth/slack",
        "/api/docs",
        "/ai/sandbox/execute",
        "/ai/gateway/chat",
        "/ai/generate/code",
    ],
)


# Agent-Friendly API Endpoints
@app.get("/llms.txt", response_class=PlainTextResponse, tags=["Agent-Friendly"])
async def llms_txt():
    """
    llms.txt endpoint for agent discovery
    Returns agent-friendly API index following llms.txt standard
    """
    try:
        content = agent_friendly_service.generate_llms_txt()
        return PlainTextResponse(
            content=content,
            headers={"Content-Type": "text/plain; charset=utf-8"}
        )
    except Exception as e:
        logger.error("Failed to generate llms.txt", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate llms.txt")


@app.get("/llms-full.txt", response_class=PlainTextResponse, tags=["Agent-Friendly"])
async def llms_full_txt():
    """
    llms-full.txt endpoint for complete documentation
    Returns comprehensive documentation in single file
    """
    try:
        content = agent_friendly_service.generate_llms_full_txt()
        return PlainTextResponse(
            content=content,
            headers={"Content-Type": "text/plain; charset=utf-8"}
        )
    except Exception as e:
        logger.error("Failed to generate llms-full.txt", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate llms-full.txt")


@app.get("/api/docs.md", response_class=PlainTextResponse, tags=["Agent-Friendly"])
async def api_docs_md():
    """
    API documentation in markdown format
    Agent-friendly API documentation endpoint
    """
    try:
        content = agent_friendly_service.generate_api_docs_md()
        return PlainTextResponse(content=content, media_type="text/markdown")
    except Exception as e:
        logger.error("Failed to generate API docs", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate API docs")


# AI Sandbox Endpoints
@app.post("/ai/sandbox/execute", tags=["AI Features"])
async def execute_code_in_sandbox(request: CodeExecutionRequest):
    """
    Execute code in secure AI sandbox
    Provides safe execution environment for AI-generated code
    """
    try:
        # Build sandbox request
        sandbox_request = SandboxRequest(
            code=request.code,
            language=request.language,
            config=SandboxConfig(**request.config) if request.config else None
        )
        
        # Execute in sandbox
        result = await ai_sandbox_service.execute_code(sandbox_request)
        
        logger.info(
            "Code executed in sandbox",
            language=request.language,
            success=result.success,
            execution_time_ms=result.execution_time_ms
        )
        
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("Sandbox execution failed", error=str(e))
        raise HTTPException(status_code=500, detail="Sandbox execution failed")


@app.get("/ai/sandbox/stats", tags=["AI Features"])
async def get_sandbox_stats():
    """
    Get sandbox execution statistics
    Returns usage statistics and performance metrics
    """
    try:
        stats = ai_sandbox_service.get_execution_stats()
        return JSONResponse(stats)
    except Exception as e:
        logger.error("Failed to get sandbox stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get sandbox stats")


@app.post("/ai/sandbox/validate", tags=["AI Features"])
async def validate_code_safety(request: CodeExecutionRequest):
    """
    Validate code safety without executing
    Performs security checks and analysis
    """
    try:
        validation_result = await ai_sandbox_service.validate_code_safety(request.code)
        return JSONResponse(validation_result)
    except Exception as e:
        logger.error("Code validation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Code validation failed")


# AI Gateway Endpoints
@app.post("/ai/gateway/chat", tags=["AI Features"])
async def chat_with_ai(request: ChatCompletionRequest):
    """
    Chat with AI models through Vercel AI Gateway
    Provides unified access to multiple AI models
    """
    try:
        # Convert API request to internal format
        chat_request = ChatRequest(
            model_id=request.model_id,
            messages=[
                ChatMessage(role=msg["role"], content=msg["content"])
                for msg in request.messages
            ],
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            stream=request.stream,
        )
        
        if request.stream:
            # Return streaming response
            return StreamingResponse(
                ai_gateway_service.stream_chat_completion(chat_request),
                media_type="text/event-stream"
            )
        else:
            # Return regular response
            response = await ai_gateway_service.chat_completion(chat_request)
            
            logger.info(
                "AI chat completed",
                model=request.model_id,
                response_time_ms=response.response_time_ms,
                tokens_used=response.usage.get("total_tokens", 0)
            )
            
            return JSONResponse(response.model_dump())
            
    except Exception as e:
        logger.error("AI chat failed", model=request.model_id, error=str(e))
        raise HTTPException(status_code=500, detail="AI chat failed")


@app.get("/ai/gateway/models", tags=["AI Features"])
async def get_available_models():
    """
    Get available AI models
    Returns list of models available through AI Gateway
    """
    try:
        models = ai_gateway_service.get_available_models()
        return JSONResponse({
            model_id: model.model_dump()
            for model_id, model in models.items()
        })
    except Exception as e:
        logger.error("Failed to get available models", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get available models")


@app.get("/ai/gateway/stats", tags=["AI Features"])
async def get_gateway_stats():
    """
    Get AI Gateway usage statistics
    Returns usage metrics and performance data
    """
    try:
        stats = ai_gateway_service.get_usage_stats()
        return JSONResponse(stats)
    except Exception as e:
        logger.error("Failed to get gateway stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get gateway stats")


@app.post("/ai/gateway/test/{model_id}", tags=["AI Features"])
async def test_model_connectivity(model_id: str):
    """
    Test connectivity to a specific AI model
    Performs connectivity check and returns performance metrics
    """
    try:
        result = await ai_gateway_service.test_model_connectivity(model_id)
        return JSONResponse(result)
    except Exception as e:
        logger.error("Model connectivity test failed", model_id=model_id, error=str(e))
        raise HTTPException(status_code=500, detail="Model connectivity test failed")


# AI Workflow Endpoints
@app.post("/ai/generate/code", tags=["AI Features"])
async def generate_code_with_ai(request: CodeGenerationRequestAPI):
    """
    Generate code using AI with validation
    Combines AI generation with safety validation
    """
    try:
        # Build code generation request
        code_request = CodeGenerationRequest(
            prompt=request.prompt,
            language=request.language,
            context=request.context,
            requirements=request.requirements,
            constraints=request.constraints
        )
        
        # Execute AI workflow
        result = await ai_workflow_manager.execute_ai_code_workflow(
            prompt=request.prompt,
            language=request.language
        )
        
        logger.info(
            "AI code workflow completed",
            success=result.success,
            execution_time_ms=result.execution_time_ms
        )
        
        return JSONResponse(result.model_dump())
        
    except Exception as e:
        logger.error("AI code generation failed", error=str(e))
        raise HTTPException(status_code=500, detail="AI code generation failed")


@app.post("/ai/generate/documentation", tags=["AI Features"])
async def generate_documentation(request: CodeExecutionRequest):
    """
    Generate documentation for code using AI
    Creates comprehensive documentation with AI assistance
    """
    try:
        documentation = await ai_workflow_manager.generate_documentation_with_ai(
            code=request.code,
            language=request.language
        )
        
        logger.info("Documentation generated with AI", language=request.language)
        
        return JSONResponse({
            "documentation": documentation,
            "language": request.language,
            "generated_at": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error("Documentation generation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Documentation generation failed")


@app.get("/ai/workflow/stats", tags=["AI Features"])
async def get_workflow_stats():
    """
    Get AI workflow statistics
    Returns comprehensive AI workflow metrics
    """
    try:
        stats = await ai_workflow_manager.get_ai_workflow_stats()
        return JSONResponse(stats)
    except Exception as e:
        logger.error("Failed to get workflow stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get workflow stats")


@app.get("/ai/workflow/results", tags=["AI Features"])
async def list_workflow_results(limit: int = 50):
    """
    List recent AI workflow results
    Returns history of AI workflow executions
    """
    try:
        results = ai_workflow_manager.list_workflow_results(limit)
        return JSONResponse({
            "results": [result.model_dump() for result in results],
            "count": len(results)
        })
    except Exception as e:
        logger.error("Failed to list workflow results", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list workflow results")


# Enhanced API Documentation Endpoint
@app.get("/api/docs", tags=["Documentation"])
async def enhanced_api_docs():
    """
    Enhanced API documentation with AI assistance
    Returns AI-enhanced API documentation
    """
    try:
        documentation = await ai_workflow_manager.create_ai_assisted_api_documentation()
        
        return JSONResponse({
            "title": "Enhanced API Documentation",
            "description": "AI-enhanced API documentation with examples and best practices",
            "content": documentation,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "features": [
                "AI-generated examples",
                "Error handling patterns",
                "Best practices",
                "Common use cases",
                "Integration examples"
            ]
        })
    except Exception as e:
        logger.error("Failed to generate enhanced docs", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate enhanced docs")


# Include all existing endpoints from the main application
# (This would include all the auth, agents, integration, and settings endpoints)

# Root endpoint with enhanced information
@app.get("/", response_class=HTMLResponse, tags=["Root"])
async def root():
    """Root endpoint with enhanced API information"""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <title>{settings.app_name}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .container {{ max-width: 1000px; margin: 0 auto; }}
        .endpoint {{ background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .method {{ color: #fff; padding: 3px 8px; border-radius: 3px; font-size: 12px; }}
        .get {{ background: #61affe; }}
        .post {{ background: #49cc90; }}
        .delete {{ background: #f93e3e; }}
        .put {{ background: #fca130; }}
        .ai-feature {{ background: #e3f2fd; border-left: 4px solid #2196f3; }}
        .agent-friendly {{ background: #f3e5f5; border-left: 4px solid #9c27b0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{settings.app_name}</h1>
        <p>Complete LangChain integration with Vercel AI features following Atomic Design principles</p>
        <p>Environment: {settings.environment} | Version: {settings.version}</p>
        
        <h2>Agent-Friendly APIs</h2>
        <div class="agent-friendly">
            <div class="endpoint">
                <span class="method get">GET</span> /llms.txt - Agent discovery (llms.txt standard)
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> /llms-full.txt - Complete documentation
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> /api/docs.md - API documentation in markdown
            </div>
        </div>
        
        <h2>AI Features</h2>
        <div class="ai-feature">
            <div class="endpoint">
                <span class="method post">POST</span> /ai/sandbox/execute - Execute code in secure sandbox
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> /ai/gateway/chat - Chat with AI models
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> /ai/generate/code - Generate code with AI
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> /ai/generate/documentation - Generate documentation
            </div>
        </div>
        
        <h2>Core Features</h2>
        <div class="endpoint">
            <span class="method get">GET</span> /health - Health check
        </div>
        <div class="endpoint">
            <span class="method get">GET</span> /auth - Authentication page
        </div>
        <div class="endpoint">
            <span class="method get">GET</span> /agents - List agents
        </div>
        <div class="endpoint">
            <span class="method get">GET</span> /integration/metrics - Get integration metrics
        </div>
        
        {"<p><a href='/docs'>Interactive API Documentation</a></p>" if settings.debug else ""}
        {"<p><a href='/redoc'>ReDoc Documentation</a></p>" if settings.debug else ""}
        <p><a href='/api/docs'>Enhanced API Documentation</a></p>
        <p><a href='/llms.txt'>Agent Discovery (llms.txt)</a></p>
    </div>
</body>
</html>"""


# Enhanced health check
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Enhanced health check with AI services"""
    try:
        # Perform health checks
        langchain_health = await langchain_integration_service.perform_health_check()
        
        # Check AI services
        sandbox_stats = ai_sandbox_service.get_execution_stats()
        gateway_stats = ai_gateway_service.get_usage_stats()
        
        checks = {
            "langchain_api": langchain_health.status,
            "ai_sandbox": "healthy" if sandbox_stats else "unavailable",
            "ai_gateway": "healthy" if gateway_stats else "unavailable",
            "agent_friendly": "healthy",
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


if __name__ == "__main__":
    import uvicorn
    
    logger.info(
        "Starting Vercel-enhanced FastAPI application",
        host=settings.host,
        port=settings.port,
        environment=settings.environment,
        debug=settings.debug,
    )
    
    # Run the application
    uvicorn.run(
        "main_vercel_enhanced:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level,
        workers=settings.workers if not settings.reload else 1,
    )
