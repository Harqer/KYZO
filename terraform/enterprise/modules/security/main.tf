# Security Module
# Single responsibility: Security group and access management

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Application Security Group
resource "aws_security_group" "application" {
  name_prefix = "${var.name_prefix}-app-"
  description = "Application security group"
  vpc_id      = var.vpc_id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-application"
      Type = "Application-SG"
    }
  )
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.name_prefix}-db-"
  description = "Database security group"
  vpc_id      = var.vpc_id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-database"
      Type = "Database-SG"
    }
  )
}

# Cache Security Group
resource "aws_security_group" "cache" {
  name_prefix = "${var.name_prefix}-cache-"
  description = "Cache security group"
  vpc_id      = var.vpc_id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-cache"
      Type = "Cache-SG"
    }
  )
}

# Outputs
output "application_security_group_id" {
  description = "Application security group ID"
  value       = aws_security_group.application.id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "cache_security_group_id" {
  description = "Cache security group ID"
  value       = aws_security_group.cache.id
}
