# Subnet Pattern Variables
# Configuration for subnet creation and management

variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where subnets will be created"
  type        = string
}

variable "internet_gateway_id" {
  description = "Internet Gateway ID for public route tables"
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

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
