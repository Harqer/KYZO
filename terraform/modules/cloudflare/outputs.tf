# Cloudflare R2 Storage Module Outputs

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
