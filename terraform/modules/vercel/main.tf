# Vercel Module
# Manages Vercel projects, environment variables, and domains

terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

# Configure Vercel provider
provider "vercel" {
  api_token = var.vercel_api_token
}

# Create Vercel project
resource "vercel_project" "main" {
  name      = var.project_name
  framework = var.framework
  
  build_command = var.build_command
  output_directory = var.output_directory
  install_command = var.install_command
  dev_command = var.dev_command
  
  # Environment configuration
  git_repository = {
    type = "github"
  }
}

# Create environment variables
resource "vercel_project_environment_variable" "variables" {
  for_each = var.environment_variables
  
  project_id = vercel_project.main.id
  key        = each.key
  value      = each.value
  target     = ["production", "preview", "development"]
  sensitive  = contains(var.sensitive_variables, each.key)
}

# Create custom domains
resource "vercel_project_domain" "domains" {
  for_each = toset(var.domains)
  
  project_id = vercel_project.main.id
  domain     = each.value
}

# Output project information
output "project_id" {
  description = "Vercel project ID"
  value       = vercel_project.main.id
}

output "project_url" {
  description = "Vercel project URL"
  value       = "https://${var.project_name}.vercel.app"
}

output "environment_variables" {
  description = "All environment variables"
  value       = vercel_project_environment_variable.variables
}
