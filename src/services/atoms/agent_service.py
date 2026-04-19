"""
Agent Service - Atomic Component
Basic agent connection service atom following Atomic Design principles
Can't be broken down further without ceasing to be functional
"""

import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timezone
import httpx
from pydantic import BaseModel, Field


class CreateConnectionRequest(BaseModel):
    """Create connection request model"""
    oauth_token_id: str


class AgentConnection(BaseModel):
    """Agent connection model"""
    id: str
    agent_id: str
    oauth_token_id: str
    provider_id: str
    provider_account_label: str
    scopes: List[str]
    expires_at: Optional[str] = None
    created_by: str
    created_at: str


class AgentDeployment(BaseModel):
    """Agent deployment model"""
    id: str
    name: str
    description: Optional[str] = None
    status: str = "active"  # active, inactive, deploying, failed
    config: Dict[str, Any] = Field(default_factory=dict)
    created_at: str
    updated_at: str


class AgentServiceError(Exception):
    """Custom exception for agent service errors"""
    pass


class AgentService:
    """
    Atomic agent service for LangChain integration
    Handles basic agent operations with LangChain API
    """
    
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or "https://api.langchain.com"
        self.api_key = api_key or ""
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
    
    async def create_connection(self, agent_id: str, request: CreateConnectionRequest) -> AgentConnection:
        """
        Create agent connection
        Atomic operation: single responsibility connection creation
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/auth/agents/{agent_id}/connections",
                    json=request.model_dump(),
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return AgentConnection(**response.json())
        except httpx.HTTPStatusError as e:
            raise AgentServiceError(f"Failed to create agent connection: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            raise AgentServiceError(f"Failed to create agent connection: {str(e)}")
    
    async def list_connections(self, agent_id: str) -> List[AgentConnection]:
        """
        List agent connections
        Atomic operation: single responsibility connection listing
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/auth/agents/{agent_id}/connections",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                connections_data = response.json().get("connections", [])
                return [AgentConnection(**conn) for conn in connections_data]
        except Exception as e:
            raise AgentServiceError(f"Failed to list agent connections: {str(e)}")
    
    async def remove_connection(self, agent_id: str, connection_id: str) -> bool:
        """
        Remove agent connection
        Atomic operation: single responsibility connection removal
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/v2/auth/agents/{agent_id}/connections/{connection_id}",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return True
        except Exception:
            return False
    
    async def create_deployment(self, config: Dict[str, Any]) -> AgentDeployment:
        """
        Create agent deployment
        Atomic operation: single responsibility deployment creation
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/deployments",
                    json=config,
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return AgentDeployment(**response.json())
        except httpx.HTTPStatusError as e:
            raise AgentServiceError(f"Failed to create deployment: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            raise AgentServiceError(f"Failed to create deployment: {str(e)}")
    
    async def list_deployments(self) -> List[AgentDeployment]:
        """
        List agent deployments
        Atomic operation: single responsibility deployment listing
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/deployments",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                deployments_data = response.json().get("deployments", [])
                return [AgentDeployment(**deployment) for deployment in deployments_data]
        except Exception as e:
            raise AgentServiceError(f"Failed to list deployments: {str(e)}")
    
    async def get_deployment(self, deployment_id: str) -> Optional[AgentDeployment]:
        """
        Get deployment details
        Atomic operation: single responsibility deployment retrieval
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/deployments/{deployment_id}",
                    headers=self.headers,
                    timeout=10.0
                )
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                deployment_data = response.json().get("deployment")
                return AgentDeployment(**deployment_data) if deployment_data else None
        except Exception:
            return None
    
    async def delete_deployment(self, deployment_id: str) -> bool:
        """
        Delete deployment
        Atomic operation: single responsibility deployment deletion
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/v2/deployments/{deployment_id}",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return True
        except Exception:
            return False
    
    async def patch_deployment(self, deployment_id: str, config: Dict[str, Any]) -> Optional[AgentDeployment]:
        """
        Update deployment
        Atomic operation: single responsibility deployment update
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/v2/deployments/{deployment_id}",
                    json=config,
                    headers=self.headers,
                    timeout=30.0
                )
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                deployment_data = response.json()
                return AgentDeployment(**deployment_data)
        except Exception:
            return None
    
    async def get_deployment_revisions(self, deployment_id: str) -> List[Dict[str, Any]]:
        """
        Get deployment revisions
        Atomic operation: single responsibility revision listing
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/deployments/{deployment_id}/revisions",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json().get("revisions", [])
        except Exception as e:
            raise AgentServiceError(f"Failed to get deployment revisions: {str(e)}")
    
    async def redeploy_revision(self, deployment_id: str, revision_id: str) -> Optional[AgentDeployment]:
        """
        Redeploy a specific revision
        Atomic operation: single responsibility redeployment
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/deployments/{deployment_id}/revisions/{revision_id}/redeploy",
                    headers=self.headers,
                    timeout=30.0
                )
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                deployment_data = response.json()
                return AgentDeployment(**deployment_data)
        except Exception:
            return None


# Singleton instance
agent_service = AgentService()
