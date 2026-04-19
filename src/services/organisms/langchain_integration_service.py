"""
LangChain Integration Service - Organism Component
Combines molecules into complete LangChain integration functionality
Relatively complex UI components composed of groups of molecules and/or atoms
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from ..molecules.auth_flow_manager import (
    AuthFlowManager,
    AuthFlowConfig,
    AuthFlowResult,
    AuthFlowManagerError
)
from ..molecules.agent_connection_manager import (
    AgentConnectionManager,
    AgentManagementConfig,
    AgentConnectionResult,
    AgentConnectionManagerError
)
from ..atoms.auth_service import OAuthProvider, OAuthToken
from ..atoms.agent_service import AgentDeployment


class LangChainConfig(BaseModel):
    """LangChain integration configuration"""
    api_url: str = "https://api.langchain.com"
    api_key: str = ""
    default_scopes: List[str] = Field(default_factory=lambda: ["read", "write"])
    timeout_ms: int = 300000


class UserIntegration(BaseModel):
    """User integration model"""
    user_id: str
    providers: List[str] = Field(default_factory=list)
    agents: List[str] = Field(default_factory=list)
    deployments: List[str] = Field(default_factory=list)
    last_sync: str
    status: str = "active"  # active, inactive, error


class IntegrationMetrics(BaseModel):
    """Integration metrics model"""
    total_connections: int = 0
    active_connections: int = 0
    total_deployments: int = 0
    active_deployments: int = 0
    errors: int = 0
    last_activity: str


class HealthCheckResult(BaseModel):
    """Health check result model"""
    status: str = "healthy"  # healthy, degraded, unhealthy
    checks: Dict[str, bool] = Field(default_factory=dict)
    details: Dict[str, str] = Field(default_factory=dict)


class LangChainIntegrationServiceError(Exception):
    """Custom exception for LangChain integration service errors"""
    pass


class LangChainIntegrationService:
    """
    Organism-level LangChain integration service
    Combines authentication, agent management, and deployment functionality
    Forms distinct sections of the integration interface
    """
    
    def __init__(
        self,
        config: Optional[LangChainConfig] = None,
        auth_flow_manager: Optional[AuthFlowManager] = None,
        agent_connection_manager: Optional[AgentConnectionManager] = None
    ):
        self.config = config or LangChainConfig()
        self.auth_flow_manager = auth_flow_manager or AuthFlowManager()
        self.agent_connection_manager = agent_connection_manager or AgentConnectionManager()
    
    async def initialize_user_integration(self, user_id: str, providers: List[str]) -> UserIntegration:
        """
        Initialize complete user integration
        Organism operation: combines multiple molecular operations
        """
        try:
            available_providers = await self.auth_flow_manager.get_available_providers()
            valid_providers = [
                provider for provider in providers 
                if any(ap.provider == provider for ap in available_providers)
            ]
            
            integration = UserIntegration(
                user_id=user_id,
                providers=valid_providers,
                agents=[],
                deployments=[],
                last_sync=datetime.now(timezone.utc).isoformat(),
                status="active",
            )
            
            return integration
            
        except Exception as e:
            raise LangChainIntegrationServiceError(f"Failed to initialize user integration: {str(e)}")
    
    async def setup_complete_agent(self, config: AgentManagementConfig) -> Dict[str, Any]:
        """
        Setup complete agent with authentication and deployment
        Organism operation: combines molecular operations into complete workflow
        """
        try:
            # Setup agent with connections
            connection_result = await self.agent_connection_manager.setup_agent(config)
            
            if not connection_result.success:
                return {
                    "success": False,
                    "error": connection_result.error,
                }
            
            # If deployment was created, verify it's active
            if connection_result.deployment:
                deployment = await self.agent_connection_manager.get_agent_deployment_status(
                    connection_result.deployment.id
                )
                
                if not deployment or deployment.status != "active":
                    return {
                        "success": False,
                        "error": "Agent setup succeeded but deployment is not active",
                    }
            
            return {"success": True}
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to setup complete agent: {str(e)}",
            }
    
    async def get_integration_metrics(self, user_id: Optional[str] = None) -> IntegrationMetrics:
        """
        Get integration metrics for monitoring
        Organism operation: combines data from multiple sources
        """
        try:
            # Get all deployments
            deployments = await self.agent_connection_manager.get_agent_deployments()
            active_deployments = [d for d in deployments if d.status == "active"]
            
            # Get connections for user if provided
            total_connections = 0
            active_connections = 0
            
            if user_id:
                # This would require iterating through user's agents to get connections
                # For now, we'll use placeholder logic
                total_connections = 0
                active_connections = 0
            
            return IntegrationMetrics(
                total_connections=total_connections,
                active_connections=active_connections,
                total_deployments=len(deployments),
                active_deployments=len(active_deployments),
                errors=0,  # Would be calculated from error logs
                last_activity=datetime.now(timezone.utc).isoformat(),
            )
            
        except Exception as e:
            raise LangChainIntegrationServiceError(f"Failed to get integration metrics: {str(e)}")
    
    async def perform_health_check(self) -> HealthCheckResult:
        """
        Health check for entire integration
        Organism operation: combines multiple health checks
        """
        checks: Dict[str, bool] = {}
        details: Dict[str, str] = {}
        
        try:
            # Check API connectivity
            try:
                providers = await self.auth_flow_manager.get_available_providers()
                checks["api"] = True
                details["api"] = "API connectivity successful"
            except Exception as e:
                checks["api"] = False
                details["api"] = f"API connectivity failed: {str(e)}"
            
            # Check configuration
            checks["config"] = bool(self.config.api_url and self.config.api_key)
            details["config"] = "Configuration valid" if checks["config"] else "Missing API URL or key"
            
            # Check timeout settings
            checks["timeout"] = self.config.timeout_ms > 0
            details["timeout"] = f"Timeout set to {self.config.timeout_ms}ms" if checks["timeout"] else "Invalid timeout setting"
            
            # Determine overall status
            failed_checks = sum(1 for check in checks.values() if not check)
            
            if failed_checks == 0:
                status = "healthy"
            elif failed_checks <= 1:
                status = "degraded"
            else:
                status = "unhealthy"
            
            return HealthCheckResult(
                status=status,
                checks=checks,
                details=details,
            )
            
        except Exception as e:
            return HealthCheckResult(
                status="unhealthy",
                details={"error": f"Health check failed: {str(e)}"},
            )
    
    async def cleanup_user_integration(self, user_id: str) -> Dict[str, Any]:
        """
        Cleanup user integration
        Organism operation: combines multiple cleanup operations
        """
        cleaned: List[str] = []
        errors: List[str] = []
        
        try:
            # Get user's OAuth tokens
            tokens = await self.auth_flow_manager.get_user_tokens(user_id)
            
            # Revoke all tokens
            for token in tokens:
                try:
                    revoked = await self.auth_flow_manager.revoke_authentication(user_id, token.provider_id)
                    if revoked:
                        cleaned.append(f"Token for {token.provider_id}")
                    else:
                        errors.append(f"Failed to revoke token for {token.provider_id}")
                except Exception as e:
                    errors.append(f"Error revoking token for {token.provider_id}: {str(e)}")
            
            # Note: In a real implementation, you would also clean up agent connections and deployments
            # This would require tracking which agents belong to which users
            
            return {
                "success": len(errors) == 0,
                "cleaned": cleaned,
                "errors": errors,
            }
            
        except Exception as e:
            return {
                "success": False,
                "cleaned": cleaned,
                "errors": [*errors, f"Cleanup failed: {str(e)}"],
            }
    
    async def sync_user_integrations(self, user_id: str) -> Dict[str, Any]:
        """
        Sync user integrations
        Organism operation: combines sync operations across providers
        """
        synced: List[str] = []
        failed: List[str] = []
        errors: List[str] = []
        
        try:
            providers = await self.auth_flow_manager.get_available_providers()
            
            for provider in providers:
                if not provider.is_active:
                    continue
                
                try:
                    # Check if user has valid token for this provider
                    has_token = await self.auth_flow_manager.validate_token(user_id, provider.provider)
                    
                    if has_token:
                        synced.append(provider.provider)
                    else:
                        failed.append(provider.provider)
                except Exception as e:
                    errors.append(f"{provider.provider}: {str(e)}")
            
            return {"synced": synced, "failed": failed, "errors": errors}
            
        except Exception as e:
            return {
                "synced": synced,
                "failed": failed,
                "errors": [*errors, f"Sync failed: {str(e)}"],
            }
    
    async def get_user_integration_summary(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive user integration summary
        Organism operation: combines multiple data sources for user overview
        """
        try:
            # Get user tokens
            tokens = await self.auth_flow_manager.get_user_tokens(user_id)
            
            # Get integration metrics
            metrics = await self.get_integration_metrics(user_id)
            
            # Get health status
            health = await self.perform_health_check()
            
            # Calculate provider status
            provider_status = {}
            for token in tokens:
                provider_status[token.provider_id] = {
                    "has_token": True,
                    "token_valid": self._is_token_valid(token),
                    "expires_at": token.expires_at,
                    "scopes": token.scopes,
                }
            
            return {
                "user_id": user_id,
                "total_providers": len(set(token.provider_id for token in tokens)),
                "active_providers": len([
                    token for token in tokens 
                    if self._is_token_valid(token)
                ]),
                "provider_status": provider_status,
                "metrics": metrics.model_dump(),
                "health": health.model_dump(),
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }
            
        except Exception as e:
            raise LangChainIntegrationServiceError(f"Failed to get user integration summary: {str(e)}")
    
    async def refresh_all_user_tokens(self, user_id: str) -> Dict[str, Any]:
        """
        Refresh all user tokens
        Organism operation: combines multiple token refresh operations
        """
        refreshed: List[str] = []
        failed: List[str] = []
        errors: List[str] = []
        
        try:
            tokens = await self.auth_flow_manager.get_user_tokens(user_id)
            
            for token in tokens:
                try:
                    auth_config = AuthFlowConfig(
                        provider=token.provider_id,
                        scopes=token.scopes,
                        user_id=user_id,
                        force_new=True,
                    )
                    
                    result = await self.auth_flow_manager.execute_auth_flow(auth_config)
                    
                    if result.success:
                        refreshed.append(token.provider_id)
                    else:
                        failed.append(token.provider_id)
                        
                except Exception as e:
                    errors.append(f"{token.provider_id}: {str(e)}")
            
            return {"refreshed": refreshed, "failed": failed, "errors": errors}
            
        except Exception as e:
            return {
                "refreshed": refreshed,
                "failed": failed,
                "errors": [*errors, f"Refresh failed: {str(e)}"],
            }
    
    def get_config(self) -> LangChainConfig:
        """Get current configuration"""
        return self.config
    
    def update_config(self, new_config: Dict[str, Any]) -> None:
        """Update configuration"""
        config_dict = self.config.model_dump()
        config_dict.update(new_config)
        self.config = LangChainConfig(**config_dict)
    
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
langchain_integration_service = LangChainIntegrationService()
