# Vercel Module Outputs

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

output "domains" {
  description = "All custom domains"
  value       = vercel_project_domain.domains
}
