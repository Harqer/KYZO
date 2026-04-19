"""
Settings and Environment Variables - FastAPI Best Practices
Configuration management using Pydantic Settings with validation
"""

from typing import List, Optional, Any
from pydantic import Field, validator
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """
    Application settings using Pydantic Settings
    Provides type validation and environment variable loading
    """
    
    # Application settings
    app_name: str = "Fashion Backend - LangChain Integration"
    version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    reload: bool = True
    log_level: str = "info"
    
    # Frontend settings
    frontend_url: str = "http://localhost:3000"
    cors_origins: List[str] = ["*"]
    
    # Database settings
    database_url: str = Field(
        default="postgresql://neondb_owner:npg_B6s0rywlRhao@ep-quiet-cell-amsnhw0l-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        env="DATABASE_URL"
    )
    
    # Authentication settings
    jwt_secret: str = Field(..., env="JWT_SECRET")
    jwt_expires_in: str = "7d"
    
    # Clerk authentication
    clerk_publishable_key: Optional[str] = Field(None, env="CLERK_PUBLISHABLE_KEY")
    clerk_secret_key: Optional[str] = Field(None, env="CLERK_SECRET_KEY")
    
    # File upload settings
    max_file_size: int = 10485760  # 10MB
    upload_path: str = "./uploads"
    
    # External services
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Cloudflare R2 settings
    cloudflare_r2_access_key: Optional[str] = Field(None, env="CLOUDFLARE_R2_ACCESS_KEY")
    cloudflare_r2_secret_key: Optional[str] = Field(None, env="CLOUDFLARE_R2_SECRET_KEY")
    cloudflare_r2_bucket_name: Optional[str] = Field(None, env="CLOUDFLARE_R2_BUCKET_NAME")
    cloudflare_r2_account_id: Optional[str] = Field(None, env="CLOUDFLARE_R2_ACCOUNT_ID")
    
    # Pinecone settings
    pinecone_api_key: Optional[str] = Field(None, env="PINECONE_API_KEY")
    pinecone_environment: str = "us-west1-gcp"
    pinecone_index_name: str = "fashion-vectors"
    
    # AI services
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    langchain_api_key: Optional[str] = Field(None, env="LANGCHAIN_API_KEY")
    langsmith_api_key: Optional[str] = Field(None, env="LANGSMITH_API_KEY")
    
    # LangChain integration configuration
    langchain_api_url: str = "https://api.langchain.com"
    langchain_default_scopes: List[str] = ["read", "write"]
    langchain_timeout_ms: int = 300000
    langchain_max_retries: int = 3
    langchain_retry_delay: int = 1000
    
    # Security settings
    allowed_hosts: List[str] = ["*"]
    trusted_hosts: List[str] = ["localhost", "127.0.0.1"]
    
    # Rate limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    # Monitoring settings
    enable_metrics: bool = True
    metrics_port: int = 9090
    
    @validator("cors_origins", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("langchain_default_scopes", pre=True)
    def assemble_scopes(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("allowed_hosts", pre=True)
    def assemble_allowed_hosts(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("trusted_hosts", pre=True)
    def assemble_trusted_hosts(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Allow extra inputs in newer Pydantic versions


@lru_cache()
def get_settings() -> Settings:
    """
    Get settings instance with caching
    Using lru_cache to avoid reading .env file multiple times
    """
    return Settings()


# Global settings instance
settings = get_settings()
