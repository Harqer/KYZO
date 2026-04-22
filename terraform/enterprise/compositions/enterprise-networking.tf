# Enterprise Networking Composition
# Demonstrates atomic design principles through component composition

# Variables for composition
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "flow_log_destination_arn" {
  description = "ARN for flow log destination"
  type        = string
}

variable "flow_log_iam_role_arn" {
  description = "IAM role ARN for flow logs"
  type        = string
}

variable "enterprise_tags" {
  description = "Tags for enterprise resources"
  type        = map(string)
  default     = {}
}

# Core VPC Infrastructure
module "vpc_core" {
  source = "../components/core"
  
  name_prefix = "fashion-enterprise"
  cidr_block = var.vpc_cidr
  
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  enable_flow_logs = true
  flow_log_destination_arn = var.flow_log_destination_arn
  flow_log_iam_role_arn   = var.flow_log_iam_role_arn
  
  tags = var.enterprise_tags
}

# Subnet Management (depends on VPC core)
module "subnet_management" {
  source = "../components/subnets"
  
  name_prefix = "fashion-enterprise"
  vpc_id = module.vpc_core.vpc_id
  internet_gateway_id = module.vpc_core.internet_gateway_id
  
  availability_zones = var.availability_zones
  
  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 1),
    cidrsubnet(var.vpc_cidr, 8, 2),
    cidrsubnet(var.vpc_cidr, 8, 3)
  ]
  
  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 11),
    cidrsubnet(var.vpc_cidr, 8, 12),
    cidrsubnet(var.vpc_cidr, 8, 13)
  ]
  
  database_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 21),
    cidrsubnet(var.vpc_cidr, 8, 22),
    cidrsubnet(var.vpc_cidr, 8, 23)
  ]
  
  tags = var.enterprise_tags
}

# Security Groups (depends on VPC core)
module "security_groups" {
  source = "../components/security"
  
  name_prefix = "fashion-enterprise"
  vpc_id = module.vpc_core.vpc_id
  
  # Application security rules
  application_ingress_rules = [
    {
      description = "HTTPS from internet"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    },
    {
      description = "HTTP from internet (redirect)"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    },
    {
      description = "SSH from bastion"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = []
      security_groups = [module.security_groups.load_balancer_security_group_id]
      self        = false
    }
  ]
  
  application_egress_rules = [
    {
      description = "All outbound traffic"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    }
  ]
  
  # Database security rules
  database_ingress_rules = [
    {
      description = "PostgreSQL from application"
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = []
      security_groups = [module.security_groups.application_security_group_id]
      self        = false
    },
    {
      description = "PostgreSQL from cache"
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = []
      security_groups = [module.security_groups.cache_security_group_id]
      self        = false
    }
  ]
  
  # Cache security rules
  cache_ingress_rules = [
    {
      description = "Redis from application"
      from_port   = 6379
      to_port     = 6379
      protocol    = "tcp"
      cidr_blocks = []
      security_groups = [module.security_groups.application_security_group_id]
      self        = false
    }
  ]
  
  # Load balancer security rules
  load_balancer_ingress_rules = [
    {
      description = "HTTPS from internet"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    },
    {
      description = "HTTP from internet"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    }
  ]
  
  load_balancer_egress_rules = [
    {
      description = "To application servers"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = []
      security_groups = [module.security_groups.application_security_group_id]
      self        = false
    },
    {
      description = "To application servers HTTP"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = []
      security_groups = [module.security_groups.application_security_group_id]
      self        = false
    }
  ]
  
  tags = var.enterprise_tags
}

# Composition Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc_core.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc_core.vpc_cidr_block
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = module.vpc_core.internet_gateway_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.subnet_management.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.subnet_management.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.subnet_management.database_subnet_ids
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = module.subnet_management.nat_gateway_ids
}

output "application_security_group_id" {
  description = "Application security group ID"
  value       = module.security_groups.application_security_group_id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = module.security_groups.database_security_group_id
}

output "cache_security_group_id" {
  description = "Cache security group ID"
  value       = module.security_groups.cache_security_group_id
}

output "load_balancer_security_group_id" {
  description = "Load balancer security group ID"
  value       = module.security_groups.load_balancer_security_group_id
}
