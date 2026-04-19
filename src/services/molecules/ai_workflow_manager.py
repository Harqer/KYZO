"""
AI Workflow Manager - Molecular Component
Combines AI services into complete AI workflows
Groups of atoms bonded together with distinct properties
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import structlog
import asyncio
import uuid

from ..atoms.ai_sandbox_service import (
    AISandboxService,
    SandboxRequest,
    SandboxResponse,
    SandboxConfig
)
from ..atoms.ai_gateway_service import (
    AIGatewayService,
    ChatRequest,
    ChatResponse,
    ChatMessage
)
from ..atoms.agent_friendly_service import (
    AgentFriendlyService,
    DocumentationLink
)

logger = structlog.get_logger(__name__)


class WorkflowStep(BaseModel):
    """Workflow step model"""
    id: str
    name: str
    type: str  # code_generation, code_execution, chat, validation
    config: Dict[str, Any] = Field(default_factory=dict)
    depends_on: List[str] = Field(default_factory=list)
    status: str = "pending"  # pending, running, completed, failed, skipped
    result: Optional[Any] = None
    error: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class WorkflowConfig(BaseModel):
    """Workflow configuration model"""
    name: str
    description: str
    steps: List[WorkflowStep]
    timeout_ms: int = 300000  # 5 minutes
    max_parallel_steps: int = 3
    retry_failed_steps: bool = True
    max_retries: int = 2


class WorkflowResult(BaseModel):
    """Workflow execution result model"""
    workflow_id: str
    name: str
    success: bool
    completed_steps: int
    total_steps: int
    results: Dict[str, Any] = Field(default_factory=dict)
    errors: List[str] = Field(default_factory=list)
    execution_time_ms: int
    created_at: str
    completed_at: str


class CodeGenerationRequest(BaseModel):
    """Code generation request model"""
    prompt: str
    language: str = "python"
    context: Optional[str] = None
    requirements: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)


class CodeValidationRequest(BaseModel):
    """Code validation request model"""
    code: str
    language: str = "python"
    checks: List[str] = Field(default_factory=lambda: ["syntax", "security", "performance"])
    expected_output: Optional[str] = None


class AIWorkflowManagerError(Exception):
    """Custom exception for AI workflow manager errors"""
    pass


class AIWorkflowManager:
    """
    Molecular component for AI workflow management
    Combines AI services into complete AI workflows
    Groups of atoms bonded together with distinct properties
    """
    
    def __init__(
        self,
        sandbox_service: Optional[AISandboxService] = None,
        gateway_service: Optional[AIGatewayService] = None,
        agent_friendly_service: Optional[AgentFriendlyService] = None
    ):
        self.sandbox_service = sandbox_service or AISandboxService()
        self.gateway_service = gateway_service or AIGatewayService()
        self.agent_friendly_service = agent_friendly_service or AgentFriendlyService()
        
        self.active_workflows: Dict[str, WorkflowConfig] = {}
        self.workflow_results: Dict[str, WorkflowResult] = {}
    
    async def generate_code_with_ai(self, request: CodeGenerationRequest) -> str:
        """
        Generate code using AI
        Molecular operation: combines AI Gateway with code generation
        """
        try:
            # Build prompt for code generation
            system_prompt = self._build_code_generation_prompt(request)
            
            # Create chat request
            chat_request = ChatRequest(
                model_id="openai:gpt-4",  # Use best model for code generation
                messages=[
                    ChatMessage(role="system", content=system_prompt),
                    ChatMessage(role="user", content=request.prompt)
                ],
                temperature=0.1,  # Lower temperature for more consistent code
                max_tokens=2000,
            )
            
            # Generate code
            response = await self.gateway_service.chat_completion(chat_request)
            
            logger.info("Code generated with AI", model=response.model, tokens_used=response.usage.get("total_tokens", 0))
            
            return response.content.strip()
            
        except Exception as e:
            logger.error("Code generation failed", error=str(e))
            raise AIWorkflowManagerError(f"Code generation failed: {str(e)}")
    
    def _build_code_generation_prompt(self, request: CodeGenerationRequest) -> str:
        """Build system prompt for code generation"""
        prompt_parts = [
            f"You are an expert {request.language} programmer.",
            "Generate clean, efficient, and secure code based on the user's requirements.",
            "Follow best practices and write production-ready code.",
        ]
        
        if request.context:
            prompt_parts.append(f"Context: {request.context}")
        
        if request.requirements:
            prompt_parts.append("Requirements:")
            for req in request.requirements:
                prompt_parts.append(f"- {req}")
        
        if request.constraints:
            prompt_parts.append("Constraints:")
            for constraint in request.constraints:
                prompt_parts.append(f"- {constraint}")
        
        prompt_parts.extend([
            "Provide only the code without explanations unless specifically asked.",
            "Ensure the code is syntactically correct and follows the language conventions.",
            "Do not include any potentially unsafe operations or imports."
        ])
        
        return "\n".join(prompt_parts)
    
    async def validate_generated_code(self, request: CodeValidationRequest) -> Dict[str, Any]:
        """
        Validate generated code
        Molecular operation: combines sandbox validation with AI analysis
        """
        try:
            validation_results = {
                "syntax_valid": False,
                "security_safe": False,
                "performance_acceptable": False,
                "issues": [],
                "warnings": [],
                "suggestions": []
            }
            
            # Syntax validation using sandbox
            if "syntax" in request.checks:
                try:
                    sandbox_request = SandboxRequest(
                        code=request.code,
                        language=request.language,
                        config=SandboxConfig(timeout_ms=5000)
                    )
                    
                    sandbox_result = await self.sandbox_service.execute_code(sandbox_request)
                    validation_results["syntax_valid"] = sandbox_result.success
                    
                    if not sandbox_result.success:
                        validation_results["issues"].append(f"Syntax error: {sandbox_result.error}")
                
                except Exception as e:
                    validation_results["issues"].append(f"Syntax validation failed: {str(e)}")
            
            # Security validation
            if "security" in request.checks:
                security_validation = await self.sandbox_service.validate_code_safety(request.code)
                validation_results["security_safe"] = security_validation["safe"]
                validation_results["issues"].extend(security_validation["issues"])
                validation_results["warnings"].extend(security_validation["warnings"])
            
            # Performance validation using AI
            if "performance" in request.checks:
                performance_prompt = self._build_performance_validation_prompt(request.code, request.language)
                
                chat_request = ChatRequest(
                    model_id="openai:gpt-3.5-turbo",
                    messages=[
                        ChatMessage(role="system", content="You are a code performance expert. Analyze the provided code for performance issues and suggest improvements."),
                        ChatMessage(role="user", content=performance_prompt)
                    ],
                    temperature=0.1,
                    max_tokens=500
                )
                
                try:
                    response = await self.gateway_service.chat_completion(chat_request)
                    validation_results["suggestions"].append(response.content)
                    validation_results["performance_acceptable"] = "slow" not in response.content.lower()
                except Exception as e:
                    validation_results["warnings"].append(f"Performance analysis failed: {str(e)}")
            
            # Expected output validation
            if request.expected_output:
                try:
                    sandbox_request = SandboxRequest(
                        code=request.code,
                        language=request.language,
                        input_data={"expected": request.expected_output}
                    )
                    
                    sandbox_result = await self.sandbox_service.execute_code(sandbox_request)
                    
                    if sandbox_result.success and sandbox_result.output:
                        validation_results["output_matches"] = request.expected_output in sandbox_result.output
                        if not validation_results["output_matches"]:
                            validation_results["issues"].append("Output does not match expected result")
                
                except Exception as e:
                    validation_results["warnings"].append(f"Output validation failed: {str(e)}")
            
            return validation_results
            
        except Exception as e:
            logger.error("Code validation failed", error=str(e))
            raise AIWorkflowManagerError(f"Code validation failed: {str(e)}")
    
    def _build_performance_validation_prompt(self, code: str, language: str) -> str:
        """Build prompt for performance validation"""
        return f"""Analyze this {language} code for performance issues:

