# Cloudflare R2 Storage Module
# Manages Cloudflare R2 buckets and access controls

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Configure Cloudflare provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Create R2 buckets
resource "cloudflare_r2_bucket" "buckets" {
  for_each = var.buckets
  
  account_id = var.account_id
  name       = each.value.name
}

# Create R2 bucket policies
resource "cloudflare_r2_bucket_policy" "policies" {
  for_each = var.buckets
  
  account_id = var.account_id
  bucket     = cloudflare_r2_bucket.buckets[each.key].name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action = each.value.type == "public" ? [
          "s3:GetObject"
        ] : []
        Resource = [
          "arn:aws:s3:::${each.value.name}/*"
        ]
      }
    ]
  })
}

# Output bucket information
output "bucket_names" {
  description = "All bucket names"
  value = {
    for name, bucket in cloudflare_r2_bucket.buckets : name => bucket.name
  }
}

output "bucket_urls" {
  description = "All bucket URLs"
  value = {
    for name, bucket in cloudflare_r2_bucket.buckets : name => "https://${bucket.name}.r2.cloudflarestorage.com"
  }
}

output "access_key" {
  description = "R2 access key"
  value       = var.r2_access_key
  sensitive   = true
}

output "secret_key" {
  description = "R2 secret key"
  value       = var.r2_secret_key
  sensitive   = true
}

output "bucket_name" {
  description = "Primary bucket name"
  value       = values(cloudflare_r2_bucket.buckets)[0].name
}
