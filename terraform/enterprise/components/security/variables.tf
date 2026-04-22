# Security Group Component Variables
# Focused interface for security group management

variable "name_prefix" {
  description = "Prefix for naming all resources"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where security groups will be created"
  type        = string
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