```{language}
{code}
```

Focus on:
1. Time complexity
2. Memory usage
3. Potential bottlenecks
4. Optimization opportunities
5. Best practices violations

Provide specific suggestions for improvement if any issues are found."""
    
    async def execute_ai_code_workflow(self, prompt: str, language: str = "python") -> WorkflowResult:
        """
        Execute complete AI code workflow: generate -> validate -> execute
        Molecular operation: combines multiple atomic operations
        """
        workflow_id = str(uuid.uuid4())
        start_time = datetime.now(timezone.utc)
        
        try:
            # Step 1: Generate code
            generation_request = CodeGenerationRequest(
                prompt=prompt,
                language=language,
                context=f"Generate {language} code based on the user's request",
                requirements=["clean code", "best practices", "security"],
                constraints=["no unsafe imports", "no file system access", "no network access"]
            )
            
            generated_code = await self.generate_code_with_ai(generation_request)
            
            # Step 2: Validate code
            validation_request = CodeValidationRequest(
                code=generated_code,
                language=language,
                checks=["syntax", "security", "performance"]
            )
            
            validation_results = await self.validate_generated_code(validation_request)
            
            # Step 3: Execute code if validation passes
            execution_result = None
            if validation_results["syntax_valid"] and validation_results["security_safe"]:
                try:
                    sandbox_request = SandboxRequest(
                        code=generated_code,
                        language=language,
                        config=SandboxConfig(timeout_ms=10000)
                    )
                    
                    execution_result = await self.sandbox_service.execute_code(sandbox_request)
                except Exception as e:
                    execution_result = SandboxResponse(
                        success=False,
                        error=str(e),
                        execution_time_ms=0,
                        exit_code=1
                    )
            else:
                execution_result = SandboxResponse(
                    success=False,
                    error="Code validation failed - execution blocked",
                    execution_time_ms=0,
                    exit_code=1
                )
            
            # Build workflow result
            execution_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            
            result = WorkflowResult(
                workflow_id=workflow_id,
                name="AI Code Workflow",
                success=execution_result.success if execution_result else False,
                completed_steps=3,
                total_steps=3,
                results={
                    "generated_code": generated_code,
                    "validation": validation_results,
                    "execution": execution_result.model_dump() if execution_result else None
                },
                errors=validation_results["issues"] if not validation_results["syntax_valid"] else [],
                execution_time_ms=execution_time,
                created_at=start_time.isoformat(),
                completed_at=datetime.now(timezone.utc).isoformat()
            )
            
            self.workflow_results[workflow_id] = result
            
            logger.info(
                "AI code workflow completed",
                workflow_id=workflow_id,
                success=result.success,
                execution_time_ms=execution_time
            )
            
            return result
            
        except Exception as e:
            execution_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            
            result = WorkflowResult(
                workflow_id=workflow_id,
                name="AI Code Workflow",
                success=False,
                completed_steps=0,
                total_steps=3,
                errors=[str(e)],
                execution_time_ms=execution_time,
                created_at=start_time.isoformat(),
                completed_at=datetime.now(timezone.utc).isoformat()
            )
            
            self.workflow_results[workflow_id] = result
            
            logger.error("AI code workflow failed", workflow_id=workflow_id, error=str(e))
            
            return result
    
    async def generate_documentation_with_ai(self, code: str, language: str = "python") -> str:
        """
        Generate documentation for code using AI
        Molecular operation: combines AI Gateway with documentation generation
        """
        try:
            # Build documentation prompt
            prompt = self._build_documentation_prompt(code, language)
            
            # Generate documentation
            chat_request = ChatRequest(
                model_id="openai:gpt-4",
                messages=[
                    ChatMessage(role="system", content="You are a technical documentation expert. Generate clear, comprehensive documentation for the provided code."),
                    ChatMessage(role="user", content=prompt)
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            response = await self.gateway_service.chat_completion(chat_request)
            
            logger.info("Documentation generated with AI", model=response.model, tokens_used=response.usage.get("total_tokens", 0))
            
            return response.content.strip()
            
        except Exception as e:
            logger.error("Documentation generation failed", error=str(e))
            raise AIWorkflowManagerError(f"Documentation generation failed: {str(e)}")
    
    def _build_documentation_prompt(self, code: str, language: str) -> str:
        """Build prompt for documentation generation"""
        return f"""Generate comprehensive documentation for this {language} code:

