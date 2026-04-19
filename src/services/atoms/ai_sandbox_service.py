"""
AI Sandbox Service - Atomic Component
Provides secure code execution sandbox for AI-generated code
Basic building block for AI integration and safety
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import structlog
import asyncio
import uuid
import json

logger = structlog.get_logger(__name__)


class SandboxConfig(BaseModel):
    """Sandbox configuration model"""
    runtime: str = "python3.11"
    timeout_ms: int = 30000  # 30 seconds
    memory_mb: int = 512
    cpu_cores: int = 1
    network_access: bool = False
    filesystem_access: bool = True
    environment_variables: Dict[str, str] = Field(default_factory=dict)


class SandboxRequest(BaseModel):
    """Sandbox execution request model"""
    code: str
    language: str = "python"
    config: Optional[SandboxConfig] = None
    input_data: Optional[Dict[str, Any]] = None
    expected_output: Optional[str] = None


class SandboxResponse(BaseModel):
    """Sandbox execution response model"""
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time_ms: int
    memory_used_mb: Optional[int] = None
    exit_code: Optional[int] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None


class SandboxSession(BaseModel):
    """Sandbox session model"""
    session_id: str
    created_at: str
    last_activity: str
    config: SandboxConfig
    status: str = "active"  # active, completed, error, expired
    executions: List[SandboxResponse] = Field(default_factory=list)


class AISandboxServiceError(Exception):
    """Custom exception for AI sandbox service errors"""
    pass


class AISandboxService:
    """
    Atomic component for AI sandbox services
    Provides secure code execution environment for AI-generated code
    Basic building block that can't be broken down further
    """
    
    def __init__(self, max_concurrent_sessions: int = 10):
        self.max_concurrent_sessions = max_concurrent_sessions
        self.active_sessions: Dict[str, SandboxSession] = {}
        self.execution_history: List[SandboxResponse] = []
        self.default_config = SandboxConfig()
        
        # Security restrictions
        self.forbidden_modules = [
            "os", "sys", "subprocess", "socket", "urllib", "requests",
            "ftplib", "smtplib", "telnetlib", "pickle", "marshal", "shutil"
        ]
        
        self.forbidden_operations = [
            "__import__", "eval", "exec", "compile", "open", "file",
            "input", "raw_input", "help", "dir", "vars", "globals", "locals"
        ]
    
    async def create_session(self, config: Optional[SandboxConfig] = None) -> SandboxSession:
        """
        Create a new sandbox session
        Atomic operation: creates a single session
        """
        try:
            if len(self.active_sessions) >= self.max_concurrent_sessions:
                raise AISandboxServiceError("Maximum concurrent sessions reached")
            
            session_id = str(uuid.uuid4())
            session_config = config or self.default_config
            
            session = SandboxSession(
                session_id=session_id,
                created_at=datetime.now(timezone.utc).isoformat(),
                last_activity=datetime.now(timezone.utc).isoformat(),
                config=session_config,
                status="active"
            )
            
            self.active_sessions[session_id] = session
            
            logger.info("Created sandbox session", session_id=session_id, runtime=session_config.runtime)
            
            return session
            
        except Exception as e:
            logger.error("Failed to create sandbox session", error=str(e))
            raise AISandboxServiceError(f"Failed to create sandbox session: {str(e)}")
    
    async def execute_code(self, request: SandboxRequest, session_id: Optional[str] = None) -> SandboxResponse:
        """
        Execute code in the sandbox
        Atomic operation: executes a single code block
        """
        start_time = datetime.now(timezone.utc)
        
        try:
            # Validate code for security
            await self._validate_code(request.code)
            
            # Get or create session
            if session_id and session_id in self.active_sessions:
                session = self.active_sessions[session_id]
            else:
                session = await self.create_session(request.config)
                session_id = session.session_id
            
            # Update session activity
            session.last_activity = datetime.now(timezone.utc).isoformat()
            
            # Execute code in sandbox
            result = await self._execute_in_sandbox(request, session)
            
            # Calculate execution time
            execution_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            result.execution_time_ms = execution_time
            
            # Store result in session
            session.executions.append(result)
            
            # Store in history
            self.execution_history.append(result)
            
            # Keep history manageable
            if len(self.execution_history) > 1000:
                self.execution_history = self.execution_history[-500:]
            
            logger.info(
                "Code executed in sandbox",
                session_id=session_id,
                success=result.success,
                execution_time_ms=execution_time
            )
            
            return result
            
        except Exception as e:
            execution_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            
            error_response = SandboxResponse(
                success=False,
                error=str(e),
                execution_time_ms=execution_time,
                exit_code=1
            )
            
            logger.error("Sandbox execution failed", session_id=session_id, error=str(e))
            
            return error_response
    
    async def _validate_code(self, code: str) -> None:
        """
        Validate code for security violations
        Atomic operation: validates code security
        """
        try:
            # Check for forbidden modules
            for module in self.forbidden_modules:
                if f"import {module}" in code or f"from {module}" in code:
                    raise AISandboxServiceError(f"Forbidden module: {module}")
            
            # Check for forbidden operations
            for operation in self.forbidden_operations:
                if operation in code:
                    raise AISandboxServiceError(f"Forbidden operation: {operation}")
            
            # Check for suspicious patterns
            suspicious_patterns = [
                "__builtins__", "__getattribute__", "__setattr__", "__delattr__",
                "execfile", "reload", "compile", "globals()", "locals()", "vars()",
                "dir()", "help()", "input(", "raw_input(", "open(", "file("
            ]
            
            for pattern in suspicious_patterns:
                if pattern in code:
                    raise AISandboxServiceError(f"Suspicious pattern detected: {pattern}")
            
            # Check code length
            if len(code) > 10000:  # 10KB limit
                raise AISandboxServiceError("Code too long")
            
        except AISandboxServiceError:
            raise
        except Exception as e:
            logger.error("Code validation failed", error=str(e))
            raise AISandboxServiceError(f"Code validation failed: {str(e)}")
    
    async def _execute_in_sandbox(self, request: SandboxRequest, session: SandboxSession) -> SandboxResponse:
        """
        Execute code in the actual sandbox environment
        Atomic operation: performs the execution
        """
        try:
            # This is a simplified implementation
            # In production, you would use Vercel Sandbox or similar
            
            # Simulate execution
            await asyncio.sleep(0.1)  # Simulate processing time
            
            # For Python code, try to evaluate safely
            if request.language.lower() == "python":
                return await self._execute_python_code(request, session)
            else:
                raise AISandboxServiceError(f"Unsupported language: {request.language}")
                
        except Exception as e:
            logger.error("Sandbox execution failed", error=str(e))
            return SandboxResponse(
                success=False,
                error=str(e),
                execution_time_ms=0,
                exit_code=1
            )
    
    async def _execute_python_code(self, request: SandboxRequest, session: SandboxSession) -> SandboxResponse:
        """
        Execute Python code safely
        Atomic operation: executes Python code
        """
        try:
            # Create a restricted execution environment
            safe_globals = {
                "__builtins__": {
                    "print": print,
                    "len": len,
                    "str": str,
                    "int": int,
                    "float": float,
                    "bool": bool,
                    "list": list,
                    "dict": dict,
                    "tuple": tuple,
                    "set": set,
                    "range": range,
                    "enumerate": enumerate,
                    "zip": zip,
                    "sum": sum,
                    "max": max,
                    "min": min,
                    "abs": abs,
                    "round": round,
                    "sorted": sorted,
                    "reversed": reversed,
                }
            }
            
            # Add input data to globals if provided
            if request.input_data:
                safe_globals.update(request.input_data)
            
            # Capture output
            import io
            import sys
            from contextlib import redirect_stdout, redirect_stderr
            
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            
            try:
                # Execute code with captured output
                with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                    exec(request.code, safe_globals, {})
                
                stdout = stdout_capture.getvalue()
                stderr = stderr_capture.getvalue()
                
                return SandboxResponse(
                    success=True,
                    output=stdout,
                    stdout=stdout,
                    stderr=stderr,
                    execution_time_ms=0,
                    exit_code=0
                )
                
            except Exception as e:
                stdout = stdout_capture.getvalue()
                stderr = stderr_capture.getvalue()
                
                return SandboxResponse(
                    success=False,
                    error=str(e),
                    stdout=stdout,
                    stderr=stderr,
                    execution_time_ms=0,
                    exit_code=1
                )
                
        except Exception as e:
            logger.error("Python code execution failed", error=str(e))
            return SandboxResponse(
                success=False,
                error=str(e),
                execution_time_ms=0,
                exit_code=1
            )
    
    async def get_session(self, session_id: str) -> Optional[SandboxSession]:
        """
        Get session information
        Atomic operation: retrieves session data
        """
        try:
            return self.active_sessions.get(session_id)
        except Exception as e:
            logger.error("Failed to get session", session_id=session_id, error=str(e))
            raise AISandboxServiceError(f"Failed to get session: {str(e)}")
    
    async def close_session(self, session_id: str) -> bool:
        """
        Close a sandbox session
        Atomic operation: closes a single session
        """
        try:
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                session.status = "completed"
                del self.active_sessions[session_id]
                
                logger.info("Closed sandbox session", session_id=session_id)
                return True
            
            return False
            
        except Exception as e:
            logger.error("Failed to close session", session_id=session_id, error=str(e))
            raise AISandboxServiceError(f"Failed to close session: {str(e)}")
    
    async def cleanup_expired_sessions(self, max_age_minutes: int = 30) -> int:
        """
        Clean up expired sessions
        Atomic operation: cleans up multiple sessions
        """
        try:
            current_time = datetime.now(timezone.utc)
            expired_sessions = []
            
            for session_id, session in self.active_sessions.items():
                created_time = datetime.fromisoformat(session.created_at.replace('Z', '+00:00'))
                age_minutes = (current_time - created_time).total_seconds() / 60
                
                if age_minutes > max_age_minutes:
                    expired_sessions.append(session_id)
            
            for session_id in expired_sessions:
                await self.close_session(session_id)
            
            logger.info("Cleaned up expired sessions", count=len(expired_sessions))
            
            return len(expired_sessions)
            
        except Exception as e:
            logger.error("Failed to cleanup expired sessions", error=str(e))
            raise AISandboxServiceError(f"Failed to cleanup expired sessions: {str(e)}")
    
    def get_execution_stats(self) -> Dict[str, Any]:
        """
        Get execution statistics
        Atomic operation: retrieves statistics
        """
        try:
            total_executions = len(self.execution_history)
            successful_executions = len([r for r in self.execution_history if r.success])
            failed_executions = total_executions - successful_executions
            
            avg_execution_time = 0
            if self.execution_history:
                avg_execution_time = sum(r.execution_time_ms for r in self.execution_history) / len(self.execution_history)
            
            return {
                "total_executions": total_executions,
                "successful_executions": successful_executions,
                "failed_executions": failed_executions,
                "success_rate": successful_executions / total_executions if total_executions > 0 else 0,
                "average_execution_time_ms": round(avg_execution_time, 2),
                "active_sessions": len(self.active_sessions),
                "max_concurrent_sessions": self.max_concurrent_sessions,
            }
            
        except Exception as e:
            logger.error("Failed to get execution stats", error=str(e))
            raise AISandboxServiceError(f"Failed to get execution stats: {str(e)}")
    
    async def validate_code_safety(self, code: str) -> Dict[str, Any]:
        """
        Validate code safety without executing
        Atomic operation: performs safety validation
        """
        try:
            issues = []
            warnings = []
            
            # Check for forbidden modules
            for module in self.forbidden_modules:
                if f"import {module}" in code or f"from {module}" in code:
                    issues.append(f"Forbidden module: {module}")
            
            # Check for forbidden operations
            for operation in self.forbidden_operations:
                if operation in code:
                    issues.append(f"Forbidden operation: {operation}")
            
            # Check for suspicious patterns
            suspicious_patterns = [
                ("__builtins__", "Access to Python builtins"),
                ("__getattribute__", "Attribute access manipulation"),
                ("__setattr__", "Attribute modification"),
                ("execfile", "File execution"),
                ("compile", "Code compilation"),
                ("globals()", "Access to global namespace"),
                ("locals()", "Access to local namespace"),
                ("input(", "User input"),
                ("open(", "File access"),
                ("file(", "File access"),
            ]
            
            for pattern, description in suspicious_patterns:
                if pattern in code:
                    warnings.append(f"{description}: {pattern}")
            
            # Check code complexity
            lines = code.split('\n')
            if len(lines) > 100:
                warnings.append(f"Code is quite long: {len(lines)} lines")
            
            # Check for potential infinite loops
            if "while True:" in code or "for i in range(" in code:
                warnings.append("Potential infinite loop detected")
            
            return {
                "safe": len(issues) == 0,
                "issues": issues,
                "warnings": warnings,
                "line_count": len(lines),
                "character_count": len(code)
            }
            
        except Exception as e:
            logger.error("Code safety validation failed", error=str(e))
            raise AISandboxServiceError(f"Code safety validation failed: {str(e)}")
    
    def update_default_config(self, **kwargs) -> None:
        """
        Update default sandbox configuration
        Atomic operation: updates configuration
        """
        try:
            for key, value in kwargs.items():
                if hasattr(self.default_config, key):
                    setattr(self.default_config, key, value)
            
            logger.info("Updated default sandbox configuration", updates=list(kwargs.keys()))
            
        except Exception as e:
            logger.error("Failed to update default config", error=str(e))
            raise AISandboxServiceError(f"Failed to update default config: {str(e)}")


# Singleton instance
ai_sandbox_service = AISandboxService()
