# Cloudflare R2 Storage Module Variables

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "buckets" {
  description = "Map of R2 buckets to create"
  type = map(object({
    name = string
    type = string
  }))
}

variable "encryption_enabled" {
  description = "Enable encryption for buckets"
  type        = bool
  default     = true
}

variable "r2_access_key" {
  description = "R2 access key"
  type        = string
  sensitive   = true
}

variable "r2_secret_key" {
  description = "R2 secret key"
  type        = string
  sensitive   = true
}

variable "log_enabled" {
  description = "Enable logging for buckets"
  type        = bool
  default     = true
}