```{language}
{code}
```

Include:
1. Brief description of what the code does
2. Function/class descriptions with parameters
3. Usage examples
4. Important notes or considerations
5. Dependencies or requirements

Format the documentation in Markdown with proper headings and code blocks."""
    
    async def create_ai_assisted_api_documentation(self) -> str:
        """
        Create AI-assisted API documentation
        Molecular operation: combines agent-friendly service with AI generation
        """
        try:
            # Get current API documentation
            current_docs = self.agent_friendly_service.generate_api_docs_md()
            
            # Enhance with AI-generated examples and explanations
            enhancement_prompt = f"""Enhance this API documentation with better examples, explanations, and usage patterns:

{current_docs}

Add:
1. More detailed examples for each endpoint
2. Error handling examples
3. Best practices
4. Common use cases
5. Integration examples

Keep the existing structure but enhance the content."""
            
            chat_request = ChatRequest(
                model_id="openai:gpt-4",
                messages=[
                    ChatMessage(role="system", content="You are a technical writer specializing in API documentation. Enhance the provided documentation with better examples and explanations."),
                    ChatMessage(role="user", content=enhancement_prompt)
                ],
                temperature=0.2,
                max_tokens=3000
            )
            
            response = await self.gateway_service.chat_completion(chat_request)
            
            logger.info("AI-assisted API documentation created", tokens_used=response.usage.get("total_tokens", 0))
            
            return response.content.strip()
            
        except Exception as e:
            logger.error("AI-assisted documentation creation failed", error=str(e))
            raise AIWorkflowManagerError(f"AI-assisted documentation creation failed: {str(e)}")
    
    async def get_ai_workflow_stats(self) -> Dict[str, Any]:
        """
        Get AI workflow statistics
        Molecular operation: combines statistics from all services
        """
        try:
            # Get stats from individual services
            sandbox_stats = self.sandbox_service.get_execution_stats()
            gateway_stats = self.gateway_service.get_usage_stats()
            
            # Get workflow stats
            total_workflows = len(self.workflow_results)
            successful_workflows = len([w for w in self.workflow_results.values() if w.success])
            
            avg_workflow_time = 0
            if self.workflow_results:
                avg_workflow_time = sum(w.execution_time_ms for w in self.workflow_results.values()) / len(self.workflow_results)
            
            return {
                "workflow_stats": {
                    "total_workflows": total_workflows,
                    "successful_workflows": successful_workflows,
                    "success_rate": successful_workflows / total_workflows if total_workflows > 0 else 0,
                    "average_execution_time_ms": round(avg_workflow_time, 2),
                },
                "sandbox_stats": sandbox_stats,
                "gateway_stats": gateway_stats,
                "combined_stats": {
                    "total_ai_operations": sandbox_stats["total_executions"] + gateway_stats["total_requests"],
                    "total_tokens_used": gateway_stats["total_tokens_used"],
                    "average_response_time_ms": round((sandbox_stats["average_execution_time_ms"] + gateway_stats["average_response_time_ms"]) / 2, 2),
                }
            }
            
        except Exception as e:
            logger.error("Failed to get AI workflow stats", error=str(e))
            raise AIWorkflowManagerError(f"Failed to get AI workflow stats: {str(e)}")
    
    def get_workflow_result(self, workflow_id: str) -> Optional[WorkflowResult]:
        """
        Get workflow result by ID
        Molecular operation: retrieves workflow data
        """
        return self.workflow_results.get(workflow_id)
    
    def list_workflow_results(self, limit: int = 50) -> List[WorkflowResult]:
        """
        List recent workflow results
        Molecular operation: retrieves multiple workflow data
        """
        sorted_results = sorted(
            self.workflow_results.values(),
            key=lambda w: w.completed_at,
            reverse=True
        )
        
        return sorted_results[:limit]
    
    async def cleanup_old_results(self, max_age_hours: int = 24) -> int:
        """
        Clean up old workflow results
        Molecular operation: cleans up multiple results
        """
        try:
            current_time = datetime.now(timezone.utc)
            expired_results = []
            
            for workflow_id, result in self.workflow_results.items():
                completed_time = datetime.fromisoformat(result.completed_at.replace('Z', '+00:00'))
                age_hours = (current_time - completed_time).total_seconds() / 3600
                
                if age_hours > max_age_hours:
                    expired_results.append(workflow_id)
            
            for workflow_id in expired_results:
                del self.workflow_results[workflow_id]
            
            logger.info("Cleaned up old workflow results", count=len(expired_results))
            
            return len(expired_results)
            
        except Exception as e:
            logger.error("Failed to cleanup old results", error=str(e))
            raise AIWorkflowManagerError(f"Failed to cleanup old results: {str(e)}")


# Singleton instance
ai_workflow_manager = AIWorkflowManager()
