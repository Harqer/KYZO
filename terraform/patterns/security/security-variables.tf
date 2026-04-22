# Security Groups Pattern Variables
# Configuration for security group creation and management

variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where security groups will be created"
  type        = string
}

# Application Security Group
variable "create_application_sg" {
  description = "Whether to create application security group"
  type        = bool
  default     = true
}

variable "application_sg_description" {
  description = "Description for application security group"
  type        = string
  default     = "Application security group"
}

variable "application_ingress_rules" {
  description = "Ingress rules for application security group"
  type = list(object({
    description = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = list(string)
    self        = bool
  }))
  default = []
}

variable "application_egress_rules" {
  description = "Egress rules for application security group"
  type = list(object({
    description = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = list(string)
    self        = bool
  }))
  default = []
}

# Database Security Group
variable "create_database_sg" {
  description = "Whether to create database security group"
  type        = bool
  default     = true
}

variable "database_sg_description" {
  description = "Description for database security group"
  type        = string
  default     = "Database security group"
}

variable "database_ingress_rules" {
  description = "Ingress rules for database security group"
  type = list(object({
    description = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = list(string)
    self        = bool
  }))
  default = []
}

variable "database_egress_rules" {
  description = "Egress rules for database security group"
  type = list(object({
    description = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = list(string)
    self        = bool
  }))
  default = []
}

# Cache Security Group
variable "create_cache_sg" {
  description = "Whether to create cache security group"
  type        = bool
  default     = true
}

variable "cache_sg_description" {
  description = "Description for cache security group"
  type        = string
  default     = "Cache security group"
}

variable "cache_ingress_rules" {
  description = "Ingress rules for cache security group"
  type = list(object({
    description = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = list(string)
    self        = bool
  }))
  default = []
}

variable "cache_egress_rules" {
  description = "Egress rules for cache security group"
  type = list(object({
    description = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = list(string)
    self        = bool
  }))
  default = []
}

# Load Balancer Security Group
variable "create_load_balancer_sg" {
  description = "Whether to create load balancer security group"
  type        = bool
  default     = true
}

variable "load_balancer_sg_description" {
  description = "Description for load balancer security group"
  type        = string
  default     = "Load balancer security group"
}

variable "load_balancer_ingress_rules" {
  description = "Ingress rules for load balancer security group"
  type = list(object({
    description = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = list(string)
    self        = bool
  }))
  default = []
}

variable "load_balancer_egress_rules" {
  description = "Egress rules for load balancer security group"
  type = list(object({
    description = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = list(string)
    self        = bool
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
