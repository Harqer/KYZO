# Security Group Component
# Single responsibility: Network security and access control

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
  description = "Security group for application servers"
  vpc_id      = var.vpc_id
  
  # Dynamic ingress rules
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
  
  # Dynamic egress rules
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
      Name = "${var.name_prefix}-application-sg"
      Type = "Application-SecurityGroup"
    }
  )
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.name_prefix}-db-"
  description = "Security group for database servers"
  vpc_id      = var.vpc_id
  
  # Dynamic ingress rules
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
  
  # Database typically has no egress rules
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-database-sg"
      Type = "Database-SecurityGroup"
    }
  )
}

# Cache Security Group
resource "aws_security_group" "cache" {
  name_prefix = "${var.name_prefix}-cache-"
  description = "Security group for cache servers"
  vpc_id      = var.vpc_id
  
  # Dynamic ingress rules
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
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-cache-sg"
      Type = "Cache-SecurityGroup"
    }
  )
}

# Load Balancer Security Group
resource "aws_security_group" "load_balancer" {
  name_prefix = "${var.name_prefix}-lb-"
  description = "Security group for load balancers"
  vpc_id      = var.vpc_id
  
  # Dynamic ingress rules
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
  
  # Dynamic egress rules
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
      Name = "${var.name_prefix}-load-balancer-sg"
      Type = "LoadBalancer-SecurityGroup"
    }
  )
}
