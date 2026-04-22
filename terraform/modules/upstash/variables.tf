# Upstash Redis Module Variables

variable "upstash_email" {
  description = "Upstash account email"
  type        = string
  sensitive   = true
}

variable "upstash_api_key" {
  description = "Upstash API key"
  type        = string
  sensitive   = true
}

variable "databases" {
  description = "Map of Redis databases to create"
  type = map(object({
    name   = string
    region = string
    type   = string
  }))
}

variable "encryption" {
  description = "Enable encryption for Redis databases"
  type        = bool
  default     = true
}

variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_interval" {
  description = "Backup interval in seconds"
  type        = number
  default     = 3600
}

variable "eviction_policy" {
  description = "Redis eviction policy"
  type        = string
  default     = "allkeys-lru"
}

variable "maxmemory_policy" {
  description = "Redis max memory policy"
  type        = string
  default     = "allkeys-lru"
}
