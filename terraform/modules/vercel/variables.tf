# Vercel Module Variables

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Vercel project name"
  type        = string
}

variable "framework" {
  description = "Framework used by the project"
  type        = string
  default     = "nextjs"
}

variable "build_command" {
  description = "Build command for the project"
  type        = string
  default     = "npm run build"
}

variable "output_directory" {
  description = "Output directory for build artifacts"
  type        = string
  default     = "dist"
}

variable "install_command" {
  description = "Install command for dependencies"
  type        = string
  default     = "npm install"
}

variable "dev_command" {
  description = "Development command"
  type        = string
  default     = "npm run dev"
}

variable "environment_variables" {
  description = "Environment variables to set"
  type        = map(string)
}

variable "sensitive_variables" {
  description = "List of sensitive variable names"
  type        = list(string)
  default     = []
}

variable "domains" {
  description = "Custom domains to add"
  type        = list(string)
  default     = []
}
