"""
Auth Flow Manager - Molecular Component
Combines authentication atoms into a functional authentication flow
Groups of atoms bonded together that take on distinct new properties
"""

import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from ..atoms.auth_service import (
    AuthService, 
    AuthRequest, 
    AuthResponse, 
    OAuthProvider, 
    OAuthToken,
    AuthServiceError
)


class AuthFlowConfig(BaseModel):
    """Authentication flow configuration"""
    provider: str
    scopes: List[str]
    user_id: str
    agent_id: Optional[str] = None
    force_new: bool = False
    is_default: bool = False


class AuthFlowResult(BaseModel):
    """Authentication flow result"""
    success: bool
    status: str
    auth_url: Optional[str] = None
    token: Optional[str] = None
    auth_id: Optional[str] = None
    error: Optional[str] = None


class AuthFlowManagerError(Exception):
    """Custom exception for auth flow manager errors"""
    pass


class AuthFlowManager:
    """
    Molecular authentication flow manager
    Combines atomic auth operations into a cohesive authentication flow
    Follows single responsibility principle for flow management
    """
    
    def __init__(self, auth_service: Optional[AuthService] = None):
        self.auth_service = auth_service or AuthService()
    
    async def execute_auth_flow(self, config: AuthFlowConfig) -> AuthFlowResult:
        """
        Complete authentication flow from start to finish
        Molecular operation: combines multiple atomic operations
        """
        try:
            # Step 1: Check if token already exists
            token_exists = await self.auth_service.check_oauth_token_exists(
                config.user_id,
                config.provider
            )
            
            if token_exists and not config.force_new:
                # Token exists, retrieve it
                tokens = await self.auth_service.list_oauth_tokens_for_user(config.user_id)
                existing_token = self._find_existing_token(tokens, config)
                
                if existing_token and self._is_token_valid(existing_token):
                    return AuthFlowResult(
                        success=True,
                        status="completed",
                        token=existing_token.token,
                        auth_id=existing_token.id,
                    )
            
            # Step 2: Start authentication process
            auth_request = AuthRequest(
                provider=config.provider,
                scopes=config.scopes,
                user_id=config.user_id,
                agent_id=config.agent_id,
                force_new=config.force_new,
                is_default=config.is_default,
            )
            
            auth_response = await self.auth_service.authenticate(auth_request)
            
            # Step 3: Handle response based on status
            if auth_response.status == "completed":
                return AuthFlowResult(
                    success=True,
                    status="completed",
                    token=auth_response.token,
                    auth_id=auth_response.auth_id,
                )
            elif auth_response.status in ["pending", "connection_required"]:
                return AuthFlowResult(
                    success=False,
                    status=auth_response.status,
                    auth_url=auth_response.url,
                    auth_id=auth_response.auth_id,
                )
            elif auth_response.status == "token_expired":
                return AuthFlowResult(
                    success=False,
                    status="token_expired",
                    error="Authentication token has expired",
                )
            else:
                return AuthFlowResult(
                    success=False,
                    status="error",
                    error="Unknown authentication status",
                )
                
        except AuthServiceError as e:
            return AuthFlowResult(
                success=False,
                status="error",
                error=str(e),
            )
        except Exception as e:
            return AuthFlowResult(
                success=False,
                status="error",
                error=f"Authentication flow failed: {str(e)}",
            )
    
    async def wait_for_auth_completion(
        self,
        auth_id: str,
        max_wait_time: int = 300000,  # 5 minutes
        poll_interval: int = 2000     # 2 seconds
    ) -> AuthFlowResult:
        """
        Wait for authentication completion
        Molecular operation: combines polling with status checking
        """
        try:
            auth_response = await self.auth_service.wait_for_auth_completion(
                auth_id,
                max_wait_time,
                poll_interval
            )
            
            if auth_response.status == "completed":
                return AuthFlowResult(
                    success=True,
                    status="completed",
                    token=auth_response.token,
                    auth_id=auth_response.auth_id,
                )
            else:
                return AuthFlowResult(
                    success=False,
                    status=auth_response.status,
                    error=f"Authentication not completed: {auth_response.status}",
                )
                
        except AuthServiceError as e:
            return AuthFlowResult(
                success=False,
                status="error",
                error=str(e),
            )
        except Exception as e:
            return AuthFlowResult(
                success=False,
                status="error",
                error=f"Auth completion check failed: {str(e)}",
            )
    
    async def get_available_providers(self) -> List[OAuthProvider]:
        """
        Get available OAuth providers
        Molecular operation: combines provider listing with filtering
        """
        try:
            providers = await self.auth_service.list_oauth_providers()
            return [provider for provider in providers if provider.is_active]
        except Exception as e:
            raise AuthFlowManagerError(f"Failed to get available providers: {str(e)}")
    
    async def revoke_authentication(self, user_id: str, provider: str) -> bool:
        """
        Revoke authentication for a provider
        Molecular operation: combines token listing with deletion
        """
        try:
            tokens = await self.auth_service.list_oauth_tokens_for_user(user_id)
            provider_tokens = [token for token in tokens if token.provider_id == provider]
            
            success = True
            for token in provider_tokens:
                deleted = await self.auth_service.delete_oauth_token(token.id, user_id)
                if not deleted:
                    success = False
            
            return success
        except Exception:
            return False
    
    async def refresh_token(self, config: AuthFlowConfig) -> AuthFlowResult:
        """
        Refresh authentication token
        Molecular operation: combines revocation with re-authentication
        """
        # First revoke existing authentication
        await self.revoke_authentication(config.user_id, config.provider)
        
        # Then re-authenticate with force_new: true
        refresh_config = config.model_copy(update={"force_new": True})
        return await self.execute_auth_flow(refresh_config)
    
    async def get_user_tokens(self, user_id: str, provider: Optional[str] = None) -> List[OAuthToken]:
        """
        Get user tokens with optional provider filtering
        Molecular operation: combines token listing with filtering
        """
        try:
            tokens = await self.auth_service.list_oauth_tokens_for_user(user_id)
            
            if provider:
                tokens = [token for token in tokens if token.provider_id == provider]
            
            return tokens
        except Exception as e:
            raise AuthFlowManagerError(f"Failed to get user tokens: {str(e)}")
    
    async def validate_token(self, user_id: str, provider: str) -> bool:
        """
        Validate if user has valid token for provider
        Molecular operation: combines token checking with validation
        """
        try:
            tokens = await self.get_user_tokens(user_id, provider)
            return any(self._is_token_valid(token) for token in tokens)
        except Exception:
            return False
    
    def _find_existing_token(self, tokens: List[OAuthToken], config: AuthFlowConfig) -> Optional[OAuthToken]:
        """Find existing token based on configuration"""
        for token in tokens:
            if token.provider_id == config.provider:
                if config.is_default and token.label == "default":
                    return token
                elif not config.is_default:
                    return token
        return None
    
    def _is_token_valid(self, token: OAuthToken) -> bool:
        """Check if token is still valid"""
        if not token.expires_at:
            return True  # Token doesn't expire
        
        try:
            expiry_time = datetime.fromisoformat(token.expires_at.replace('Z', '+00:00'))
            return expiry_time > datetime.now(timezone.utc)
        except (ValueError, AttributeError):
            return True  # Assume valid if we can't parse the expiry time


# Singleton instance
auth_flow_manager = AuthFlowManager()
