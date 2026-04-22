# Neon Database Module
# Manages Neon PostgreSQL databases and branches

terraform {
  required_providers {
    neon = {
      source  = "neondatabase/neon"
      version = "~> 0.3"
    }
  }
}

# Configure Neon provider
provider "neon" {
  api_key = var.neon_api_key
}

# Create Neon project
resource "neon_project" "main" {
  name               = var.project_name
  postgresql_version = var.postgresql_version
  region_id          = var.region_id
  
  # Enable point-in-time recovery
  pg_hba = "host all all all md5"
}

# Create databases
resource "neon_database" "databases" {
  for_each = var.databases
  
  project_id   = neon_project.main.id
  name         = each.value.name
  owner_name   = each.value.owner_name
  branch_id    = neon_branch.main[each.key != null ? each.key : "main"].id
}

# Create branches
resource "neon_branch" "main" {
  for_each = var.branches
  
  project_id = neon_project.main.id
  name       = each.value.name
  primary    = each.value.primary
}

# Create connection poolers
resource "neon_pooler" "main" {
  project_id = neon_project.main.id
  branch_id  = neon_branch.main["main"].id
  mode       = var.pooler_mode
  size       = var.pool_size
}

# Output database information
output "project_id" {
  description = "Neon project ID"
  value       = neon_project.main.id
}

output "connection_string" {
  description = "Primary database connection string"
  value       = neon_pooler.main.connection_string
}

output "database_ids" {
  description = "All database IDs"
  value = {
    for name, db in neon_database.databases : name => db.id
  }
}

output "branch_ids" {
  description = "All branch IDs"
  value = {
    for name, branch in neon_branch.main : name => branch.id
  }
}
