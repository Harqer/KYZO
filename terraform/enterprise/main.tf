# Enterprise Production Infrastructure
# Production-grade configuration for enterprise fashion application

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    # Core infrastructure providers
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    
    # Application deployment
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    
    # Database services
    neon = {
      source  = "neondatabase/neon"
      version = "~> 0.3"
    }
    
    # Cache services
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
    
    # Storage and CDN
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    
    # Monitoring and observability
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.0"
    }
    
    # Security and secrets
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.0"
    }
    
    # Container registry
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }

  # Enterprise-grade remote state management
  backend "s3" {
    bucket         = "fashion-enterprise-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "fashion-enterprise-terraform-locks"
    
    # Enterprise features
    role_arn = "arn:aws:iam::ACCOUNT_ID:role/TerraformExecutionRole"
    session_name = "terraform-enterprise"
    
    # Enhanced security
    sse_customer_algorithm = "AES256"
    kms_key_id           = "arn:aws:kms:us-east-1:ACCOUNT_ID:key/terraform-state-key"
  }
}

# Enterprise provider configurations
provider "aws" {
  region = var.aws_region
  
  # Enterprise security
  assume_role {
    role_arn = var.terraform_execution_role
    session_name = "terraform-enterprise-session"
  }
  
  default_tags {
    tags = merge(
      local.enterprise_tags,
      {
        Environment = "production"
        ManagedBy   = "terraform"
        Project     = "fashion-enterprise"
      }
    )
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "neon" {
  api_key = var.neon_api_key
}

provider "upstash" {
  email    = var.upstash_email
  api_key  = var.upstash_api_key
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "datadog" {
  api_key  = var.datadog_api_key
  app_key  = var.datadog_app_key
}

provider "vault" {
  address = var.vault_address
  token   = var.vault_token
}

# Enterprise networking foundation using composable components
module "enterprise_networking" {
  source = "./compositions/enterprise-networking"
  
  vpc_cidr                 = var.vpc_cidr
  availability_zones       = var.availability_zones
  flow_log_destination_arn = var.flow_log_destination_arn
  flow_log_iam_role_arn    = var.flow_log_iam_role_arn
  enterprise_tags          = local.enterprise_tags
}

# Enterprise security foundation
module "security" {
  source = "./modules/security"
  
  vpc_id = module.enterprise_networking.vpc_id
  
  # Enterprise security groups
  security_groups = local.enterprise_security_groups
  
  # WAF and DDoS protection
  enable_waf = true
  enable_ddos_protection = true
  
  tags = local.enterprise_tags
}

# Enterprise database infrastructure
module "database" {
  source = "./modules/database"
  
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  security_group_ids = [module.security.database_security_group_id]
  
  # Enterprise database configuration
  database_config = local.enterprise_database_config
  
  # High availability and disaster recovery
  enable_multi_az = true
  enable_read_replicas = true
  backup_retention_period = var.backup_retention_days
  
  # Performance
  instance_class = var.database_instance_class
  allocated_storage = var.database_storage
  
  tags = local.enterprise_tags
}

# Enterprise cache infrastructure
module "cache" {
  source = "./modules/cache"
  
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  security_group_ids = [module.security.cache_security_group_id]
  
  # Enterprise cache configuration
  cache_config = local.enterprise_cache_config
  
  # High availability
  enable_multi_az = true
  automatic_failover_enabled = true
  
  # Performance
  node_type = var.cache_node_type
  num_cache_nodes = var.cache_num_nodes
  
  tags = local.enterprise_tags
}

# Enterprise storage infrastructure
module "storage" {
  source = "./modules/storage"
  
  # Enterprise storage configuration
  storage_config = local.enterprise_storage_config
  
  # Security
  enable_versioning = true
  enable_encryption = true
  
  # Lifecycle management
  lifecycle_rules = local.enterprise_lifecycle_rules
  
  tags = local.enterprise_tags
}

# Enterprise application deployment
module "application" {
  source = "./modules/application"
  
  # Vercel enterprise deployment
  vercel_config = local.enterprise_vercel_config
  
  # Container registry
  docker_config = local.enterprise_docker_config
  
  # Environment variables from secure sources
  environment_variables = local.enterprise_environment_variables
  
  # Monitoring and observability
  enable_monitoring = var.enable_monitoring
  monitoring_config = local.enterprise_monitoring_config
  
  tags = local.enterprise_tags
}

# Enterprise monitoring and observability
module "monitoring" {
  source = "./modules/monitoring"
  
  # Monitoring configuration
  datadog_config = local.enterprise_datadog_config
  
  # Alerting
  alert_rules = local.enterprise_alert_rules
  
  # Dashboards
  dashboards = local.enterprise_dashboards
  
  # Log management
  enable_log_management = true
  log_config = local.enterprise_log_config
  
  tags = local.enterprise_tags
}

# Enterprise secrets management
module "secrets" {
  source = "./modules/secrets"
  
  vault_config = local.enterprise_vault_config
  
  # Secrets to manage
  secrets = local.enterprise_secrets
  
  # Access policies
  access_policies = local.enterprise_access_policies
  
  tags = local.enterprise_tags
}

# Enterprise backup and disaster recovery
module "backup" {
  source = "./modules/backup"
  
  # Resources to backup
  backup_targets = local.enterprise_backup_targets
  
  # Backup configuration
  backup_config = local.enterprise_backup_config
  
  # Cross-region replication
  enable_cross_region_backup = true
  backup_regions = var.backup_regions
  
  tags = local.enterprise_tags
}

# Enterprise compliance and governance
module "compliance" {
  source = "./modules/compliance"
  
  # Compliance frameworks
  compliance_frameworks = var.compliance_frameworks
  
  # Audit logging
  enable_audit_logging = true
  audit_config = local.enterprise_audit_config
  
  # Data classification
  data_classification = local.enterprise_data_classification
  
  tags = local.enterprise_tags
}
