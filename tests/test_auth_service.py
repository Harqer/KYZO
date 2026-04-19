"""
Async Tests for AuthService - FastAPI Best Practices
Testing atomic authentication service with pytest and httpx
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone

import httpx
from pydantic import ValidationError

from src.services.atoms.auth_service import (
    AuthService,
    AuthRequest,
    AuthResponse,
    OAuthProvider,
    OAuthToken,
    AuthServiceError
)


class TestAuthService:
    """Test suite for AuthService atomic component"""
    
    @pytest.fixture
    def auth_service(self):
        """Create AuthService instance for testing"""
        return AuthService(
            base_url="https://test-api.langchain.com",
            api_key="test-api-key"
        )
    
    @pytest.fixture
    def sample_auth_request(self):
        """Sample authentication request for testing"""
        return AuthRequest(
            provider="google",
            scopes=["read", "write"],
            user_id="test_user_123",
            agent_id="test_agent_456",
        )
    
    @pytest.fixture
    def sample_auth_response(self):
        """Sample authentication response for testing"""
        return AuthResponse(
            status="completed",
            token="test_token_789",
            auth_id="test_auth_789",
            user_id="test_user_123",
        )
    
    @pytest.fixture
    def sample_oauth_provider(self):
        """Sample OAuth provider for testing"""
        return OAuthProvider(
            id="google",
            name="Google",
            provider="google",
            scopes=["read", "write", "email"],
            is_active=True,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        )
    
    @pytest.fixture
    def sample_oauth_token(self):
        """Sample OAuth token for testing"""
        return OAuthToken(
            id="token_123",
            user_id="test_user_123",
            provider_id="google",
            token="test_token_789",
            scopes=["read", "write"],
            expires_at="2024-12-31T23:59:59Z",
            label="default",
            created_at="2024-01-01T00:00:00Z",
        )


class TestAuthenticate:
    """Test authentication method"""
    
    @pytest.mark.asyncio
    async def test_authenticate_success(self, auth_service, sample_auth_request, sample_auth_response):
        """Test successful authentication"""
        # Mock httpx client
        mock_response = AsyncMock()
        mock_response.json.return_value = sample_auth_response.model_dump()
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            result = await auth_service.authenticate(sample_auth_request)
            
            assert isinstance(result, AuthResponse)
            assert result.status == "completed"
            assert result.token == "test_token_789"
            assert result.auth_id == "test_auth_789"
            assert result.user_id == "test_user_123"
    
    @pytest.mark.asyncio
    async def test_authenticate_http_error(self, auth_service, sample_auth_request):
        """Test authentication with HTTP error"""
        # Mock httpx client to raise HTTPStatusError
        mock_response = AsyncMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post.return_value.raise_for_status.side_effect = \
                httpx.HTTPStatusError("Unauthorized", request=AsyncMock(), response=mock_response)
            
            with pytest.raises(AuthServiceError, match="Authentication failed"):
                await auth_service.authenticate(sample_auth_request)
    
    @pytest.mark.asyncio
    async def test_authenticate_network_error(self, auth_service, sample_auth_request):
        """Test authentication with network error"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post.side_effect = \
                httpx.RequestError("Network error")
            
            with pytest.raises(AuthServiceError, match="Authentication failed"):
                await auth_service.authenticate(sample_auth_request)


class TestCheckOAuthTokenExists:
    """Test OAuth token existence check"""
    
    @pytest.mark.asyncio
    async def test_check_oauth_token_exists_true(self, auth_service):
        """Check existing OAuth token"""
        mock_response = AsyncMock()
        mock_response.json.return_value = {"exists": True}
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.check_oauth_token_exists("test_user_123", "google")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_check_oauth_token_exists_false(self, auth_service):
        """Check non-existing OAuth token"""
        mock_response = AsyncMock()
        mock_response.json.return_value = {"exists": False}
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.check_oauth_token_exists("test_user_123", "google")
            
            assert result is False
    
    @pytest.mark.asyncio
    async def test_check_oauth_token_exists_error(self, auth_service):
        """Check OAuth token with error"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = \
                httpx.RequestError("Network error")
            
            result = await auth_service.check_oauth_token_exists("test_user_123", "google")
            
            assert result is False  # Should return False on error


class TestListOAuthProviders:
    """Test OAuth provider listing"""
    
    @pytest.mark.asyncio
    async def test_list_oauth_providers_success(self, auth_service, sample_oauth_provider):
        """Test successful provider listing"""
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "providers": [sample_oauth_provider.model_dump()]
        }
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.list_oauth_providers()
            
            assert isinstance(result, list)
            assert len(result) == 1
            assert isinstance(result[0], OAuthProvider)
            assert result[0].provider == "google"
            assert result[0].is_active is True
    
    @pytest.mark.asyncio
    async def test_list_oauth_providers_empty(self, auth_service):
        """Test empty provider list"""
        mock_response = AsyncMock()
        mock_response.json.return_value = {"providers": []}
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.list_oauth_providers()
            
            assert isinstance(result, list)
            assert len(result) == 0
    
    @pytest.mark.asyncio
    async def test_list_oauth_providers_error(self, auth_service):
        """Test provider listing with error"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = \
                httpx.RequestError("Network error")
            
            with pytest.raises(AuthServiceError, match="Failed to list OAuth providers"):
                await auth_service.list_oauth_providers()


