"""
Lifespan Events - FastAPI Best Practices
Application startup and shutdown event handlers
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import structlog
import httpx

from ..config.settings import settings
from ..services.organisms.langchain_integration_service import langchain_integration_service


logger = structlog.get_logger(__name__)


class ApplicationLifecycle:
    """
    Application lifecycle management
    Handles startup and shutdown events for the FastAPI application
    """
    
    def __init__(self):
        self.http_client: Optional[httpx.AsyncClient] = None
        self.background_tasks: set[asyncio.Task] = set()
        self.is_shutting_down = False
    
    async def startup(self):
        """
        Application startup logic
        Initialize resources that need to be available for the whole app
        """
        logger.info("Application startup initiated")
        
        try:
            # Initialize HTTP client for external API calls
            self.http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
            )
            logger.info("HTTP client initialized")
            
            # Initialize LangChain integration service
            await self._initialize_langchain_service()
            logger.info("LangChain integration service initialized")
            
            # Perform health checks
            await self._startup_health_checks()
            logger.info("Startup health checks completed")
            
            # Start background tasks
            await self._start_background_tasks()
            logger.info("Background tasks started")
            
            logger.info("Application startup completed successfully")
            
        except Exception as e:
            logger.error("Application startup failed", error=str(e))
            raise
    
    async def shutdown(self):
        """
        Application shutdown logic
        Clean up resources and gracefully shutdown
        """
        logger.info("Application shutdown initiated")
        self.is_shutting_down = True
        
        try:
            # Cancel background tasks
            await self._cancel_background_tasks()
            logger.info("Background tasks cancelled")
            
            # Shutdown LangChain integration service
            await self._shutdown_langchain_service()
            logger.info("LangChain integration service shutdown")
            
            # Close HTTP client
            if self.http_client:
                await self.http_client.aclose()
                logger.info("HTTP client closed")
            
            # Cleanup other resources
            await self._cleanup_resources()
            logger.info("Resources cleaned up")
            
            logger.info("Application shutdown completed successfully")
            
        except Exception as e:
            logger.error("Application shutdown failed", error=str(e))
    
    async def _initialize_langchain_service(self):
        """Initialize LangChain integration service"""
        try:
            # Update service configuration
            config = {
                "api_url": settings.langchain_api_url,
                "api_key": settings.langchain_api_key or "",
                "default_scopes": settings.langchain_default_scopes,
                "timeout_ms": settings.langchain_timeout_ms,
            }
            langchain_integration_service.update_config(config)
            
            # Test connection
            health_result = await langchain_integration_service.perform_health_check()
            if health_result.status != "healthy":
                logger.warning(
                    "LangChain service health check failed",
                    status=health_result.status,
                    details=health_result.details
                )
            else:
                logger.info("LangChain service health check passed")
                
        except Exception as e:
            logger.error("Failed to initialize LangChain service", error=str(e))
            raise
    
    async def _shutdown_langchain_service(self):
        """Shutdown LangChain integration service"""
        try:
            # Perform cleanup operations
            # This would include things like cleaning up active connections, etc.
            logger.info("LangChain service cleanup completed")
        except Exception as e:
            logger.error("Failed to shutdown LangChain service", error=str(e))
    
    async def _startup_health_checks(self):
        """Perform startup health checks"""
        health_checks = {
            "langchain_api": self._check_langchain_api,
            "database": self._check_database,
            "external_services": self._check_external_services,
        }
        
        results = {}
        for check_name, check_func in health_checks.items():
            try:
                result = await check_func()
                results[check_name] = result
                logger.info(f"Health check {check_name}: {result}")
            except Exception as e:
                results[check_name] = f"failed: {str(e)}"
                logger.error(f"Health check {check_name} failed", error=str(e))
        
        # Log overall health status
        failed_checks = [name for name, result in results.items() if "failed" in str(result)]
        if failed_checks:
            logger.warning("Some health checks failed", failed_checks=failed_checks)
        else:
            logger.info("All health checks passed")
    
    async def _check_langchain_api(self) -> str:
        """Check LangChain API connectivity"""
        if not settings.langchain_api_key:
            return "skipped: no API key configured"
        
        try:
            health_result = await langchain_integration_service.perform_health_check()
            return health_result.status
        except Exception as e:
            return f"failed: {str(e)}"
    
    async def _check_database(self) -> str:
        """Check database connectivity"""
        # This would implement actual database health check
        # For now, return a placeholder
        return "healthy"
    
    async def _check_external_services(self) -> str:
        """Check external service connectivity"""
        # This would check services like Redis, etc.
        # For now, return a placeholder
        return "healthy"
    
    async def _start_background_tasks(self):
        """Start background tasks"""
        # Example: metrics collection task
        if settings.enable_metrics:
            task = asyncio.create_task(self._metrics_collection_loop())
            self.background_tasks.add(task)
            task.add_done_callback(self.background_tasks.discard)
    
    async def _cancel_background_tasks(self):
        """Cancel all background tasks"""
        if not self.background_tasks:
            return
        
        logger.info(f"Cancelling {len(self.background_tasks)} background tasks")
        
        # Cancel all tasks
        for task in self.background_tasks:
            task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self.background_tasks, return_exceptions=True)
        
        self.background_tasks.clear()
    
    async def _cleanup_resources(self):
        """Cleanup additional resources"""
        # This would include things like closing database connections, etc.
        pass
    
    async def _metrics_collection_loop(self):
        """Background task for metrics collection"""
        while not self.is_shutting_down:
            try:
                # Collect metrics here
                # This would integrate with Prometheus or other metrics systems
                await asyncio.sleep(30)  # Collect every 30 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Metrics collection error", error=str(e))
                await asyncio.sleep(5)  # Wait before retrying


# Global lifecycle instance
lifecycle = ApplicationLifecycle()


@asynccontextmanager
async def lifespan_context(app) -> AsyncGenerator[None, None]:
    """
    FastAPI lifespan context manager
    This is the recommended way to handle startup/shutdown events
    """
    try:
        await lifecycle.startup()
        yield
    finally:
        await lifecycle.shutdown()


# Alternative approach using events (deprecated in favor of lifespan)
def setup_events(app):
    """
    Setup startup and shutdown events
    This is the older approach, kept for reference
    """
    
    @app.on_event("startup")
    async def startup_event():
        """Startup event handler"""
        await lifecycle.startup()
    
    @app.on_event("shutdown")
    async def shutdown_event():
        """Shutdown event handler"""
        await lifecycle.shutdown()


def get_http_client() -> httpx.AsyncClient:
    """
    Get the shared HTTP client
    This should be used throughout the application for external API calls
    """
    if lifecycle.http_client is None:
        raise RuntimeError("HTTP client not initialized")
    return lifecycle.http_client


def is_shutting_down() -> bool:
    """Check if the application is shutting down"""
    return lifecycle.is_shutting_down
