# Simple Networking Composition
# Demonstrates reusability of atomic components

# Variables for simple composition
variable "name_prefix" {
  description = "Prefix for naming all resources"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Core VPC component (reused)
module "vpc_core" {
  source = "../components/core"
  
  name_prefix = var.name_prefix
  cidr_block = var.vpc_cidr
  
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # No flow logs for simple setup
  enable_flow_logs = false
  
  tags = var.tags
}

# Subnet component (reused with custom configuration)
module "subnet_management" {
  source = "../components/subnets"
  
  name_prefix = var.name_prefix
  vpc_id = module.vpc_core.vpc_id
  internet_gateway_id = module.vpc_core.internet_gateway_id
  
  availability_zones = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  
  # No database subnets for simple setup
  database_subnet_cidrs = []
  
  tags = var.tags
}

# Simple security groups
module "security_groups" {
  source = "../components/security"
  
  name_prefix = var.name_prefix
  vpc_id = module.vpc_core.vpc_id
  
  # Basic web security
  application_ingress_rules = [
    {
      description = "HTTP from internet"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    },
    {
      description = "HTTPS from internet"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    }
  ]
  
  application_egress_rules = [
    {
      description = "All outbound"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    }
  ]
  
  tags = var.tags
}

# Outputs for simple composition
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc_core.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.subnet_management.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.subnet_management.private_subnet_ids
}

output "application_security_group_id" {
  description = "Application security group ID"
  value       = module.security_groups.application_security_group_id
}
