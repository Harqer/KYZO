"""
Integration Tests - FastAPI Best Practices
End-to-end testing of the complete LangChain integration
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from httpx import AsyncClient

from src.main_enhanced import app
from src.services.pages.langchain_integration_page import PageContext
from src.services.templates.langchain_api_template import ApiTemplateContext


class TestIntegrationEndpoints:
    """Integration tests for all API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def async_client(self):
        """Create async test client"""
        return AsyncClient(app=app, base_url="http://test")
    
    @pytest.fixture
    def mock_user_context(self):
        """Mock user context for testing"""
        return {
            "id": "test_user_123",
            "email": "test@example.com",
            "name": "Test User",
            "authenticated": True,
        }
    
    @pytest.fixture
    def mock_page_context(self, mock_user_context):
        """Mock page context for testing"""
        return PageContext(
            user=mock_user_context,
            session={
                "id": "test_session_456",
                "created_at": "2024-01-01T00:00:00Z",
                "last_activity": "2024-01-01T00:00:00Z",
            },
            request={
                "id": "test_request_789",
                "method": "GET",
                "path": "/test",
                "user_agent": "test-agent",
                "ip_address": "127.0.0.1",
            },
        )
    
    @pytest.fixture
    def mock_api_context(self, mock_user_context):
        """Mock API context for testing"""
        return ApiTemplateContext(
            user_id=mock_user_context["id"],
            request_id="test_request_789",
            user_agent="test-agent",
            ip_address="127.0.0.1",
        )


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_check_success(self, client):
        """Test successful health check"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "timestamp" in data
        assert "version" in data
        assert "environment" in data
        assert "checks" in data
    
    def test_health_check_with_services(self, client):
        """Test health check with service dependencies"""
        with patch('src.services.organisms.langchain_integration_service.langchain_integration_service.perform_health_check') as mock_health:
            mock_health.return_value = AsyncMock(
                status="healthy",
                checks={"langchain_api": "healthy"},
                details={}
            )
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "langchain_api" in data["checks"]


class TestAuthenticationEndpoints:
    """Test authentication endpoints"""
    
    def test_auth_page_html(self, client):
        """Test authentication page returns HTML"""
        with patch('src.services.pages.langchain_integration_page.langchain_integration_page.render_auth_page') as mock_render:
            mock_render.return_value = {
                "success": True,
                "page": {
                    "title": "Authentication",
                    "sections": [],
                    "navigation": {"items": []},
                }
            }
            
            response = client.get("/auth", headers={"Accept": "text/html"})
            
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/html")
    
    def test_auth_page_json(self, client):
        """Test authentication page returns JSON"""
        with patch('src.services.pages.langchain_integration_page.langchain_integration_page.render_auth_page') as mock_render:
            mock_render.return_value = {
                "success": True,
                "page": {
                    "title": "Authentication",
                    "sections": [],
                    "navigation": {"items": []},
                }
            }
            
            response = client.get("/auth", headers={"Accept": "application/json"})
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "page" in data
    
    def test_start_auth_success(self, client):
        """Test starting OAuth authentication"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_auth_template') as mock_auth:
            mock_auth.return_value = AsyncMock(
                success=True,
                data={
                    "providers": ["google"],
                    "status": "pending",
                    "auth_url": "https://accounts.google.com/oauth/authorize",
                }
            )
            
            response = client.post(
                "/auth/google",
                json={"scopes": ["read", "write"]},
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["status"] == "pending"
            assert "auth_url" in data["data"]
    
    def test_start_auth_invalid_provider(self, client):
        """Test starting auth with invalid provider"""
        response = client.post("/auth/invalid")
        
        # Should be handled by the endpoint and return an error
        assert response.status_code in [400, 500]
    
    def test_auth_callback_success(self, client):
        """Test OAuth callback handling"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_callback_template') as mock_callback:
            mock_callback.return_value = AsyncMock(
                success=True,
                data={
                    "provider": "google",
                    "status": "completed",
                    "success": True,
                    "token": "test_token_123",
                }
            )
            
            response = client.get("/auth/google/callback?code=test_code&state=test_state")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["provider"] == "google"
            assert data["data"]["status"] == "completed"


class TestAgentEndpoints:
    """Test agent management endpoints"""
    
    def test_agents_page_html(self, client):
        """Test agents page returns HTML"""
        with patch('src.services.pages.langchain_integration_page.langchain_integration_page.render_agents_page') as mock_render:
            mock_render.return_value = {
                "success": True,
                "page": {
                    "title": "Agent Management",
                    "sections": [],
                    "navigation": {"items": []},
                }
            }
            
            response = client.get("/agents", headers={"Accept": "text/html"})
            
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/html")
    
    def test_create_agent_success(self, client):
        """Test creating a new agent"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_agent_template') as mock_agent:
            mock_agent.return_value = AsyncMock(
                success=True,
                data={
                    "agent_id": "test_agent_123",
                    "name": "Test Agent",
                    "status": "created",
                }
            )
            
            agent_data = {
                "name": "Test Agent",
                "description": "A test agent",
                "connections": [
                    {
                        "provider": "google",
                        "scopes": ["read", "write"],
                    }
                ],
            }
            
            response = client.post("/agents", json=agent_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["agent_id"] == "test_agent_123"
    
    def test_get_agent_status_success(self, client):
        """Test getting agent status"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_agent_template') as mock_agent:
            mock_agent.return_value = AsyncMock(
                success=True,
                data={
                    "agent_id": "test_agent_123",
                    "name": "Test Agent",
                    "status": "active",
                    "connections": 2,
                    "deployments": 1,
                }
            )
            
            response = client.get("/agents/test_agent_123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["agent_id"] == "test_agent_123"
            assert data["data"]["status"] == "active"
    
    def test_delete_agent_success(self, client):
        """Test deleting an agent"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_agent_template') as mock_agent:
            mock_agent.return_value = AsyncMock(
                success=True,
                data={"deleted": True}
            )
            
            response = client.delete("/agents/test_agent_123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["deleted"] is True


class TestIntegrationEndpoints:
    """Test integration management endpoints"""
    
    def test_integration_metrics_page(self, client):
        """Test integration metrics page"""
        with patch('src.services.pages.langchain_integration_page.langchain_integration_page.render_metrics_page') as mock_render:
            mock_render.return_value = {
                "success": True,
                "page": {
                    "title": "Integration Metrics",
                    "sections": [],
                    "navigation": {"items": []},
                }
            }
            
            response = client.get("/integration/metrics", headers={"Accept": "text/html"})
            
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/html")
    
    def test_sync_integrations_success(self, client):
        """Test syncing integrations"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_integration_template') as mock_sync:
            mock_sync.return_value = AsyncMock(
                success=True,
                data={
                    "synced": ["google", "github"],
                    "failed": [],
                    "errors": [],
                }
            )
            
            response = client.post("/integration/sync")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["data"]["synced"]) == 2
            assert len(data["data"]["failed"]) == 0
    
    def test_health_check_detailed(self, client):
        """Test detailed health check"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_integration_template') as mock_health:
            mock_health.return_value = AsyncMock(
                success=True,
                data={
                    "status": "healthy",
                    "checks": {
                        "api": True,
                        "config": True,
                        "timeout": True,
                    },
                    "details": {
                        "api": "API connectivity successful",
                        "config": "Configuration valid",
                        "timeout": "Timeout set to 300000ms",
                    },
                }
            )
            
            response = client.get("/integration/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["status"] == "healthy"
            assert "checks" in data["data"]
            assert "details" in data["data"]


class TestSettingsEndpoints:
    """Test settings endpoints"""
    
    def test_settings_page(self, client):
        """Test settings page"""
        with patch('src.services.pages.langchain_integration_page.langchain_integration_page.render_settings_page') as mock_render:
            mock_render.return_value = {
                "success": True,
                "page": {
                    "title": "Settings",
                    "sections": [],
                    "navigation": {"items": []},
                }
            }
            
            response = client.get("/settings", headers={"Accept": "text/html"})
            
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/html")
    
    def test_get_settings_config(self, client):
        """Test getting settings configuration"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_settings_template') as mock_settings:
            mock_settings.return_value = AsyncMock(
                success=True,
                data={
                    "api_url": "https://api.langchain.com",
                    "default_scopes": ["read", "write"],
                    "timeout_ms": 300000,
                }
            )
            
            response = client.get("/settings/config")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["api_url"] == "https://api.langchain.com"
            assert data["data"]["timeout_ms"] == 300000
    
    def test_update_settings_config(self, client):
        """Test updating settings configuration"""
        with patch('src.services.templates.langchain_api_template.langchain_api_template.handle_settings_template') as mock_settings:
            mock_settings.return_value = AsyncMock(
                success=True,
                data={
                    "updated": True,
                    "config": {
                        "timeout_ms": 600000,
                        "default_scopes": ["read", "write", "admin"],
                    },
                }
            )
            
            update_data = {
                "timeout_ms": 600000,
                "default_scopes": ["read", "write", "admin"],
            }
            
            response = client.put("/settings/config", json=update_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["updated"] is True
            assert data["data"]["config"]["timeout_ms"] == 600000


class TestErrorHandling:
    """Test error handling across all endpoints"""
    
    def test_404_not_found(self, client):
        """Test 404 error handling"""
        response = client.get("/nonexistent-endpoint")
        
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client):
        """Test method not allowed error"""
        response = client.delete("/auth")
        
        assert response.status_code == 405
    
    def test_validation_error(self, client):
        """Test validation error handling"""
        response = client.post("/agents", json={"invalid": "data"})
        
        assert response.status_code in [400, 422]
    
    def test_internal_server_error(self, client):
        """Test internal server error handling"""
        with patch('src.services.pages.langchain_integration_page.langchain_integration_page.render_auth_page') as mock_render:
            mock_render.side_effect = Exception("Internal error")
            
            response = client.get("/auth")
            
            assert response.status_code == 500
            data = response.json()
            assert "error" in data


class TestSecurityMiddleware:
    """Test security middleware functionality"""
    
    def test_security_headers(self, client):
        """Test security headers are present"""
        response = client.get("/health")
        
        # Check for security headers
        assert "x-content-type-options" in response.headers
        assert "x-frame-options" in response.headers
        assert "x-xss-protection" in response.headers
        assert "x-request-id" in response.headers
    
    def test_cors_headers(self, client):
        """Test CORS headers"""
        response = client.options("/auth")
        
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers
    
    def test_rate_limiting(self, client):
        """Test rate limiting functionality"""
        # Make multiple rapid requests
        responses = []
        for _ in range(5):
            response = client.get("/health")
            responses.append(response)
        
        # At least some should succeed (depending on rate limit config)
        success_count = sum(1 for r in responses if r.status_code == 200)
        assert success_count >= 1


class TestAsyncIntegration:
    """Test async functionality with httpx client"""
    
    @pytest.mark.asyncio
    async def test_async_client_usage(self):
        """Test async client for API calls"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test handling concurrent requests"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Make multiple concurrent requests
            tasks = [
                client.get("/health"),
                client.get("/health"),
                client.get("/health"),
            ]
            
            responses = await asyncio.gather(*tasks)
            
            # All should succeed
            for response in responses:
                assert response.status_code == 200
                data = response.json()
                assert "status" in data


class TestDocumentationEndpoints:
    """Test documentation and API info endpoints"""
    
    def test_api_docs_endpoint(self, client):
        """Test API documentation endpoint"""
        response = client.get("/api/docs")
        
        assert response.status_code == 200
        data = response.json()
        assert "title" in data
        assert "version" in data
        assert "architecture" in data
        assert "endpoints" in data
    
    def test_openapi_schema(self, client):
        """Test OpenAPI schema generation"""
        response = client.get("/openapi.json")
        
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data
        assert "components" in data
