# Enterprise Infrastructure Configuration
# Centralized configuration for all enterprise components

locals {
  # Enterprise tagging strategy
  enterprise_tags = merge(
    var.cost_allocation_tags,
    {
      Environment     = "production"
      ManagedBy       = "terraform"
      Project         = "fashion-enterprise"
      DataClassification = "confidential"
      ComplianceLevel  = "enterprise"
    }
  )
  
  # Enterprise database configuration
  enterprise_database_config = {
    # Neon PostgreSQL configuration
    neon = {
      project_name = "fashion-enterprise-db"
      postgresql_version = "15"
      region_id = "aws-us-east-1"
      
      databases = {
        main = {
          name = "fashion_data"
          owner_name = "fashion_db_owner"
        }
        analytics = {
          name = "fashion_analytics"
          owner_name = "analytics_db_owner"
        }
      }
      
      branches = {
        main = {
          name = "main"
          primary = true
        }
        analytics = {
          name = "analytics"
          primary = false
        }
      }
    }
    
    # Backup configuration
    backup = {
      retention_period = var.backup_retention_days
      preferred_backup_window = "03:00-04:00"
      maintenance_window = "sun:04:00-sun:05:00"
    }
  }
  
  # Enterprise cache configuration
  enterprise_cache_config = {
    # Upstash Redis configuration
    upstash = {
      databases = {
        main_cache = {
          name = "shop"
          region = "us-east-1"
          type = "pro"
        }
        session_cache = {
          name = "fashion-sessions"
          region = "us-east-1"
          type = "pro"
        }
        analytics_cache = {
          name = "fashion-analytics"
          region = "us-east-1"
          type = "pro"
        }
      }
      
      # Performance tuning
      eviction_policy = "allkeys-lru"
      maxmemory_policy = "allkeys-lru"
      
      # Security
      encryption = true
      backup_enabled = true
      backup_interval = 3600
    }
    
    # AWS ElastiCache configuration
    elasticache = {
      engine = "redis"
      engine_version = "7.0"
      parameter_group_name = "default.redis7"
      port = 6379
      
      # High availability
      automatic_failover_enabled = true
      multi_az_enabled = true
      
      # Security
      at_rest_encryption_enabled = true
      transit_encryption_enabled = true
      auth_token = var.redis_auth_token
    }
  }
  
  # Enterprise storage configuration
  enterprise_storage_config = {
    # Cloudflare R2 configuration
    cloudflare_r2 = {
      buckets = {
        uploads = {
          name = "fashion-enterprise-uploads"
          type = "private"
        }
        backups = {
          name = "fashion-enterprise-backups"
          type = "private"
        }
        analytics = {
          name = "fashion-enterprise-analytics"
          type = "private"
        }
        cdn_assets = {
          name = "fashion-enterprise-cdn"
          type = "public"
        }
      }
      
      # Security
      encryption_enabled = true
      public_access_blocked = true
      
      # Performance
      log_enabled = true
    }
    
    # AWS S3 configuration
    s3 = {
      buckets = {
        enterprise_data = {
          name_prefix = "fashion-enterprise-data"
          access_level = "private"
        }
        enterprise_logs = {
          name_prefix = "fashion-enterprise-logs"
          access_level = "private"
        }
        enterprise_backups = {
          name_prefix = "fashion-enterprise-backups"
          access_level = "private"
        }
      }
      
      # Enterprise features
      versioning_enabled = true
      encryption_enabled = true
      lifecycle_enabled = true
    }
  }
  
  # Enterprise Vercel configuration
  enterprise_vercel_config = {
    project_name = "fashion-enterprise"
    framework = "nextjs"
    
    build_command = "npm run build"
    output_directory = ".next"
    install_command = "npm ci"
    dev_command = "npm run dev"
    
    # Enterprise features
    git_repository = {
      type = "github"
      repo = "fashion-enterprise/fashion-app"
    }
    
    domains = [
      "app.fashion-enterprise.com",
      "www.fashion-enterprise.com"
    ]
    
    # Environment configuration
    environment = "production"
    serverless_function_region = "us-east-1"
  }
  
  # Enterprise Docker configuration
  enterprise_docker_config = {
    registry = "123456789012.dkr.ecr.us-east-1.amazonaws.com"
    
    images = {
      app = {
        name = "fashion-enterprise-app"
        tag = "latest"
      }
      worker = {
        name = "fashion-enterprise-worker"
        tag = "latest"
      }
      analytics = {
        name = "fashion-enterprise-analytics"
        tag = "latest"
      }
    }
    
    # Security
    image_scan_on_push = true
    encryption_type = "AES256"
  }
  
  # Enterprise environment variables
  enterprise_environment_variables = {
    # Database connections
    DATABASE_URL = module.database.neon_connection_string
    ANALYTICS_DATABASE_URL = module.database.analytics_connection_string
    
    # Cache connections
    REDIS_URL = module.cache.upstash_connection_string
    SESSION_REDIS_URL = module.cache.session_connection_string
    ANALYTICS_REDIS_URL = module.cache.analytics_connection_string
    
    # Storage connections
    CLOUDFLARE_R2_ACCOUNT_ID = var.cloudflare_account_id
    CLOUDFLARE_R2_ACCESS_KEY = module.storage.cloudflare_access_key
    CLOUDFLARE_R2_SECRET_KEY = module.storage.cloudflare_secret_key
    S3_BUCKET_NAME = module.storage.s3_bucket_name
    
    # AI services (from Vault)
    ANTHROPIC_API_KEY = module.secrets.anthropic_api_key
    OPENAI_API_KEY = module.secrets.openai_api_key
    PINECONE_API_KEY = module.secrets.pinecone_api_key
    PINECONE_INDEX_HOST = module.secrets.pinecone_index_host
    PINECONE_INDEX_NAME = module.secrets.pinecone_index_name
    
    # Authentication (from Vault)
    CLERK_PUBLISHABLE_KEY = module.secrets.clerk_publishable_key
    CLERK_SECRET_KEY = module.secrets.clerk_secret_key
    CLERK_WEBHOOK_SECRET = module.secrets.clerk_webhook_secret
    
    # External services (from Vault)
    APIFY_TOKEN = module.secrets.apify_token
    APIFY_API_KEY = module.secrets.apify_api_key
    LANGSMITH_API_KEY = module.secrets.langsmith_api_key
    LANGCHAIN_API_KEY = module.secrets.langchain_api_key
    
    # Application configuration
    NODE_ENV = "production"
    NEXT_PUBLIC_API_URL = "https://app.fashion-enterprise.com"
    NEXT_PUBLIC_SITE_URL = "https://www.fashion-enterprise.com"
    
    # Monitoring
    DATADOG_API_KEY = var.datadog_api_key
    SENTRY_DSN = module.secrets.sentry_dsn
    
    # Enterprise features
    ENABLE_ANALYTICS = "true"
    ENABLE_MONITORING = "true"
    ENABLE_AUDIT_LOGGING = "true"
    DATA_RETENTION_DAYS = var.data_retention_days
  }
  
  # Enterprise security groups
  enterprise_security_groups = {
    application = {
      name = "fashion-enterprise-app"
      description = "Security group for application servers"
      ingress_rules = [
        {
          from_port = 443
          to_port = 443
          protocol = "tcp"
          cidr_blocks = ["0.0.0.0/0"]
          description = "HTTPS"
        },
        {
          from_port = 80
          to_port = 80
          protocol = "tcp"
          cidr_blocks = ["0.0.0.0/0"]
          description = "HTTP redirect"
        }
      ]
      egress_rules = [
        {
          from_port = 0
          to_port = 0
          protocol = "-1"
          cidr_blocks = ["0.0.0.0/0"]
          description = "All outbound"
        }
      ]
    }
    
    database = {
      name = "fashion-enterprise-db"
      description = "Security group for databases"
      ingress_rules = [
        {
          from_port = 5432
          to_port = 5432
          protocol = "tcp"
          security_groups = [module.security.application_security_group_id]
          description = "Database access from application"
        }
      ]
      egress_rules = []
    }
    
    cache = {
      name = "fashion-enterprise-cache"
      description = "Security group for cache servers"
      ingress_rules = [
        {
          from_port = 6379
          to_port = 6379
          protocol = "tcp"
          security_groups = [module.security.application_security_group_id]
          description = "Cache access from application"
        }
      ]
      egress_rules = []
    }
  }
  
  # Enterprise monitoring configuration
  enterprise_monitoring_config = {
    datadog = {
      site = "datadoghq.com"
      log_level = "info"
      enable_logs = true
      enable_metrics = true
      enable_traces = true
      
      # Custom metrics
      custom_metrics = [
        "fashion.api.requests",
        "fashion.api.errors",
        "fashion.api.response_time",
        "fashion.database.connections",
        "fashion.cache.hit_rate",
        "fashion.storage.usage"
      ]
    }
    
    alerts = {
      critical_thresholds = {
        error_rate = 0.05  # 5%
        response_time = 2000  # 2 seconds
        cpu_usage = 0.8  # 80%
        memory_usage = 0.85  # 85%
        disk_usage = 0.9  # 90%
      }
      
      warning_thresholds = {
        error_rate = 0.02  # 2%
        response_time = 1000  # 1 second
        cpu_usage = 0.6  # 60%
        memory_usage = 0.7  # 70%
        disk_usage = 0.8  # 80%
      }
    }
  }
  
  # Enterprise alert rules
  enterprise_alert_rules = {
    high_error_rate = {
      name = "High Error Rate"
      query = "avg(last_5m):sum:fashion.api.errors{*}.as_rate() > 0.05"
      priority = "critical"
      message = "Error rate is above 5% for {{#is_alert}}{{name}}{{/is_alert}}"
      notification_channels = ["slack", "email", "pagerduty"]
    }
    
    high_response_time = {
      name = "High Response Time"
      query = "avg(last_5m):avg:fashion.api.response_time{*} > 2000"
      priority = "warning"
      message = "Response time is above 2s for {{#is_alert}}{{name}}{{/is_alert}}"
      notification_channels = ["slack", "email"]
    }
    
    database_connections = {
      name = "Database Connection Issues"
      query = "avg(last_5m):sum:fashion.database.connections.active{*} < 1"
      priority = "critical"
      message = "Database has no active connections for {{#is_alert}}{{name}}{{/is_alert}}"
      notification_channels = ["slack", "email", "pagerduty"]
    }
    
    cache_performance = {
      name = "Cache Performance Degradation"
      query = "avg(last_10m):avg:fashion.cache.hit_rate{*} < 0.8"
      priority = "warning"
      message = "Cache hit rate is below 80% for {{#is_alert}}{{name}}{{/is_alert}}"
      notification_channels = ["slack", "email"]
    }
  }
  
  # Enterprise dashboards
  enterprise_dashboards = {
    application_performance = {
      title = "Fashion Enterprise - Application Performance"
      widgets = [
        {
          type = "timeseries"
          title = "API Response Time"
          query = "avg:fashion.api.response_time{*}"
        },
        {
          type = "timeseries"
          title = "API Error Rate"
          query = "sum:fashion.api.errors{*}.as_rate()"
        },
        {
          type = "timeseries"
          title = "API Request Count"
          query = "sum:fashion.api.requests{*}"
        },
        {
          type = "timeseries"
          title = "Database Connections"
          query = "sum:fashion.database.connections.active{*}"
        }
      ]
    }
    
    infrastructure_health = {
      title = "Fashion Enterprise - Infrastructure Health"
      widgets = [
        {
          type = "timeseries"
          title = "CPU Usage"
          query = "avg:system.cpu.usage{*}"
        },
        {
          type = "timeseries"
          title = "Memory Usage"
          query = "avg:system.mem.usage{*}"
        },
        {
          type = "timeseries"
          title = "Cache Hit Rate"
          query = "avg:fashion.cache.hit_rate{*}"
        },
        {
          type = "timeseries"
          title = "Storage Usage"
          query = "sum:fashion.storage.used{*}"
        }
      ]
    }
  }
  
  # Enterprise Vault configuration
  enterprise_vault_config = {
    address = var.vault_address
    token = var.vault_token
    
    secrets_engine = {
      path = "secret"
      type = "kv-v2"
    }
    
    auth_methods = {
      aws = {
        path = "aws"
        type = "aws"
        config = {
          iam_role_id = "vault-aws-role"
        }
      }
    }
  }
  
  # Enterprise secrets
  enterprise_secrets = {
    api_keys = {
      anthropic_api_key = {
        path = "secret/api-keys/anthropic"
        key = "api_key"
      }
      openai_api_key = {
        path = "secret/api-keys/openai"
        key = "api_key"
      }
      pinecone_api_key = {
        path = "secret/api-keys/pinecone"
        key = "api_key"
      }
      apify_token = {
        path = "secret/api-keys/apify"
        key = "token"
      }
    }
    
    authentication = {
      clerk_publishable_key = {
        path = "secret/auth/clerk"
        key = "publishable_key"
      }
      clerk_secret_key = {
        path = "secret/auth/clerk"
        key = "secret_key"
      }
      clerk_webhook_secret = {
        path = "secret/auth/clerk"
        key = "webhook_secret"
      }
    }
    
    monitoring = {
      sentry_dsn = {
        path = "secret/monitoring/sentry"
        key = "dsn"
      }
      datadog_api_key = {
        path = "secret/monitoring/datadog"
        key = "api_key"
      }
    }
  }
  
  # Enterprise access policies
  enterprise_access_policies = {
    production_access = {
      name = "production-access"
      description = "Production environment access"
      capabilities = ["create", "read", "update", "delete", "list", "sudo"]
      policies = [
        "secret/data/fashion-enterprise/*"
      ]
    }
    
    readonly_access = {
      name = "readonly-access"
      description = "Read-only access to production secrets"
      capabilities = ["read", "list"]
      policies = [
        "secret/data/fashion-enterprise/*"
      ]
    }
    
    monitoring_access = {
      name = "monitoring-access"
      description = "Access to monitoring and logging secrets"
      capabilities = ["read", "list"]
      policies = [
        "secret/data/monitoring/*"
      ]
    }
  }
  
  # Enterprise backup configuration
  enterprise_backup_config = {
    retention = {
      daily = 30
      weekly = 12
      monthly = 12
      yearly = 7
    }
    
    schedule = {
      daily = "03:00"
      weekly = "03:00"
      monthly = "03:00"
    }
    
    encryption = {
      enabled = true
      algorithm = "AES256"
    }
    
    cross_region = {
      enabled = true
      regions = var.backup_regions
    }
  }
  
  # Enterprise backup targets
  enterprise_backup_targets = {
    databases = {
      neon_main = {
        type = "database"
        identifier = module.database.neon_project_id
        backup_type = "full"
      }
      neon_analytics = {
        type = "database"
        identifier = module.database.analytics_project_id
        backup_type = "full"
      }
    }
    
    storage = {
      s3_data = {
        type = "storage"
        identifier = module.storage.s3_bucket_name
        backup_type = "incremental"
      }
      r2_uploads = {
        type = "storage"
        identifier = module.storage.cloudflare_bucket_name
        backup_type = "full"
      }
    }
    
    application = {
      vercel_config = {
        type = "configuration"
        identifier = module.application.vercel_project_id
        backup_type = "configuration"
      }
    }
  }
  
  # Enterprise lifecycle rules
  enterprise_lifecycle_rules = {
    log_retention = {
      id = "log-retention"
      status = "Enabled"
      filter = {
        prefix = "logs/"
      }
      transitions = [
        {
          days = 30
          storage_class = "STANDARD_IA"
        },
        {
          days = 90
          storage_class = "GLACIER"
        },
        {
          days = 365
          storage_class = "DEEP_ARCHIVE"
        }
      ]
      expiration = {
        days = var.data_retention_days
      }
    }
    
    backup_retention = {
      id = "backup-retention"
      status = "Enabled"
      filter = {
        prefix = "backups/"
      }
      transitions = [
        {
          days = 7
          storage_class = "STANDARD_IA"
        },
        {
          days = 30
          storage_class = "GLACIER"
        }
      ]
      expiration = {
        days = var.backup_retention_days
      }
    }
  }
  
  # Enterprise audit configuration
  enterprise_audit_config = {
    enable_cloudtrail = true
    enable_config_recorder = true
    enable_guardduty = true
    enable_macie = true
    
    audit_trails = [
      {
        name = "fashion-enterprise-cloudtrail"
        s3_bucket_name = "fashion-enterprise-audit-logs"
        include_global_events = true
        multi_region_trail = true
      }
    ]
    
    compliance_checks = [
      "s3-bucket-public-write-prohibited",
      "s3-bucket-default-encryption-enabled",
      "iam-password-policy",
      "root-account-mfa-enabled"
    ]
  }
  
  # Enterprise data classification
  enterprise_data_classification = {
    confidential = {
      description = "Highly sensitive data requiring maximum protection"
      encryption_required = true
      access_logging = true
      retention_days = 2555
    }
    
    internal = {
      description = "Internal business data"
      encryption_required = true
      access_logging = true
      retention_days = 1825
    }
    
    public = {
      description = "Publicly accessible data"
      encryption_required = false
      access_logging = true
      retention_days = 365
    }
  }
}
