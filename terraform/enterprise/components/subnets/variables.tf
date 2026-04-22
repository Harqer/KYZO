# Subnet Management Component Variables
# Focused interface for subnet provisioning

variable "name_prefix" {
  description = "Prefix for naming all resources"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where subnets will be created"
  type        = string
}

variable "internet_gateway_id" {
  description = "ID of the Internet Gateway for public routes"
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
