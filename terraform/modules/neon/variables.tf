# Neon Database Module Variables

variable "neon_api_key" {
  description = "Neon API key"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Neon project name"
  type        = string
}

variable "postgresql_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "region_id" {
  description = "Neon region ID"
  type        = string
  default     = "aws-us-east-1"
}

variable "databases" {
  description = "Map of databases to create"
  type = map(object({
    name       = string
    owner_name = string
  }))
}

variable "branches" {
  description = "Map of branches to create"
  type = map(object({
    name    = string
    primary = bool
  }))
}

variable "pooler_mode" {
  description = "Connection pooler mode"
  type        = string
  default     = "transaction"
}

variable "pool_size" {
  description = "Connection pool size"
  type        = number
  default     = 20
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}
