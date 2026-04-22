# Security Group Component Outputs
# Clean interface for dependency injection

output "application_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.application.id
}

output "application_security_group_arn" {
  description = "ARN of the application security group"
  value       = aws_security_group.application.arn
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "database_security_group_arn" {
  description = "ARN of the database security group"
  value       = aws_security_group.database.arn
}

output "cache_security_group_id" {
  description = "ID of the cache security group"
  value       = aws_security_group.cache.id
}

output "cache_security_group_arn" {
  description = "ARN of the cache security group"
  value       = aws_security_group.cache.arn
}

output "load_balancer_security_group_id" {
  description = "ID of the load balancer security group"
  value       = aws_security_group.load_balancer.id
}

output "load_balancer_security_group_arn" {
  description = "ARN of the load balancer security group"
  value       = aws_security_group.load_balancer.arn
}
