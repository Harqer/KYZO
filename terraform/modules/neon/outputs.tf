# Neon Database Module Outputs

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

output "pooler_id" {
  description = "Connection pooler ID"
  value       = neon_pooler.main.id
}
