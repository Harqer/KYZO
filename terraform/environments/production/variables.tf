# Production Environment Variables
# Defines all configurable parameters for production infrastructure

variable "vercel_api_token" {
  description = "Vercel API token for project management"
  type        = string
  sensitive   = true
}

variable "neon_api_key" {
  description = "Neon database API key"
  type        = string
  sensitive   = true
}

variable "upstash_email" {
  description = "Upstash account email"
  type        = string
  sensitive   = true
}

variable "upstash_api_key" {
  description = "Upstash Redis API key"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token for R2 storage management"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
  sensitive   = true
}

variable "datadog_api_key" {
  description = "Datadog API key for monitoring"
  type        = string
  sensitive   = true
}

variable "datadog_app_key" {
  description = "Datadog application key for monitoring"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Primary domain for the application"
  type        = string
  default     = "fashion-app.vercel.app"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "region" {
  description = "Primary AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "enable_monitoring" {
  description = "Enable comprehensive monitoring"
  type        = bool
  default     = true
}

variable "enable_backups" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

# AI Service Variables
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

# Authentication Variables
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

# Monitoring Variables
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

# External Service Variables
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
