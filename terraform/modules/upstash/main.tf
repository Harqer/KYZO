# Upstash Redis Module
# Manages Redis databases for caching and session storage

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
  email   = var.upstash_email
  api_key = var.upstash_api_key
}

# Create Redis databases
resource "upstash_redis_database" "databases" {
  for_each = var.databases
  
  name       = each.value.name
  region     = each.value.region
  encryption = var.encryption
  
  # Performance configuration
  eviction_policy = var.eviction_policy
  maxmemory_policy = var.maxmemory_policy
  
  # Backup configuration
  dynamic "backup" {
    for_each = var.backup_enabled ? [1] : []
    content {
      enabled  = true
      interval = var.backup_interval
    }
  }
}

# Output Redis connection information
output "connection_strings" {
  description = "Redis connection strings for all databases"
  value = {
    for name, db in upstash_redis_database.databases : name => db.connection_string
  }
}

output "rest_tokens" {
  description = "REST API tokens for all databases"
  value = {
    for name, db in upstash_redis_database.databases : name => db.rest_token
  }
}

output "database_ids" {
  description = "Database IDs for all databases"
  value = {
    for name, db in upstash_redis_database.databases : name => db.id
  }
}
