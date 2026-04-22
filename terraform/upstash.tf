# Upstash Redis Configuration
terraform {
  required_providers {
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
  }
}

# Configure Upstash provider
provider "upstash" {
  email = var.upstash_email
  api_key = var.upstash_api_key
}

# Upstash Redis Database
resource "upstash_redis_database" "shop" {
  name       = "shop"
  region     = "us-east-1"
  encryption = true
  
  # Performance settings
  eviction_policy = "allkeys-lru"
  maxmemory_policy = "allkeys-lru"
  
  # Backup settings
  backup {
    enabled = true
    interval = 3600 # 1 hour
  }
}

# Upstash Redis Environment Variables for Vercel
resource "vercel_project_environment_variable" "upstash_redis_url" {
  project_id = vercel_project.fashion_app.id
  key        = "UPSTASH_REDIS_URL"
  value      = upstash_redis_database.shop.connection_string
  target     = ["production", "preview", "development"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "upstash_redis_token" {
  project_id = vercel_project.fashion_app.id
  key        = "UPSTASH_REDIS_REST_TOKEN"
  value      = upstash_redis_database.shop.rest_token
  target     = ["production", "preview", "development"]
  sensitive  = true
}

# Outputs
output "upstash_redis_url" {
  description = "Upstash Redis connection URL"
  value       = upstash_redis_database.shop.connection_string
  sensitive   = true
}

output "upstash_redis_id" {
  description = "Upstash Redis database ID"
  value       = upstash_redis_database.shop.id
}
