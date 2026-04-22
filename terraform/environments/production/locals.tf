# Production Environment Local Values
# Centralized configuration for all infrastructure components

locals {
  # Vercel Configuration
  vercel_environment_variables = {
    # Database Configuration
    DATABASE_URL = module.neon_database.connection_string
    NEON_API_KEY = var.neon_api_key
    
    # Cache Configuration
    REDIS_URL = module.upstash_redis.connection_string
    UPSTASH_REDIS_REST_TOKEN = module.upstash_redis.rest_token
    
    # Storage Configuration
    CLOUDFLARE_R2_ACCOUNT_ID = var.cloudflare_account_id
    CLOUDFLARE_R2_ACCESS_KEY = module.cloudflare_storage.access_key
    CLOUDFLARE_R2_SECRET_KEY = module.cloudflare_storage.secret_key
    CLOUDFLARE_R2_BUCKET_NAME = module.cloudflare_storage.bucket_name
    
    # AI Services
    ANTHROPIC_API_KEY = var.anthropic_api_key
    OPENAI_API_KEY = var.openai_api_key
    PINECONE_API_KEY = var.pinecone_api_key
    PINECONE_INDEX_HOST = var.pinecone_index_host
    PINECONE_INDEX_NAME = var.pinecone_index_name
    
    # Authentication
    CLERK_PUBLISHABLE_KEY = var.clerk_publishable_key
    CLERK_SECRET_KEY = var.clerk_secret_key
    CLERK_WEBHOOK_SECRET = var.clerk_webhook_secret
    
    # Application Configuration
    NODE_ENV = "production"
    NEXT_PUBLIC_API_URL = "https://${var.domain_name}"
    NEXT_PUBLIC_SITE_URL = "https://${var.domain_name}"
    
    # Monitoring
    DATADOG_API_KEY = var.datadog_api_key
    LANGSMITH_API_KEY = var.langsmith_api_key
    LANGCHAIN_API_KEY = var.langchain_api_key
    
    # External Services
    APIFY_TOKEN = var.apify_token
    APIFY_API_KEY = var.apify_api_key
  }
  
  vercel_domains = [
    var.domain_name
  ]
  
  # Neon Database Configuration
  neon_databases = {
    main = {
      name = "fashion_data"
      owner_name = "neondb_owner"
    }
  }
  
  neon_branches = {
    main = {
      name = "main"
      primary = true
    }
  }
  
  # Upstash Redis Configuration
  upstash_databases = {
    main_cache = {
      name = "shop"
      region = "us-east-1"
      type = "free"
    }
    session_cache = {
      name = "fashion-sessions"
      region = "us-east-1"
      type = "free"
    }
  }
  
  # Cloudflare R2 Storage Configuration
  cloudflare_buckets = {
    uploads = {
      name = "fashion-app-uploads"
      type = "public"
    }
    backups = {
      name = "fashion-app-backups"
      type = "private"
    }
  }
  
  # Monitoring Configuration
  monitored_services = {
    vercel_app = {
      name = "fashion-app-vercel"
      type = "frontend"
      environment = var.environment
    }
    api = {
      name = "fashion-app-api"
      type = "backend"
      environment = var.environment
    }
    database = {
      name = "fashion-app-database"
      type = "database"
      environment = var.environment
    }
    cache = {
      name = "fashion-app-cache"
      type = "cache"
      environment = var.environment
    }
  }
  
  monitoring_alerts = {
    high_error_rate = {
      name = "High Error Rate"
      query = "avg(last_5m):sum:errors{*}.as_rate() > 0.05"
      priority = "critical"
      message = "Error rate is above 5% for {{#is_alert}}{{name}}{{/is_alert}}"
    }
    high_response_time = {
      name = "High Response Time"
      query = "avg(last_5m):avg:response_time{*} > 1000"
      priority = "warning"
      message = "Response time is above 1s for {{#is_alert}}{{name}}{{/is_alert}}"
    }
    database_connections = {
      name = "Database Connection Issues"
      query = "avg(last_5m):sum:database.connections.active{*} < 1"
      priority = "critical"
      message = "Database has no active connections for {{#is_alert}}{{name}}{{/is_alert}}"
    }
  }
  
  monitoring_dashboards = {
    application_performance = {
      title = "Application Performance"
      widgets = [
        {
          type = "timeseries"
          title = "Response Time"
          query = "avg:response_time{*}"
        },
        {
          type = "timeseries"
          title = "Error Rate"
          query = "sum:errors{*}.as_rate()"
        },
        {
          type = "timeseries"
          title = "Request Count"
          query = "sum:requests{*}"
        }
      ]
    }
    infrastructure_health = {
      title = "Infrastructure Health"
      widgets = [
        {
          type = "timeseries"
          title = "Database Connections"
          query = "sum:database.connections.active{*}"
        },
        {
          type = "timeseries"
          title = "Cache Hit Rate"
          query = "avg:cache.hit_rate{*}"
        },
        {
          type = "timeseries"
          title = "Storage Usage"
          query = "sum:storage.used{*}"
        }
      ]
    }
  }
  
  # Security Configuration
  managed_api_keys = {
    anthropic = {
      name = "anthropic-api-key"
      description = "Anthropic AI API key"
      environments = ["production"]
    }
    openai = {
      name = "openai-api-key"
      description = "OpenAI API key"
      environments = ["production"]
    }
    apify = {
      name = "apify-api-key"
      description = "Apify web scraping API key"
      environments = ["production"]
    }
  }
  
  access_policies = {
    production_access = {
      name = "production-access"
      description = "Production environment access"
      permissions = ["read", "write"]
      resources = ["*"]
    }
    readonly_access = {
      name = "readonly-access"
      description = "Read-only access to all resources"
      permissions = ["read"]
      resources = ["*"]
    }
  }
  
  managed_secrets = {
    database_credentials = {
      name = "database-credentials"
      description = "Database connection credentials"
      type = "database"
    }
    api_keys = {
      name = "api-keys"
      description = "External service API keys"
      type = "api-keys"
    }
    encryption_keys = {
      name = "encryption-keys"
      description = "Encryption keys for sensitive data"
      type = "encryption"
    }
  }
}
