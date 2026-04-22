# Security Groups Pattern
# Single responsibility: Security group creation and management

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
  count = var.create_application_sg ? 1 : 0
  
  name_prefix = "${var.name_prefix}-app-"
  description = var.application_sg_description
  vpc_id      = var.vpc_id
  
  dynamic "ingress" {
    for_each = var.application_ingress_rules
    content {
      description = ingress.value.description
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      security_groups = ingress.value.security_groups
      self        = ingress.value.self
    }
  }
  
  dynamic "egress" {
    for_each = var.application_egress_rules
    content {
      description = egress.value.description
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      security_groups = egress.value.security_groups
      self        = egress.value.self
    }
  }
  
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
  count = var.create_database_sg ? 1 : 0
  
  name_prefix = "${var.name_prefix}-db-"
  description = var.database_sg_description
  vpc_id      = var.vpc_id
  
  dynamic "ingress" {
    for_each = var.database_ingress_rules
    content {
      description = ingress.value.description
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      security_groups = ingress.value.security_groups
      self        = ingress.value.self
    }
  }
  
  dynamic "egress" {
    for_each = var.database_egress_rules
    content {
      description = egress.value.description
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      security_groups = egress.value.security_groups
      self        = egress.value.self
    }
  }
  
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
  count = var.create_cache_sg ? 1 : 0
  
  name_prefix = "${var.name_prefix}-cache-"
  description = var.cache_sg_description
  vpc_id      = var.vpc_id
  
  dynamic "ingress" {
    for_each = var.cache_ingress_rules
    content {
      description = ingress.value.description
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      security_groups = ingress.value.security_groups
      self        = ingress.value.self
    }
  }
  
  dynamic "egress" {
    for_each = var.cache_egress_rules
    content {
      description = egress.value.description
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      security_groups = egress.value.security_groups
      self        = egress.value.self
    }
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-cache"
      Type = "Cache-SG"
    }
  )
}

# Load Balancer Security Group
resource "aws_security_group" "load_balancer" {
  count = var.create_load_balancer_sg ? 1 : 0
  
  name_prefix = "${var.name_prefix}-lb-"
  description = var.load_balancer_sg_description
  vpc_id      = var.vpc_id
  
  dynamic "ingress" {
    for_each = var.load_balancer_ingress_rules
    content {
      description = ingress.value.description
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      security_groups = ingress.value.security_groups
      self        = ingress.value.self
    }
  }
  
  dynamic "egress" {
    for_each = var.load_balancer_egress_rules
    content {
      description = egress.value.description
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      security_groups = egress.value.security_groups
      self        = egress.value.self
    }
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-load-balancer"
      Type = "LoadBalancer-SG"
    }
  )
}

# Outputs
output "application_security_group_id" {
  description = "Application security group ID"
  value       = var.create_application_sg ? aws_security_group.application[0].id : null
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = var.create_database_sg ? aws_security_group.database[0].id : null
}

output "cache_security_group_id" {
  description = "Cache security group ID"
  value       = var.create_cache_sg ? aws_security_group.cache[0].id : null
}

output "load_balancer_security_group_id" {
  description = "Load balancer security group ID"
  value       = var.create_load_balancer_sg ? aws_security_group.load_balancer[0].id : null
}

output "security_group_ids" {
  description = "All security group IDs"
  value = compact([
    var.create_application_sg ? aws_security_group.application[0].id : null,
    var.create_database_sg ? aws_security_group.database[0].id : null,
    var.create_cache_sg ? aws_security_group.cache[0].id : null,
    var.create_load_balancer_sg ? aws_security_group.load_balancer[0].id : null
  ])
}
