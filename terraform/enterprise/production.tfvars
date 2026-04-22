# Production Terraform Configuration
# Enterprise-grade security and scalability configuration
# SECRETS SHOULD BE STORED IN AWS SECRETS MANAGER OR VAULT

# ============================================================================
# AWS Infrastructure Configuration
# ============================================================================

# AWS Account Configuration (Replace with actual production values)
terraform_execution_role = "arn:aws:iam::123456789012:role/TerraformExecutionRole"
aws_region = "us-east-1"

# KMS Configuration for encryption
kms_key_id = "arn:aws:kms:us-east-1:123456789012:key/production-terraform-key"
s3_bucket = "fashion-enterprise-terraform-state-prod"

# ============================================================================
# AI Services Configuration (Production Keys)
# ============================================================================

# Anthropic Claude for AI-powered features
anthropic_api_key = "sk-ant-api03-production-key-replace-with-actual"

# OpenAI for additional AI capabilities
openai_api_key = "sk-proj-production-key-replace-with-actual"

# ============================================================================
# Vector Database Configuration
# ============================================================================

# Pinecone for vector search and recommendations
pinecone_api_key = "pcsk_production_key_replace_with_actual"
pinecone_index_host = "https://fashion-vectors.pinecone.io"
pinecone_index_name = "fashion-products"

# ============================================================================
# Cache Configuration
# ============================================================================

# Upstash Redis for distributed caching
upstash_email = "redis@fashion-enterprise.com"
upstash_api_key = "production_redis_key_replace_with_actual"
redis_auth_token = "production_redis_token_replace_with_actual"

# ============================================================================
# Storage Configuration
# ============================================================================

# Cloudflare R2 for media storage
cloudflare_api_token = "production_cloudflare_token_replace_with_actual"
cloudflare_account_id = "1234567890abcdef1234567890abcdef"

# ============================================================================
# Authentication Configuration
# ============================================================================

# Clerk for user authentication (Production keys)
clerk_publishable_key = "pk_live_production_clerk_publishable_key"
clerk_secret_key = "sk_live_production_clerk_secret_key"
clerk_webhook_secret = "whsec_production_clerk_webhook_secret"

# ============================================================================
# External Services Configuration
# ============================================================================

# Apify for web scraping and data collection
apify_token = "apify_api_production_token_replace"
apify_api_key = "apify_api_production_key_replace"

# ============================================================================
# Monitoring and Observability
# ============================================================================

# LangSmith for AI/LLM monitoring
langsmith_api_key = "lsv2_pt_production_langsmith_key"

# Datadog for application monitoring
datadog_api_key = "production_datadog_api_key"
datadog_app_key = "production_datadog_app_key"

# ============================================================================
# Database Configuration
# ============================================================================

# Neon PostgreSQL for primary database
neon_api_key = "npg_production_neon_api_key"
database_url = "postgresql://fashion_user:secure_password@ep-production-db.us-east-1.aws.neon.tech/fashion_db?sslmode=require"

# ============================================================================
# Vercel Configuration
# ============================================================================

# Vercel for frontend deployment
vercel_api_token = "production_vercel_api_token"

# ============================================================================
# Security and Secrets Management
# ============================================================================

# HashiCorp Vault for secrets management
vault_address = "https://vault.fashion-enterprise.com"
vault_token = "production_vault_token_secure"

# ============================================================================
# Enterprise Features Configuration
# ============================================================================

# Cost optimization settings
enable_cost_optimization = true
enable_spot_instances = true
enable_autoscaling = true

# Security settings
enable_ddos_protection = true
enable_waf = true
enable_vpc_flow_logs = true
enable_cloudtrail = true

# Compliance settings
enable_gdpr_compliance = true
enable_soc2_compliance = true
enable_audit_logging = true

# ============================================================================
# Performance and Scalability
# ============================================================================

# Database performance
database_pool_size = 20
database_connection_timeout = 5000
enable_read_replicas = true
read_replica_count = 2

# Cache performance
redis_cluster_enabled = true
redis_max_connections = 50
enable_redis_persistence = true

# CDN and edge performance
enable_cloudflare_cdn = true
cache_ttl_static = 31536000  # 1 year
cache_ttl_api = 300          # 5 minutes

# ============================================================================
# Monitoring and Alerting
# ============================================================================

# Performance monitoring
enable_apm = true
enable_error_tracking = true
enable_performance_monitoring = true

# Alert thresholds
error_rate_threshold = 0.01  # 1%
response_time_threshold = 500  # 500ms
cpu_threshold = 80
memory_threshold = 85

# ============================================================================
# Backup and Disaster Recovery
# ============================================================================

# Database backup settings
backup_retention_days = 30
enable_point_in_time_recovery = true
backup_frequency = "daily"

# Cross-region replication
enable_cross_region_backup = true
backup_regions = ["us-west-2", "eu-west-1"]

# ============================================================================
# Environment Tags
# ============================================================================

environment_tags = {
  Environment = "production"
  Project = "fashion-enterprise"
  Owner = "infrastructure-team"
  CostCenter = "engineering"
  Compliance = "enterprise"
  DataClassification = "confidential"
}
