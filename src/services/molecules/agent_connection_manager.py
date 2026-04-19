"""
Agent Connection Manager - Molecular Component
Combines agent service atoms into a functional connection management system
Groups of atoms bonded together that take on distinct new properties
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pydantic import BaseModel, Field

from ..atoms.agent_service import (
    AgentService,
    AgentConnection,
    CreateConnectionRequest,
    AgentDeployment,
    AgentServiceError
)
from ..atoms.auth_service import OAuthToken
from .auth_flow_manager import (
    AuthFlowManager,
    AuthFlowConfig,
    AuthFlowResult,
    AuthFlowManagerError
)


class AgentConnectionConfig(BaseModel):
    """Agent connection configuration"""
    agent_id: str
    provider: str
    scopes: List[str]
    user_id: str
    provider_account_label: Optional[str] = None
    is_default: bool = False


class AgentConnectionResult(BaseModel):
    """Agent connection result"""
    success: bool
    connection: Optional[AgentConnection] = None
    deployment: Optional[AgentDeployment] = None
    error: Optional[str] = None


class AgentManagementConfig(BaseModel):
    """Complete agent management configuration"""
    name: str
    description: Optional[str] = None
    agent_id: str
    connections: List[AgentConnectionConfig] = Field(default_factory=list)
    deployment_config: Dict[str, Any] = Field(default_factory=dict)


class AgentConnectionManagerError(Exception):
    """Custom exception for agent connection manager errors"""
    pass


class AgentConnectionManager:
    """
    Molecular agent connection manager
    Combines atomic agent operations with authentication flows
    Follows single responsibility principle for connection management
    """
    
    def __init__(
        self,
        agent_service: Optional[AgentService] = None,
        auth_flow_manager: Optional[AuthFlowManager] = None
    ):
        self.agent_service = agent_service or AgentService()
        self.auth_flow_manager = auth_flow_manager or AuthFlowManager()
    
    async def create_agent_connection(self, config: AgentConnectionConfig) -> AgentConnectionResult:
        """
        Create complete agent connection with authentication
        Molecular operation: combines auth flow with connection creation
        """
        try:
            # Step 1: Authenticate with the provider
            auth_config = AuthFlowConfig(
                provider=config.provider,
                scopes=config.scopes,
                user_id=config.user_id,
                agent_id=config.agent_id,
                is_default=config.is_default,
            )
            
            auth_result = await self.auth_flow_manager.execute_auth_flow(auth_config)
            
            if not auth_result.success or auth_result.status != "completed":
                return AgentConnectionResult(
                    success=False,
                    error=auth_result.error or f"Authentication failed with status: {auth_result.status}",
                )
            
            if not auth_result.token:
                return AgentConnectionResult(
                    success=False,
                    error="Authentication succeeded but no token received",
                )
            
            # Step 2: Create the agent connection
            connection_request = CreateConnectionRequest(
                oauth_token_id=auth_result.token
            )
            
            connection = await self.agent_service.create_connection(config.agent_id, connection_request)
            
            return AgentConnectionResult(
                success=True,
                connection=connection,
            )
            
        except (AuthFlowManagerError, AgentServiceError) as e:
            return AgentConnectionResult(
                success=False,
                error=str(e),
            )
        except Exception as e:
            return AgentConnectionResult(
                success=False,
                error=f"Failed to create agent connection: {str(e)}",
            )
    
    async def setup_agent(self, config: AgentManagementConfig) -> AgentConnectionResult:
        """
        Setup complete agent with multiple connections
        Molecular operation: combines multiple connection creations
        """
        try:
            connections: List[AgentConnection] = []
            last_error: Optional[str] = None
            
            # Create all connections
            for connection_config in config.connections:
                result = await self.create_agent_connection(connection_config)
                
                if result.success and result.connection:
                    connections.append(result.connection)
                else:
                    last_error = result.error
                    # Continue trying other connections even if one fails
            
            if not connections:
                return AgentConnectionResult(
                    success=False,
                    error=last_error or "Failed to create any connections",
                )
            
            # Create deployment if config provided
            deployment: Optional[AgentDeployment] = None
            if config.deployment_config:
                try:
                    deployment_config = {
                        "name": config.name,
                        "description": config.description,
                        **config.deployment_config,
                    }
                    deployment = await self.agent_service.create_deployment(deployment_config)
                except Exception as e:
                    # Don't fail the whole operation if deployment fails
                    print(f"Warning: Deployment creation failed: {str(e)}")
            
            return AgentConnectionResult(
                success=True,
                connection=connections[0],  # Return first connection as primary
                deployment=deployment,
            )
            
        except Exception as e:
            return AgentConnectionResult(
                success=False,
                error=f"Failed to setup agent: {str(e)}",
            )
    
    async def get_agent_connections(self, agent_id: str) -> List[AgentConnection]:
        """
        Get all connections for an agent
        Molecular operation: combines connection listing with filtering
        """
        try:
            return await self.agent_service.list_connections(agent_id)
        except Exception as e:
            raise AgentConnectionManagerError(f"Failed to get agent connections: {str(e)}")
    
    async def remove_agent_connection(
        self, 
        agent_id: str, 
        connection_id: str, 
        user_id: str
    ) -> bool:
        """
        Remove agent connection and clean up authentication
        Molecular operation: combines connection removal with auth cleanup
        """
        try:
            # Get connection details before removal for cleanup
            connections = await self.agent_service.list_connections(agent_id)
            connection = next((c for c in connections if c.id == connection_id), None)
            
            # Remove the connection
            removed = await self.agent_service.remove_connection(agent_id, connection_id)
            
            # Clean up authentication if connection was found
            if connection and removed:
                await self.auth_flow_manager.revoke_authentication(user_id, connection.provider_id)
            
            return removed
        except Exception:
            return False
    
    async def refresh_agent_connection(
        self,
        agent_id: str,
        connection_id: str,
        user_id: str
    ) -> AgentConnectionResult:
        """
        Refresh agent connection
        Molecular operation: combines connection refresh with auth refresh
        """
        try:
            # Get current connection details
            connections = await self.agent_service.list_connections(agent_id)
            connection = next((c for c in connections if c.id == connection_id), None)
            
            if not connection:
                return AgentConnectionResult(
                    success=False,
                    error="Connection not found",
                )
            
            # Refresh authentication
            auth_config = AuthFlowConfig(
                provider=connection.provider_id,
                scopes=connection.scopes,
                user_id=user_id,
                agent_id=agent_id,
                is_default=True,
            )
            
            auth_result = await self.auth_flow_manager.refresh_token(auth_config)
            
            if not auth_result.success or auth_result.status != "completed":
                return AgentConnectionResult(
                    success=False,
                    error=auth_result.error or f"Authentication refresh failed with status: {auth_result.status}",
                )
            
            # Remove old connection and create new one
            await self.agent_service.remove_connection(agent_id, connection_id)
            
            connection_request = CreateConnectionRequest(
                oauth_token_id=auth_result.token
            )
            
            new_connection = await self.agent_service.create_connection(agent_id, connection_request)
            
            return AgentConnectionResult(
                success=True,
                connection=new_connection,
            )
            
        except Exception as e:
            return AgentConnectionResult(
                success=False,
                error=f"Failed to refresh agent connection: {str(e)}",
            )
    
    async def get_agent_deployment_status(self, deployment_id: str) -> Optional[AgentDeployment]:
        """
        Get agent deployment status
        Molecular operation: combines deployment retrieval with status checking
        """
        try:
            return await self.agent_service.get_deployment(deployment_id)
        except Exception:
            return None
    
    async def delete_agent(self, agent_id: str, user_id: str) -> bool:
        """
        Delete agent and all its connections
        Molecular operation: combines multiple deletions with cleanup
        """
        try:
            # Get all connections
            connections = await self.agent_service.list_connections(agent_id)
            
            # Remove all connections and clean up auth
            all_connections_removed = True
            for connection in connections:
                removed = await self.remove_agent_connection(agent_id, connection.id, user_id)
                if not removed:
                    all_connections_removed = False
            
            return all_connections_removed
        except Exception:
            return False
    
    async def get_agent_deployments(self) -> List[AgentDeployment]:
        """
        Get all agent deployments
        Molecular operation: combines deployment listing with filtering
        """
        try:
            return await self.agent_service.list_deployments()
        except Exception as e:
            raise AgentConnectionManagerError(f"Failed to get agent deployments: {str(e)}")
    
    async def update_agent_deployment(
        self,
        deployment_id: str,
        config: Dict[str, Any]
    ) -> Optional[AgentDeployment]:
        """
        Update agent deployment
        Molecular operation: combines deployment update with validation
        """
        try:
            return await self.agent_service.patch_deployment(deployment_id, config)
        except Exception:
            return None
    
    async def get_agent_health(self, agent_id: str) -> Dict[str, Any]:
        """
        Get comprehensive agent health status
        Molecular operation: combines multiple health checks
        """
        try:
            connections = await self.get_agent_connections(agent_id)
            
            health_status = {
                "agent_id": agent_id,
                "total_connections": len(connections),
                "healthy_connections": 0,
                "connection_details": [],
                "overall_health": "healthy",
            }
            
            for connection in connections:
                # Check if authentication is still valid
                is_healthy = await self.auth_flow_manager.validate_token(
                    connection.created_by,  # Using created_by as user_id placeholder
                    connection.provider_id
                )
                
                if is_healthy:
                    health_status["healthy_connections"] += 1
                
                health_status["connection_details"].append({
                    "connection_id": connection.id,
                    "provider": connection.provider_id,
                    "healthy": is_healthy,
                    "expires_at": connection.expires_at,
                })
            
            # Determine overall health
            if health_status["healthy_connections"] == 0:
                health_status["overall_health"] = "unhealthy"
            elif health_status["healthy_connections"] < health_status["total_connections"]:
                health_status["overall_health"] = "degraded"
            
            return health_status
            
        except Exception as e:
            return {
                "agent_id": agent_id,
                "overall_health": "error",
                "error": str(e),
            }


# Singleton instance
agent_connection_manager = AgentConnectionManager()
