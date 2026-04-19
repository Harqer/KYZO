"""
Auth Service - Atomic Component
Basic authentication service atom following Atomic Design principles
Can't be broken down further without ceasing to be functional
"""

import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import httpx
from pydantic import BaseModel, Field


class AuthRequest(BaseModel):
    """Authentication request model"""
    provider: str
    scopes: List[str]
    user_id: Optional[str] = None
    ls_user_id: Optional[str] = None
    agent_id: Optional[str] = None
    use_agent_builder_public_oauth: bool = False
    force_new: bool = False
    token_id: Optional[str] = None
    is_default: bool = False


class AuthResponse(BaseModel):
    """Authentication response model"""
    status: str
    url: Optional[str] = None
    auth_id: Optional[str] = None
    token: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class OAuthProvider(BaseModel):
    """OAuth provider model"""
    id: str
    name: str
    provider: str
    scopes: List[str]
    is_active: bool
    created_at: str
    updated_at: str


class OAuthToken(BaseModel):
    """OAuth token model"""
    id: str
    user_id: str
    provider_id: str
    token: str
    scopes: List[str]
    expires_at: Optional[str] = None
    label: Optional[str] = None
    created_at: str


class AuthServiceError(Exception):
    """Custom exception for auth service errors"""
    pass


class AuthService:
    """
    Atomic authentication service for LangChain integration
    Handles basic OAuth operations with LangChain API
    """
    
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or "https://api.langchain.com"
        self.api_key = api_key or ""
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
    
    async def authenticate(self, request: AuthRequest) -> AuthResponse:
        """
        Authenticate with OAuth provider
        Atomic operation: single responsibility authentication
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/auth/authenticate",
                    json=request.model_dump(exclude_none=True),
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return AuthResponse(**response.json())
        except httpx.HTTPStatusError as e:
            raise AuthServiceError(f"Authentication failed: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            raise AuthServiceError(f"Authentication failed: {str(e)}")
    
    async def check_oauth_token_exists(self, user_id: str, provider: str) -> bool:
        """
        Check if OAuth token exists for user
        Atomic operation: single responsibility token check
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/auth/check-oauth-token-exists",
                    params={"user_id": user_id, "provider": provider},
                    headers=self.headers,
                    timeout=10.0
                )
                return response.json().get("exists", False)
        except Exception:
            return False
    
    async def list_oauth_providers(self) -> List[OAuthProvider]:
        """
        List OAuth providers
        Atomic operation: single responsibility provider listing
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/auth/list-oauth-providers",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                providers_data = response.json().get("providers", [])
                return [OAuthProvider(**provider) for provider in providers_data]
        except Exception as e:
            raise AuthServiceError(f"Failed to list OAuth providers: {str(e)}")
    
    async def get_oauth_provider(self, provider_id: str) -> Optional[OAuthProvider]:
        """
        Get specific OAuth provider
        Atomic operation: single responsibility provider retrieval
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/auth/get-oauth-provider",
                    params={"providerId": provider_id},
                    headers=self.headers,
                    timeout=10.0
                )
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                provider_data = response.json().get("provider")
                return OAuthProvider(**provider_data) if provider_data else None
        except Exception:
            return None
    
    async def list_oauth_tokens_for_user(self, user_id: str) -> List[OAuthToken]:
        """
        List OAuth tokens for user
        Atomic operation: single responsibility token listing
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/auth/list-oauth-tokens-for-user",
                    params={"user_id": user_id},
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                tokens_data = response.json().get("tokens", [])
                return [OAuthToken(**token) for token in tokens_data]
        except Exception as e:
            raise AuthServiceError(f"Failed to list OAuth tokens: {str(e)}")
    
    async def delete_oauth_token(self, token_id: str, user_id: str) -> bool:
        """
        Delete OAuth token
        Atomic operation: single responsibility token deletion
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/v2/auth/delete-single-oauth-token",
                    json={"token_id": token_id, "user_id": user_id},
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return True
        except Exception:
            return False
    
    async def wait_for_auth_completion(
        self, 
        auth_id: str, 
        max_wait_time: int = 300000, 
        poll_interval: int = 2000
    ) -> AuthResponse:
        """
        Wait for authentication completion
        Atomic operation: single responsibility auth completion monitoring
        """
        start_time = datetime.now(timezone.utc)
        
        while True:
            elapsed = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            if elapsed > max_wait_time:
                raise AuthServiceError("Authentication timed out")
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.base_url}/v2/auth/wait-for-auth-completion",
                        params={"auth_id": auth_id},
                        headers=self.headers,
                        timeout=10.0
                    )
                    response.raise_for_status()
                    result = AuthResponse(**response.json())
                    
                    if result.status in ["completed", "connection_required", "token_expired"]:
                        return result
                    
                    await asyncio.sleep(poll_interval / 1000)
                    
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    await asyncio.sleep(poll_interval / 1000)
                    continue
                raise AuthServiceError(f"Auth completion check failed: {e.response.text}")
            except Exception as e:
                raise AuthServiceError(f"Auth completion check failed: {str(e)}")


# Singleton instance
auth_service = AuthService()
