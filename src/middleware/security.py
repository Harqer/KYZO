"""
Security Middleware - FastAPI Best Practices
Advanced security configuration with proper middleware setup
"""

import time
import secrets
from typing import List, Optional, Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import structlog

logger = structlog.get_logger(__name__)


class SecurityConfig:
    """Security configuration constants"""
    
    # Rate limiting
    DEFAULT_RATE_LIMIT_REQUESTS = 100
    DEFAULT_RATE_LIMIT_WINDOW = 60  # seconds
    
    # Security headers
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    }
    
    # CORS settings
    CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    CORS_ALLOW_HEADERS = [
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-User-ID",
        "X-Session-ID",
        "X-Request-ID",
    ]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware
    Limits requests per client based on IP address or user ID
    """
    
    def __init__(
        self,
        app,
        requests_per_window: int = SecurityConfig.DEFAULT_RATE_LIMIT_REQUESTS,
        window_seconds: int = SecurityConfig.DEFAULT_RATE_LIMIT_WINDOW,
        key_func: Optional[callable] = None,
    ):
        super().__init__(app)
        self.requests_per_window = requests_per_window
        self.window_seconds = window_seconds
        self.key_func = key_func or self._default_key_func
        self.requests: Dict[str, List[float]] = {}
    
    def _default_key_func(self, request: Request) -> str:
        """Default key function for rate limiting"""
        # Try to use user ID if available, otherwise use IP
        user_id = request.headers.get("x-user-id")
        if user_id:
            return f"user:{user_id}"
        return f"ip:{request.client.host}"
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        key = self.key_func(request)
        current_time = time.time()
        
        # Clean old requests
        if key in self.requests:
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if current_time - req_time < self.window_seconds
            ]
        else:
            self.requests[key] = []
        
        # Check rate limit
        if len(self.requests[key]) >= self.requests_per_window:
            logger.warning(
                "Rate limit exceeded",
                key=key,
                requests=len(self.requests[key]),
                limit=self.requests_per_window
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )
        
        # Add current request
        self.requests[key].append(current_time)
        
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Security headers middleware
    Adds security headers to all responses
    """
    
    async def dispatch(self, request: Request, call_next):
        """Add security headers to response"""
        response = await call_next(request)
        
        # Add security headers
        for header, value in SecurityConfig.SECURITY_HEADERS.items():
            response.headers[header] = value
        
        # Add request ID if not present
        if "x-request-id" not in response.headers:
            response.headers["x-request-id"] = secrets.token_urlsafe(16)
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Request logging middleware
    Logs all requests with structured logging
    """
    
    def __init__(self, app, exclude_paths: List[str] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or ["/health", "/metrics"]
    
    async def dispatch(self, request: Request, call_next):
        """Log request and response"""
        start_time = time.time()
        
        # Skip logging for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        # Get request details
        request_id = request.headers.get("x-request-id", secrets.token_urlsafe(16))
        user_id = request.headers.get("x-user-id")
        
        # Log request start
        logger.info(
            "Request started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            query=str(request.url.query),
            user_id=user_id,
            user_agent=request.headers.get("user-agent"),
            ip=request.client.host,
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log request completion
        logger.info(
            "Request completed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration * 1000, 2),
            user_id=user_id,
        )
        
        return response


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware
    Validates JWT tokens and sets user context
    """
    
    def __init__(self, app, public_paths: List[str] = None):
        super().__init__(app)
        self.public_paths = public_paths or [
            "/",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/auth/google",
            "/auth/github",
            "/auth/microsoft",
            "/auth/slack",
        ]
        self.security = HTTPBearer(auto_error=False)
    
    async def dispatch(self, request: Request, call_next):
        """Validate authentication and set user context"""
        # Skip authentication for public paths
        if request.url.path in self.public_paths:
            return await call_next(request)
        
        # Try to get credentials
        credentials: Optional[HTTPAuthorizationCredentials] = await self.security(request)
        
        if credentials:
            # Validate JWT token (this would be implemented with proper JWT validation)
            try:
                # For now, we'll just set the user context
                # In a real implementation, you would decode and validate the JWT
                user_info = self._validate_token(credentials.credentials)
                request.state.user = user_info
                request.state.authenticated = True
            except Exception as e:
                logger.error("Token validation failed", error=str(e))
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        else:
            # Set anonymous user context
            request.state.user = {"id": "anonymous", "authenticated": False}
            request.state.authenticated = False
        
        response = await call_next(request)
        return response
    
    def _validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate JWT token and return user info
        This is a placeholder - implement proper JWT validation
        """
        # In a real implementation, you would:
        # 1. Decode the JWT token
        # 2. Validate the signature
        # 3. Check expiration
        # 4. Extract user information
        
        # For now, return a mock user
        return {
            "id": "user_123",
            "email": "user@example.com",
            "name": "Test User",
            "authenticated": True,
        }


def setup_cors_middleware(app, cors_origins: List[str]):
    """
    Setup CORS middleware with proper configuration
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=SecurityConfig.CORS_ALLOW_METHODS,
        allow_headers=SecurityConfig.CORS_ALLOW_HEADERS,
        expose_headers=["x-request-id", "x-total-count"],
    )


def setup_trusted_host_middleware(app, allowed_hosts: List[str]):
    """
    Setup trusted host middleware
    """
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts,
    )


def setup_security_middleware(
    app,
    rate_limit_enabled: bool = True,
    rate_limit_requests: int = SecurityConfig.DEFAULT_RATE_LIMIT_REQUESTS,
    rate_limit_window: int = SecurityConfig.DEFAULT_RATE_LIMIT_WINDOW,
    log_requests: bool = True,
    public_paths: List[str] = None,
):
    """
    Setup all security middleware
    """
    # Add security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Add rate limiting middleware
    if rate_limit_enabled:
        app.add_middleware(
            RateLimitMiddleware,
            requests_per_window=rate_limit_requests,
            window_seconds=rate_limit_window,
        )
    
    # Add request logging middleware
    if log_requests:
        app.add_middleware(RequestLoggingMiddleware)
    
    # Add authentication middleware
    if public_paths:
        app.add_middleware(AuthenticationMiddleware, public_paths=public_paths)
    else:
        app.add_middleware(AuthenticationMiddleware)
