# VPC Core Pattern
# Single responsibility: VPC and core networking infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC Resource
resource "aws_vpc" "this" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-vpc"
      Type = "Core-VPC"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-igw"
      Type = "Core-IGW"
    }
  )
}

# DHCP Options Set (Optional)
resource "aws_vpc_dhcp_options" "this" {
  count = var.create_dhcp_options ? 1 : 0
  
  domain_name         = var.domain_name
  domain_name_servers = var.domain_name_servers
  netbios_name_servers = var.netbios_name_servers
  netbios_node_type   = var.netbios_node_type
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-dhcp-options"
      Type = "Core-DHCP"
    }
  )
}

# DHCP Options Association
resource "aws_vpc_dhcp_options_association" "this" {
  count = var.create_dhcp_options ? 1 : 0
  
  vpc_id          = aws_vpc.this.id
  dhcp_options_id = aws_vpc_dhcp_options.this[0].id
}

# VPC Flow Logs
resource "aws_flow_log" "this" {
  count = var.enable_flow_logs ? 1 : 0
  
  log_destination = var.flow_log_destination_arn
  traffic_type    = var.flow_log_traffic_type
  vpc_id          = aws_vpc.this.id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-vpc-flow-logs"
      Type = "Core-FlowLog"
    }
  )
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.this.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.this.cidr_block
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.this.id
}

output "dhcp_options_id" {
  description = "DHCP Options ID"
  value       = var.create_dhcp_options ? aws_vpc_dhcp_options.this[0].id : null
}
