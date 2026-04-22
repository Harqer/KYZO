# Production Environment Configuration
# This is the main entry point for production infrastructure

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    # Core providers
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    
    # Database providers
    neon = {
      source  = "neondatabase/neon"
      version = "~> 0.3"
    }
    
    # Cache providers
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
    
    # Storage providers
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    
    # Monitoring providers
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.0"
    }
    
    # Security providers
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.0"
    }
  }

  # Backend configuration for state management
  backend "s3" {
    bucket = "fashion-app-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    
    # Enable state locking
    dynamodb_table = "fashion-app-terraform-locks"
    
    # Enable state encryption
    encrypt = true
  }
}

# Configure providers
provider "vercel" {
  api_token = var.vercel_api_token
}

provider "neon" {
  api_key = var.neon_api_key
}

provider "upstash" {
  email    = var.upstash_email
  api_key  = var.upstash_api_key
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "datadog" {
  api_key  = var.datadog_api_key
  app_key  = var.datadog_app_key
}

# Include all modules
module "vercel_infrastructure" {
  source = "../../modules/vercel"
  
  project_name = "fashion-app"
  framework    = "nextjs"
  
  environment_variables = local.vercel_environment_variables
  domains            = local.vercel_domains
  
  depends_on = [
    module.neon_database,
    module.upstash_redis,
    module.cloudflare_storage
  ]
}

module "neon_database" {
  source = "../../modules/neon"
  
  project_name = "fashion-app-db"
  
  postgresql_version = "15"
  region_id         = "aws-us-east-1"
  
  databases = local.neon_databases
  branches   = local.neon_branches
  
  # Enable backups and point-in-time recovery
  backup_retention_days = 30
  
  # Connection pooling
  pooler_mode = "transaction"
  pool_size   = 20
}

module "upstash_redis" {
  source = "../../modules/upstash"
  
  databases = local.upstash_databases
  
  # Enable encryption and backups
  encryption = true
  backup_enabled = true
  backup_interval = 3600
  
  # Performance tuning
  eviction_policy = "allkeys-lru"
  maxmemory_policy = "allkeys-lru"
}

module "cloudflare_storage" {
  source = "../../modules/cloudflare"
  
  account_id = var.cloudflare_account_id
  
  buckets = local.cloudflare_buckets
  
  # Enable security features
  encryption_enabled = true
  public_access_blocked = true
  
  # Enable logging
  log_enabled = true
}

module "monitoring" {
  source = "../../modules/monitoring"
  
  environment = "production"
  
  # Service monitoring
  services = local.monitored_services
  
  # Alert configuration
  alerts = local.monitoring_alerts
  
  # Dashboard configuration
  dashboards = local.monitoring_dashboards
}

module "security" {
  source = "../../modules/security"
  
  environment = "production"
  
  # API key management
  api_keys = local.managed_api_keys
  
  # Access control
  access_policies = local.access_policies
  
  # Secrets management
  secrets = local.managed_secrets
}
