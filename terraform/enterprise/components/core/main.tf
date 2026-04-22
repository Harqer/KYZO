# Core VPC Infrastructure Component
# Single responsibility: VPC and fundamental networking resources

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary VPC resource
resource "aws_vpc" "main" {
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

# Internet Gateway for external connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-igw"
      Type = "Core-IGW"
    }
  )
}

# VPC Flow Logs for security and monitoring
resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0
  
  iam_role_arn    = var.flow_log_iam_role_arn
  log_destination = var.flow_log_destination_arn
  traffic_type    = "ALL"
  vpc_id         = aws_vpc.main.id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-flow-log"
      Type = "Core-FlowLog"
    }
  )
}

# DHCP Options Set for custom DNS configuration
resource "aws_vpc_dhcp_options" "main" {
  count = var.enable_custom_dhcp ? 1 : 0
  
  domain_name         = var.dhcp_domain_name
  domain_name_servers = var.dhcp_domain_servers
  ntp_servers         = var.dhcp_ntp_servers
  netbios_name_servers = var.dhcp_netbios_servers
  netbios_node_type   = var.dhcp_netbios_node_type
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-dhcp-options"
      Type = "Core-DHCP"
    }
  )
}

# Associate custom DHCP options with VPC
resource "aws_vpc_dhcp_options_association" "main" {
  count = var.enable_custom_dhcp ? 1 : 0
  
  vpc_id          = aws_vpc.main.id
  dhcp_options_id = aws_vpc_dhcp_options.main[0].id
}
