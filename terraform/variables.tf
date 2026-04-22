# Input Variables for Fashion App Infrastructure

variable "vercel_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}

variable "neon_api_key" {
  description = "Neon API key for database management"
  type        = string
  sensitive   = true
}

variable "clerk_publishable_key" {
  description = "Clerk publishable key for frontend"
  type        = string
  sensitive   = true
}

variable "clerk_secret_key" {
  description = "Clerk secret key for backend"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for AI features"
  type        = string
  sensitive   = true
}

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

variable "pinecone_api_key" {
  description = "Pinecone API key for vector search"
  type        = string
  sensitive   = true
}