class TestGetOAuthProvider:
    """Test getting specific OAuth provider"""
    
    @pytest.mark.asyncio
    async def test_get_oauth_provider_success(self, auth_service, sample_oauth_provider):
        """Test successful provider retrieval"""
        mock_response = AsyncMock()
        mock_response.json.return_value = {"provider": sample_oauth_provider.model_dump()}
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.get_oauth_provider("google")
            
            assert isinstance(result, OAuthProvider)
            assert result.provider == "google"
            assert result.is_active is True
    
    @pytest.mark.asyncio
    async def test_get_oauth_provider_not_found(self, auth_service):
        """Test provider not found"""
        mock_response = AsyncMock()
        mock_response.status_code = 404
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.get_oauth_provider("nonexistent")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_get_oauth_provider_error(self, auth_service):
        """Test provider retrieval with error"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = \
                httpx.RequestError("Network error")
            
            result = await auth_service.get_oauth_provider("google")
            
            assert result is None


class TestListOAuthTokensForUser:
    """Test listing OAuth tokens for user"""
    
    @pytest.mark.asyncio
    async def test_list_oauth_tokens_for_user_success(self, auth_service, sample_oauth_token):
        """Test successful token listing"""
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "tokens": [sample_oauth_token.model_dump()]
        }
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.list_oauth_tokens_for_user("test_user_123")
            
            assert isinstance(result, list)
            assert len(result) == 1
            assert isinstance(result[0], OAuthToken)
            assert result[0].user_id == "test_user_123"
            assert result[0].provider_id == "google"
    
    @pytest.mark.asyncio
    async def test_list_oauth_tokens_for_user_empty(self, auth_service):
        """Test empty token list"""
        mock_response = AsyncMock()
        mock_response.json.return_value = {"tokens": []}
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.list_oauth_tokens_for_user("test_user_123")
            
            assert isinstance(result, list)
            assert len(result) == 0
    
    @pytest.mark.asyncio
    async def test_list_oauth_tokens_for_user_error(self, auth_service):
        """Test token listing with error"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = \
                httpx.RequestError("Network error")
            
            with pytest.raises(AuthServiceError, match="Failed to list OAuth tokens"):
                await auth_service.list_oauth_tokens_for_user("test_user_123")


class TestDeleteOAuthToken:
    """Test OAuth token deletion"""
    
    @pytest.mark.asyncio
    async def test_delete_oauth_token_success(self, auth_service):
        """Test successful token deletion"""
        mock_response = AsyncMock()
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.delete.return_value = mock_response
            
            result = await auth_service.delete_oauth_token("token_123", "test_user_123")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_delete_oauth_token_error(self, auth_service):
        """Test token deletion with error"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.delete.side_effect = \
                httpx.RequestError("Network error")
            
            result = await auth_service.delete_oauth_token("token_123", "test_user_123")
            
            assert result is False


class TestWaitForAuthCompletion:
    """Test waiting for authentication completion"""
    
    @pytest.mark.asyncio
    async def test_wait_for_auth_completion_success(self, auth_service, sample_auth_response):
        """Test successful auth completion"""
        mock_response = AsyncMock()
        mock_response.json.return_value = sample_auth_response.model_dump()
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await auth_service.wait_for_auth_completion("test_auth_789")
            
            assert isinstance(result, AuthResponse)
            assert result.status == "completed"
            assert result.token == "test_token_789"
    
    @pytest.mark.asyncio
    async def test_wait_for_auth_completion_timeout(self, auth_service):
        """Test auth completion timeout"""
        mock_response = AsyncMock()
        mock_response.json.return_value = {"status": "pending"}
        mock_response.raise_for_status.return_value = None
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            # Mock time to trigger timeout
            with patch('time.time') as mock_time:
                mock_time.side_effect = [0, 400]  # Start at 0, then 400 seconds later
                
                with pytest.raises(AuthServiceError, match="Authentication timed out"):
                    await auth_service.wait_for_auth_completion("test_auth_789", max_wait_time=300000)
    
    @pytest.mark.asyncio
    async def test_wait_for_auth_completion_error(self, auth_service):
        """Test auth completion with error"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = \
                httpx.RequestError("Network error")
            
            with pytest.raises(AuthServiceError, match="Auth completion check failed"):
                await auth_service.wait_for_auth_completion("test_auth_789")


class TestAuthRequestValidation:
    """Test AuthRequest model validation"""
    
    def test_valid_auth_request(self):
        """Test valid AuthRequest creation"""
        request = AuthRequest(
            provider="google",
            scopes=["read", "write"],
            user_id="test_user_123",
        )
        
        assert request.provider == "google"
        assert request.scopes == ["read", "write"]
        assert request.user_id == "test_user_123"
        assert request.is_default is False
    
    def test_invalid_auth_request_missing_required(self):
        """Test AuthRequest with missing required fields"""
        with pytest.raises(ValidationError):
            AuthRequest()
    
    def test_auth_request_with_optional_fields(self):
        """Test AuthRequest with optional fields"""
        request = AuthRequest(
            provider="google",
            scopes=["read"],
            user_id="test_user_123",
            agent_id="test_agent_456",
            force_new=True,
            is_default=True,
        )
        
        assert request.agent_id == "test_agent_456"
        assert request.force_new is True
        assert request.is_default is True


class TestOAuthProviderValidation:
    """Test OAuthProvider model validation"""
    
    def test_valid_oauth_provider(self):
        """Test valid OAuthProvider creation"""
        provider = OAuthProvider(
            id="google",
            name="Google",
            provider="google",
            scopes=["read", "write"],
            is_active=True,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        )
        
        assert provider.id == "google"
        assert provider.name == "Google"
        assert provider.provider == "google"
        assert provider.is_active is True
