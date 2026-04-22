# Subnet Management Component
# Single responsibility: Subnet provisioning and routing

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
      Name = "${var.name_prefix}-public-${var.availability_zones[count.index]}"
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
      Name = "${var.name_prefix}-private-${var.availability_zones[count.index]}"
      Type = "Private-Subnet"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Database Subnets (isolated)
resource "aws_subnet" "database" {
  count = length(var.database_subnet_cidrs)
  
  vpc_id            = var.vpc_id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-database-${var.availability_zones[count.index]}"
      Type = "Database-Subnet"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)
  domain = "vpc"
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-nat-eip-${var.availability_zones[count.index]}"
      Type = "NAT-EIP"
      AZ   = var.availability_zones[count.index]
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways for private subnet internet access
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-nat-${var.availability_zones[count.index]}"
      Type = "NAT-Gateway"
      AZ   = var.availability_zones[count.index]
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = var.vpc_id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = var.internet_gateway_id
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-public-rt"
      Type = "Public-RouteTable"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id = var.vpc_id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-private-rt-${var.availability_zones[count.index]}"
      Type = "Private-RouteTable"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Database Route Tables (no internet access)
resource "aws_route_table" "database" {
  count = length(var.database_subnet_cidrs)
  
  vpc_id = var.vpc_id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-database-rt-${var.availability_zones[count.index]}"
      Type = "Database-RouteTable"
      AZ   = var.availability_zones[count.index]
    }
  )
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table Associations - Database
resource "aws_route_table_association" "database" {
  count = length(var.database_subnet_cidrs)
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}
