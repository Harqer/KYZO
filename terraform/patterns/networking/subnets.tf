# Subnet Pattern
# Single responsibility: Subnet creation and management

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)
  
  vpc_id                  = var.vpc_id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-public-${count.index + 1}"
      Type = "Public-Subnet"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id            = var.vpc_id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-private-${count.index + 1}"
      Type = "Private-Subnet"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.database_subnet_cidrs)
  
  vpc_id            = var.vpc_id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-database-${count.index + 1}"
      Type = "Database-Subnet"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "public" {
  count = length(var.public_subnet_cidrs)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-nat-${count.index + 1}"
      Type = "Public-NAT"
      AZ   = var.availability_zones[count.index]
    }
  )
  
  depends_on = [var.internet_gateway_id]
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)
  
  domain = "vpc"
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-eip-nat-${count.index + 1}"
      Type = "Public-EIP"
    }
  )
  
  depends_on = [var.internet_gateway_id]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = var.vpc_id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = var.internet_gateway_id
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-rt-public"
      Type = "Public-RouteTable"
    }
  )
}

resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id = var.vpc_id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.public[count.index].id
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-rt-private-${count.index + 1}"
      Type = "Private-RouteTable"
      AZ   = var.availability_zones[count.index]
    }
  )
}

resource "aws_route_table" "database" {
  count = length(var.database_subnet_cidrs)
  
  vpc_id = var.vpc_id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-rt-database-${count.index + 1}"
      Type = "Database-RouteTable"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = length(var.database_subnet_cidrs)
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}

# Outputs
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

output "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  value       = aws_subnet.private[*].cidr_block
}

output "database_subnet_cidrs" {
  description = "Database subnet CIDR blocks"
  value       = aws_subnet.database[*].cidr_block
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.public[*].id
}

output "public_route_table_ids" {
  description = "Public route table IDs"
  value       = [aws_route_table.public.id]
}

output "private_route_table_ids" {
  description = "Private route table IDs"
  value       = aws_route_table.private[*].id
}

output "database_route_table_ids" {
  description = "Database route table IDs"
  value       = aws_route_table.database[*].id
}
