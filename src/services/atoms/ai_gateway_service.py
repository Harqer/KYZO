"""
AI Gateway Service - Atomic Component
Provides unified access to AI models through Vercel AI Gateway
Basic building block for AI model integration
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import structlog
import asyncio
import httpx
import json

logger = structlog.get_logger(__name__)


class AIModel(BaseModel):
    """AI model configuration"""
    id: str
    provider: str
    name: str
    description: str
    max_tokens: int
    pricing_per_1k_tokens: float
    capabilities: List[str] = Field(default_factory=list)


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # system, user, assistant
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    """Chat request model"""
    model_id: str
    messages: List[ChatMessage]
    max_tokens: Optional[int] = None
    temperature: float = 0.7
    stream: bool = False
    tools: Optional[List[Dict[str, Any]]] = None


class ChatResponse(BaseModel):
    """Chat response model"""
    id: str
    model: str
    provider: str
    content: str
    usage: Dict[str, int] = Field(default_factory=dict)
    finish_reason: str
    created_at: str
    response_time_ms: int


class GatewayConfig(BaseModel):
    """AI Gateway configuration"""
    base_url: str = "https://api.vercel.ai"
    api_key: str = "test-key"  # Default test key for development
    timeout_ms: int = 30000
    max_retries: int = 3
    retry_delay_ms: int = 1000
    default_model: str = "openai:gpt-3.5-turbo"


class AIGatewayServiceError(Exception):
    """Custom exception for AI Gateway service errors"""
    pass


class AIGatewayService:
    """
    Atomic component for AI Gateway services
    Provides unified access to AI models through Vercel AI Gateway
    Basic building block that can't be broken down further
    """
    
    def __init__(self, config: Optional[GatewayConfig] = None):
        self.config = config or GatewayConfig()
        self.http_client: Optional[httpx.AsyncClient] = None
        self.available_models: Dict[str, AIModel] = {}
        self.request_history: List[Dict[str, Any]] = []
        
        # Initialize available models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize available AI models"""
        self.available_models = {
            "openai:gpt-4": AIModel(
                id="openai:gpt-4",
                provider="openai",
                name="GPT-4",
                description="Most capable GPT-4 model for complex tasks",
                max_tokens=8192,
                pricing_per_1k_tokens=0.03,
                capabilities=["chat", "function-calling", "code-generation", "analysis"]
            ),
            "openai:gpt-3.5-turbo": AIModel(
                id="openai:gpt-3.5-turbo",
                provider="openai",
                name="GPT-3.5 Turbo",
                description="Fast and efficient model for most tasks",
                max_tokens=4096,
                pricing_per_1k_tokens=0.002,
                capabilities=["chat", "code-generation", "analysis"]
            ),
            "anthropic:claude-3-opus": AIModel(
                id="anthropic:claude-3-opus",
                provider="anthropic",
                name="Claude 3 Opus",
                description="Most capable Claude model for complex reasoning",
                max_tokens=4096,
                pricing_per_1k_tokens=0.015,
                capabilities=["chat", "analysis", "writing", "coding"]
            ),
            "anthropic:claude-3-sonnet": AIModel(
                id="anthropic:claude-3-sonnet",
                provider="anthropic",
                name="Claude 3 Sonnet",
                description="Balanced model for most use cases",
                max_tokens=4096,
                pricing_per_1k_tokens=0.003,
                capabilities=["chat", "analysis", "writing", "coding"]
            ),
            "google:gemini-pro": AIModel(
                id="google:gemini-pro",
                provider="google",
                name="Gemini Pro",
                description="Google's multimodal AI model",
                max_tokens=8192,
                pricing_per_1k_tokens=0.0005,
                capabilities=["chat", "multimodal", "code-generation", "analysis"]
            ),
        }
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self.http_client is None:
            self.http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.config.timeout_ms / 1000),
                headers={
                    "Authorization": f"Bearer {self.config.api_key}",
                    "Content-Type": "application/json",
                }
            )
        return self.http_client
    
    async def chat_completion(self, request: ChatRequest) -> ChatResponse:
        """
        Generate chat completion
        Atomic operation: generates a single chat response
        """
        start_time = datetime.now(timezone.utc)
        
        try:
            # Validate request
            await self._validate_chat_request(request)
            
            # Get model info
            model = self.available_models.get(request.model_id)
            if not model:
                raise AIGatewayServiceError(f"Model not found: {request.model_id}")
            
            # Prepare request payload
            payload = {
                "model": request.model_id,
                "messages": [
                    {"role": msg.role, "content": msg.content}
                    for msg in request.messages
                ],
                "max_tokens": request.max_tokens or model.max_tokens,
                "temperature": request.temperature,
                "stream": request.stream,
            }
            
            if request.tools:
                payload["tools"] = request.tools
            
            # Make request to AI Gateway
            client = await self._get_http_client()
            
            for attempt in range(self.config.max_retries):
                try:
                    response = await client.post(
                        f"{self.config.base_url}/v1/chat/completions",
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Parse response
                        chat_response = ChatResponse(
                            id=data.get("id", ""),
                            model=data.get("model", request.model_id),
                            provider=model.provider,
                            content=data["choices"][0]["message"]["content"],
                            usage=data.get("usage", {}),
                            finish_reason=data["choices"][0].get("finish_reason", "stop"),
                            created_at=datetime.now(timezone.utc).isoformat(),
                            response_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
                        )
                        
                        # Record request
                        await self._record_request(request, chat_response, attempt + 1)
                        
                        logger.info(
                            "Chat completion successful",
                            model=request.model_id,
                            response_time_ms=chat_response.response_time_ms,
                            tokens_used=chat_response.usage.get("total_tokens", 0)
                        )
                        
                        return chat_response
                    
                    elif response.status_code in [429, 502, 503, 504]:
                        # Retry on rate limit or server errors
                        if attempt < self.config.max_retries - 1:
                            await asyncio.sleep(self.config.retry_delay_ms / 1000)
                            continue
                        else:
                            raise AIGatewayServiceError(f"Request failed after {attempt + 1} attempts")
                    
                    else:
                        error_data = response.json() if response.headers.get("content-type") == "application/json" else {}
                        raise AIGatewayServiceError(f"API error: {response.status_code} - {error_data.get('error', 'Unknown error')}")
                
                except httpx.RequestError as e:
                    if attempt < self.config.max_retries - 1:
                        await asyncio.sleep(self.config.retry_delay_ms / 1000)
                        continue
                    else:
                        raise AIGatewayServiceError(f"Network error after {attempt + 1} attempts: {str(e)}")
            
        except Exception as e:
            logger.error("Chat completion failed", model=request.model_id, error=str(e))
            raise AIGatewayServiceError(f"Chat completion failed: {str(e)}")
    
    async def _validate_chat_request(self, request: ChatRequest) -> None:
        """Validate chat request"""
        if not request.messages:
            raise AIGatewayServiceError("No messages provided")
        
        if not request.model_id:
            raise AIGatewayServiceError("No model specified")
        
        if request.model_id not in self.available_models:
            raise AIGatewayServiceError(f"Model not available: {request.model_id}")
        
        # Validate message roles
        valid_roles = ["system", "user", "assistant"]
        for message in request.messages:
            if message.role not in valid_roles:
                raise AIGatewayServiceError(f"Invalid message role: {message.role}")
        
        # Validate temperature
        if not 0 <= request.temperature <= 2:
            raise AIGatewayServiceError("Temperature must be between 0 and 2")
        
        # Validate max tokens
        model = self.available_models[request.model_id]
        max_tokens = request.max_tokens or model.max_tokens
        if max_tokens > model.max_tokens:
            raise AIGatewayServiceError(f"Max tokens exceeds model limit: {model.max_tokens}")
    
    async def _record_request(self, request: ChatRequest, response: ChatResponse, attempts: int) -> None:
        """Record request for analytics"""
        try:
            record = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "model_id": request.model_id,
                "message_count": len(request.messages),
                "max_tokens": request.max_tokens,
                "temperature": request.temperature,
                "stream": request.stream,
                "response_id": response.id,
                "finish_reason": response.finish_reason,
                "response_time_ms": response.response_time_ms,
                "tokens_used": response.usage.get("total_tokens", 0),
                "attempts": attempts,
                "success": True,
            }
            
            self.request_history.append(record)
            
            # Keep history manageable
            if len(self.request_history) > 1000:
                self.request_history = self.request_history[-500:]
                
        except Exception as e:
            logger.error("Failed to record request", error=str(e))
    
    async def stream_chat_completion(self, request: ChatRequest):
        """
        Stream chat completion
        Atomic operation: streams a single chat response
        """
        try:
            # Set stream mode
            request.stream = True
            
            # Validate request
            await self._validate_chat_request(request)
            
            # Get model info
            model = self.available_models.get(request.model_id)
            if not model:
                raise AIGatewayServiceError(f"Model not found: {request.model_id}")
            
            # Prepare request payload
            payload = {
                "model": request.model_id,
                "messages": [
                    {"role": msg.role, "content": msg.content}
                    for msg in request.messages
                ],
                "max_tokens": request.max_tokens or model.max_tokens,
                "temperature": request.temperature,
                "stream": True,
            }
            
            if request.tools:
                payload["tools"] = request.tools
            
            # Make streaming request
            client = await self._get_http_client()
            
            async with client.stream(
                "POST",
                f"{self.config.base_url}/v1/chat/completions",
                json=payload
            ) as response:
                if response.status_code != 200:
                    error_data = await response.aread()
                    raise AIGatewayServiceError(f"Streaming error: {response.status_code} - {error_data.decode()}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        
                        if data == "[DONE]":
                            break
                        
                        try:
                            chunk = json.loads(data)
                            yield chunk
                        except json.JSONDecodeError:
                            continue
            
        except Exception as e:
            logger.error("Stream chat completion failed", model=request.model_id, error=str(e))
            raise AIGatewayServiceError(f"Stream chat completion failed: {str(e)}")
    
    def get_available_models(self) -> Dict[str, AIModel]:
        """
        Get available AI models
        Atomic operation: retrieves model data
        """
        return self.available_models.copy()
    
    def get_model_info(self, model_id: str) -> Optional[AIModel]:
        """
        Get information about a specific model
        Atomic operation: retrieves single model data
        """
        return self.available_models.get(model_id)
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """
        Get usage statistics
        Atomic operation: retrieves statistics
        """
        try:
            if not self.request_history:
                return {
                    "total_requests": 0,
                    "successful_requests": 0,
                    "failed_requests": 0,
                    "average_response_time_ms": 0,
                    "total_tokens_used": 0,
                    "model_usage": {},
                    "daily_usage": {},
                }
            
            total_requests = len(self.request_history)
            successful_requests = len([r for r in self.request_history if r.get("success", False)])
            failed_requests = total_requests - successful_requests
            
            avg_response_time = 0
            if self.request_history:
                avg_response_time = sum(r.get("response_time_ms", 0) for r in self.request_history) / len(self.request_history)
            
            total_tokens = sum(r.get("tokens_used", 0) for r in self.request_history)
            
            # Model usage breakdown
            model_usage = {}
            for record in self.request_history:
                model_id = record.get("model_id", "unknown")
                if model_id not in model_usage:
                    model_usage[model_id] = {"requests": 0, "tokens": 0}
                model_usage[model_id]["requests"] += 1
                model_usage[model_id]["tokens"] += record.get("tokens_used", 0)
            
            # Daily usage
            daily_usage = {}
            for record in self.request_history:
                date = record.get("timestamp", "")[:10]  # Extract date part
                if date not in daily_usage:
                    daily_usage[date] = {"requests": 0, "tokens": 0}
                daily_usage[date]["requests"] += 1
                daily_usage[date]["tokens"] += record.get("tokens_used", 0)
            
            return {
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "failed_requests": failed_requests,
                "success_rate": successful_requests / total_requests if total_requests > 0 else 0,
                "average_response_time_ms": round(avg_response_time, 2),
                "total_tokens_used": total_tokens,
                "model_usage": model_usage,
                "daily_usage": daily_usage,
            }
            
        except Exception as e:
            logger.error("Failed to get usage stats", error=str(e))
            raise AIGatewayServiceError(f"Failed to get usage stats: {str(e)}")
    
    async def test_model_connectivity(self, model_id: str) -> Dict[str, Any]:
        """
        Test connectivity to a specific model
        Atomic operation: tests model connection
        """
        try:
            # Create simple test request
            test_request = ChatRequest(
                model_id=model_id,
                messages=[
                    ChatMessage(role="user", content="Hello, this is a connectivity test.")
                ],
                max_tokens=10
            )
            
            start_time = datetime.now(timezone.utc)
            
            try:
                response = await self.chat_completion(test_request)
                
                return {
                    "model_id": model_id,
                    "connected": True,
                    "response_time_ms": response.response_time_ms,
                    "tokens_used": response.usage.get("total_tokens", 0),
                    "error": None,
                }
                
            except Exception as e:
                response_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
                
                return {
                    "model_id": model_id,
                    "connected": False,
                    "response_time_ms": response_time,
                    "tokens_used": 0,
                    "error": str(e),
                }
                
        except Exception as e:
            logger.error("Model connectivity test failed", model_id=model_id, error=str(e))
            return {
                "model_id": model_id,
                "connected": False,
                "response_time_ms": 0,
                "tokens_used": 0,
                "error": str(e),
            }
    
    async def test_all_models(self) -> Dict[str, Dict[str, Any]]:
        """
        Test connectivity to all available models
        Atomic operation: tests all model connections
        """
        results = {}
        
        for model_id in self.available_models.keys():
            results[model_id] = await self.test_model_connectivity(model_id)
        
        return results
    
    def update_config(self, **kwargs) -> None:
        """
        Update gateway configuration
        Atomic operation: updates configuration
        """
        try:
            for key, value in kwargs.items():
                if hasattr(self.config, key):
                    setattr(self.config, key, value)
            
            # Recreate HTTP client if needed
            if self.http_client and any(key in kwargs for key in ["base_url", "api_key", "timeout_ms"]):
                asyncio.create_task(self._close_http_client())
            
            logger.info("Updated AI Gateway configuration", updates=list(kwargs.keys()))
            
        except Exception as e:
            logger.error("Failed to update configuration", error=str(e))
            raise AIGatewayServiceError(f"Failed to update configuration: {str(e)}")
    
    async def _close_http_client(self) -> None:
        """Close HTTP client"""
        if self.http_client:
            await self.http_client.aclose()
            self.http_client = None
    
    async def cleanup(self) -> None:
        """Cleanup resources"""
        await self._close_http_client()
        logger.info("AI Gateway service cleaned up")


# Singleton instance
ai_gateway_service = AIGatewayService()
