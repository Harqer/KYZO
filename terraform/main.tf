# Fashion App Infrastructure as Code
# Provider Configuration
terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    # Neon provider will be added later
  }
}

# Configure providers
provider "vercel" {
  api_token = var.vercel_token
}

# Neon provider will be configured later
# provider "neon" {
#   api_key = var.neon_api_key
# }

# Vercel Project Configuration
resource "vercel_project" "fashion_app" {
  name = "fashion-app"
  framework = "nextjs"
  
  build_command = "npm run build"
  output_directory = "dist"
  
  install_command = "npm install"
  dev_command = "npm run dev"
}

# Vercel Environment Variables
resource "vercel_project_environment_variable" "node_env" {
  project_id = vercel_project.fashion_app.id
  key        = "NODE_ENV"
  value      = "production"
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "clerk_publishable" {
  project_id = vercel_project.fashion_app.id
  key        = "CLERK_PUBLISHABLE_KEY"
  value      = var.clerk_publishable_key
  target     = ["production", "preview", "development"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "clerk_secret" {
  project_id = vercel_project.fashion_app.id
  key        = "CLERK_SECRET_KEY"
  value      = var.clerk_secret_key
  target     = ["production", "preview", "development"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "openai_key" {
  project_id = vercel_project.fashion_app.id
  key        = "OPENAI_API_KEY"
  value      = var.openai_api_key
  target     = ["production", "preview", "development"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "pinecone_key" {
  project_id = vercel_project.fashion_app.id
  key        = "PINECONE_API_KEY"
  value      = var.pinecone_api_key
  target     = ["production", "preview", "development"]
  sensitive  = true
}

resource "vercel_project_domain" "main" {
  project_id = vercel_project.fashion_app.id
  domain     = "fashion-app.vercel.app"
}

# Neon Database Configuration (will be added later)
# resource "neon_project" "fashion_db" {
#   name = "fashion-app-db"
#   
#   postgresql_version = "15"
#   region_id         = "aws-us-east-1"
# }

# resource "neon_database" "main" {
#   project_id   = neon_project.fashion_db.id
#   name         = "fashion_data"
#   owner_name   = "neondb_owner"
#   database_name = "fashion_db"
# }

# resource "neon_branch" "main" {
#   project_id = neon_project.fashion_db.id
#   name       = "main"
# }

# Vercel Agent Configuration (will be added later when supported)
# resource "vercel_agent" "fashion_app" {
#   project_id = vercel_project.fashion_app.id
#   enabled   = true
#   
#   # Agent will monitor your fashion app autonomously
#   capabilities = [
#     "observability",
#     "security_analysis", 
#     "performance_optimization",
#     "automated_root_cause"
#   ]
# }

# Outputs for application use
output "vercel_project_url" {
  description = "The URL of the Vercel project"
  value       = "https://fashion-app.vercel.app"
}

output "project_id" {
  description = "The ID of the Vercel project"
  value       = vercel_project.fashion_app.id
}
