# Enterprise Networking Module
# Production-grade VPC and networking infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Enterprise VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-vpc"
      Type = "Enterprise-VPC"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-igw"
      Type = "Enterprise-IGW"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-public-${count.index + 1}"
      Type = "Public-Subnet"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-private-${count.index + 1}"
      Type = "Private-Subnet"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-database-${count.index + 1}"
      Type = "Database-Subnet"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-nat-${count.index + 1}"
      Type = "Enterprise-NAT"
      AZ   = var.availability_zones[count.index]
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  
  domain = "vpc"
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-eip-nat-${count.index + 1}"
      Type = "Enterprise-EIP"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-rt-public"
      Type = "Public-Route-Table"
    }
  )
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-rt-private-${count.index + 1}"
      Type = "Private-Route-Table"
      AZ   = var.availability_zones[count.index]
    }
  )
}

resource "aws_route_table" "database" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-rt-database-${count.index + 1}"
      Type = "Database-Route-Table"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = length(var.availability_zones)
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}

# VPC Flow Logs (Enterprise Security)
resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0
  
  log_destination = var.flow_log_destination_arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-vpc-flow-logs"
      Type = "Enterprise-Flow-Log"
    }
  )
}

# VPC Endpoints for Private Connectivity
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  
  route_table_ids = aws_route_table.private[*].id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-vpce-s3"
      Type = "Enterprise-VPC-Endpoint"
    }
  )
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"
  
  route_table_ids = aws_route_table.private[*].id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-vpce-dynamodb"
      Type = "Enterprise-VPC-Endpoint"
    }
  )
}

# Network ACLs
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-nacl-public"
      Type = "Enterprise-NACL"
    }
  )
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-nacl-private"
      Type = "Enterprise-NACL"
    }
  )
}

resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-nacl-database"
      Type = "Enterprise-NACL"
    }
  )
}

# NACL Rules
resource "aws_network_acl_rule" "public_inbound" {
  count = 20
  
  network_acl_id = aws_network_acl.public.id
  rule_number    = count.index + 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "public_outbound" {
  count = 20
  
  network_acl_id = aws_network_acl.public.id
  rule_number    = count.index + 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = var.availability_zones
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
