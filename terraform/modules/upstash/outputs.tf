# Upstash Redis Module Outputs

output "connection_string" {
  description = "Primary Redis connection string"
  value       = values(upstash_redis_database.databases)[0].connection_string
}

output "rest_token" {
  description = "Primary Redis REST token"
  value       = values(upstash_redis_database.databases)[0].rest_token
}

output "connection_strings" {
  description = "All Redis connection strings"
  value = {
    for name, db in upstash_redis_database.databases : name => db.connection_string
  }
}

output "rest_tokens" {
  description = "All Redis REST tokens"
  value = {
    for name, db in upstash_redis_database.databases : name => db.rest_token
  }
}

output "database_ids" {
  description = "All Redis database IDs"
  value = {
    for name, db in upstash_redis_database.databases : name => db.id
  }
}
