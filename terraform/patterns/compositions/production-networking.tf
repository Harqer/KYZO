# Production Networking Composition
# Composes multiple networking patterns for production environment

# Compose VPC Pattern
module "vpc" {
  source = "../../enterprise/modules/networking"
  
  project_name         = "fashion-prod"
  vpc_cidr            = "10.0.0.0/16"
  availability_zones  = ["us-east-1a", "us-east-1b", "us-east-1c"]
  enable_flow_logs    = true
  flow_log_destination_arn = "arn:aws:s3:::fashion-prod-logs"
  aws_region          = "us-east-1"
  
  tags = {
    Environment = "production"
    Project     = "fashion-enterprise"
    ManagedBy   = "terraform"
  }
}

# Note: Subnets are handled within the networking module, no separate subnet module needed

# Compose Security Groups Pattern
module "security_groups" {
  source = "../../enterprise/modules/security"
  
  name_prefix = "fashion-prod"
  vpc_id      = module.vpc.vpc_id
  
  tags = {
    Environment = "production"
    Project     = "fashion-enterprise"
    ManagedBy   = "terraform"
  }
}

# Note: Database and Cache modules would be added here when they are created
# For now, focusing on networking and security components

# Outputs for composition
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.vpc.database_subnet_ids
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

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = module.vpc.internet_gateway_id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = module.vpc.nat_gateway_ids
}
