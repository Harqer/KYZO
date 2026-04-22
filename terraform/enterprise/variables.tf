# Enterprise Infrastructure Variables
# Production-grade configuration parameters

# AWS Infrastructure
variable "aws_region" {
  description = "Primary AWS region for infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "terraform_execution_role" {
  description = "IAM role for Terraform execution"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Database Configuration
variable "database_instance_class" {
  description = "RDS instance class for production database"
  type        = string
  default     = "db.m6g.large"
}

variable "database_storage" {
  description = "Database storage size in GB"
  type        = number
  default     = 500
}

variable "backup_retention_days" {
  description = "Database backup retention period in days"
  type        = number
  default     = 30
}

# Cache Configuration
variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.m6g.large"
}

variable "cache_num_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 3
}

# Application Services
variable "vercel_api_token" {
  description = "Vercel enterprise API token"
  type        = string
  sensitive   = true
}

variable "neon_api_key" {
  description = "Neon database API key"
  type        = string
  sensitive   = true
}

variable "upstash_email" {
  description = "Upstash enterprise email"
  type        = string
  sensitive   = true
}

variable "upstash_api_key" {
  description = "Upstash enterprise API key"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare enterprise API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare enterprise account ID"
  type        = string
  sensitive   = true
}

# Monitoring and Observability
variable "enable_monitoring" {
  description = "Enable comprehensive monitoring"
  type        = bool
  default     = true
}

variable "datadog_api_key" {
  description = "Datadog API key for enterprise monitoring"
  type        = string
  sensitive   = true
}

variable "datadog_app_key" {
  description = "Datadog application key"
  type        = string
  sensitive   = true
}

# Security and Compliance
variable "vault_address" {
  description = "Vault server address for secrets management"
  type        = string
}

variable "vault_token" {
  description = "Vault token for authentication"
  type        = string
  sensitive   = true
}

variable "compliance_frameworks" {
  description = "Compliance frameworks to enforce"
  type        = list(string)
  default     = ["SOC2", "GDPR", "HIPAA"]
}

# Disaster Recovery
variable "backup_regions" {
  description = "Additional regions for cross-region backup"
  type        = list(string)
  default     = ["us-west-2", "eu-west-1"]
}

# Enterprise Features
variable "enable_ddos_protection" {
  description = "Enable AWS DDoS protection"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

variable "enable_audit_logging" {
  description = "Enable comprehensive audit logging"
  type        = bool
  default     = true
}

# Cost Management
variable "cost_allocation_tags" {
  description = "Tags for cost allocation"
  type        = map(string)
  default = {
    CostCenter = "engineering"
    Project    = "fashion-enterprise"
    Environment = "production"
  }
}

# Performance and Scaling
variable "enable_auto_scaling" {
  description = "Enable auto-scaling for application services"
  type        = bool
  default     = true
}

variable "min_capacity" {
  description = "Minimum capacity for auto-scaling"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum capacity for auto-scaling"
  type        = number
  default     = 10
}

# Enterprise Support
variable "enable_enterprise_support" {
  description = "Enable enterprise support features"
  type        = bool
  default     = true
}

variable "support_contact_email" {
  description = "Email for infrastructure alerts"
  type        = string
}

# Data Governance
variable "data_retention_days" {
  description = "Data retention period in days"
  type        = number
  default     = 2555  # 7 years for compliance
}

variable "enable_data_encryption" {
  description = "Enable comprehensive data encryption"
  type        = bool
  default     = true
}

variable "redis_auth_token" {
  description = "Redis auth token for ElastiCache"
  type        = string
  sensitive   = true
}

# AI Services
variable "anthropic_api_key" {
  description = "Anthropic API key for AI services"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for AI services"
  type        = string
  sensitive   = true
}

# Vector Database
variable "pinecone_api_key" {
  description = "Pinecone API key for vector search"
  type        = string
  sensitive   = true
}

variable "pinecone_index_host" {
  description = "Pinecone index host URL"
  type        = string
  sensitive   = true
}

variable "pinecone_index_name" {
  description = "Pinecone index name"
  type        = string
  sensitive   = true
}

# Authentication
variable "clerk_publishable_key" {
  description = "Clerk publishable key for authentication"
  type        = string
  sensitive   = true
}

variable "clerk_secret_key" {
  description = "Clerk secret key for authentication"
  type        = string
  sensitive   = true
}

variable "clerk_webhook_secret" {
  description = "Clerk webhook secret for authentication"
  type        = string
  sensitive   = true
}

# External Services
variable "apify_token" {
  description = "Apify token for web scraping"
  type        = string
  sensitive   = true
}

variable "apify_api_key" {
  description = "Apify API key for web scraping"
  type        = string
  sensitive   = true
}

# Monitoring
variable "langsmith_api_key" {
  description = "LangSmith API key for monitoring"
  type        = string
  sensitive   = true
}

variable "langchain_api_key" {
  description = "LangChain API key for monitoring"
  type        = string
  sensitive   = true
}

# Database URL
variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
}
