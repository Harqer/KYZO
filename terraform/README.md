# Terraform Infrastructure Management

This directory contains the complete Terraform configuration for managing the Fashion App infrastructure using atomic design principles.

## Architecture Overview

The infrastructure is organized into modular, composable components following atomic design principles:

### Core Principles Applied

**Single Responsibility**: Each module handles one specific infrastructure concern
- `upstash` - Redis cache management
- `vercel` - Frontend deployment
- `neon` - Database management  
- `cloudflare` - Storage management
- `monitoring` - Observability and alerting

**Composability**: Modules can be combined in different ways for different environments
- Production: Full stack with monitoring
- Development: Essential services only
- Testing: Isolated components

**Testability**: Each module can be tested independently
- Mock providers for testing
- Isolated state management
- Dependency injection patterns

**Scalability**: Easy to add new environments and services
- Environment-specific configurations
- Modular provider management
- Centralized variable management

## Directory Structure

```
terraform/
 environments/
   production/
     main.tf          # Production infrastructure
     variables.tf      # Production variables
     locals.tf         # Production configuration
 modules/
   upstash/           # Redis cache management
     main.tf
     variables.tf
     outputs.tf
   vercel/            # Frontend deployment
     main.tf
     variables.tf
     outputs.tf
   neon/              # Database management
     main.tf
     variables.tf
     outputs.tf
   cloudflare/        # Storage management
     main.tf
     variables.tf
     outputs.tf
 scripts/
   deploy.sh          # Deployment automation
   backup.sh          # State backup
 docs/
   runbooks/          # Operational procedures
   architecture/      # Design documents
```

## Quick Start

### Prerequisites

1. Install Terraform >= 1.5.0
2. Configure AWS credentials for state management
3. Set all required environment variables

### Environment Variables

```bash
# Core Infrastructure
export TF_VAR_vercel_api_token="your_vercel_token"
export TF_VAR_neon_api_key="your_neon_api_key"
export TF_VAR_upstash_email="your_upstash_email"
export TF_VAR_upstash_api_key="your_upstash_api_key"
export TF_VAR_cloudflare_api_token="your_cloudflare_token"
export TF_VAR_cloudflare_account_id="your_account_id"

# AI Services
export TF_VAR_anthropic_api_key="your_anthropic_key"
export TF_VAR_openai_api_key="your_openai_key"
export TF_VAR_pinecone_api_key="your_pinecone_key"
export TF_VAR_pinecone_index_host="your_pinecone_host"
export TF_VAR_pinecone_index_name="your_pinecone_index"

# Authentication
export TF_VAR_clerk_publishable_key="your_clerk_publishable_key"
export TF_VAR_clerk_secret_key="your_clerk_secret_key"
export TF_VAR_clerk_webhook_secret="your_clerk_webhook_secret"

# External Services
export TF_VAR_apify_token="your_apify_token"
export TF_VAR_apify_api_key="your_apify_api_key"
```

### Deployment

```bash
# Deploy production infrastructure
./scripts/deploy.sh deploy

# Plan deployment
./scripts/deploy.sh plan

# View outputs
./scripts/deploy.sh outputs

# Validate configuration
./scripts/deploy.sh validate
```

## Module Details

### Upstash Redis Module

**Purpose**: Manages Redis databases for caching and session storage

**Features**:
- Multiple Redis databases
- Encryption and backup configuration
- Performance tuning
- Connection string management

**Usage**:
```hcl
module "upstash_redis" {
  source = "../../modules/upstash"
  
  databases = {
    main_cache = {
      name = "shop"
      region = "us-east-1"
      type = "free"
    }
  }
  
  encryption = true
  backup_enabled = true
}
```

### Vercel Module

**Purpose**: Manages Vercel projects and environment variables

**Features**:
- Project creation and configuration
- Environment variable management
- Custom domain setup
- Framework-specific builds

**Usage**:
```hcl
module "vercel_infrastructure" {
  source = "../../modules/vercel"
  
  project_name = "fashion-app"
  framework = "nextjs"
  
  environment_variables = {
    DATABASE_URL = module.neon_database.connection_string
    REDIS_URL = module.upstash_redis.connection_string
  }
}
```

### Neon Database Module

**Purpose**: Manages PostgreSQL databases and branches

**Features**:
- Project and database creation
- Branch management
- Connection pooling
- Backup configuration

**Usage**:
```hcl
module "neon_database" {
  source = "../../modules/neon"
  
  project_name = "fashion-app-db"
  databases = {
    main = {
      name = "fashion_data"
      owner_name = "neondb_owner"
    }
  }
}
```

### Cloudflare R2 Module

**Purpose**: Manages object storage buckets

**Features**:
- Bucket creation and policies
- Access control
- Public/private bucket types
- URL management

**Usage**:
```hcl
module "cloudflare_storage" {
  source = "../../modules/cloudflare"
  
  account_id = var.cloudflare_account_id
  buckets = {
    uploads = {
      name = "fashion-app-uploads"
      type = "public"
    }
  }
}
```

## Environment Management

### Production Environment

Full-featured deployment with:
- Complete infrastructure stack
- Monitoring and alerting
- Backup and disaster recovery
- Security hardening

### Development Environment

Essential services only:
- Core databases and cache
- Basic monitoring
- Development-specific configurations

### Testing Environment

Isolated components for testing:
- Separate resource isolation
- Mock services support
- Rapid deployment capabilities

## State Management

### Backend Configuration

State is stored in S3 with DynamoDB locking:
```hcl
backend "s3" {
  bucket = "fashion-app-terraform-state"
  key    = "production/terraform.tfstate"
  region = "us-east-1"
  dynamodb_table = "fashion-app-terraform-locks"
  encrypt = true
}
```

### State Backup

Automatic state backups are created before each deployment:
```bash
# Manual backup
./scripts/backup.sh production

# View backup history
./scripts/backup.sh list
```

## Monitoring and Observability

### Integrated Monitoring

- Application performance metrics
- Infrastructure health monitoring
- Cost tracking and alerts
- Security event monitoring

### Alert Configuration

Critical alerts for:
- High error rates
- Database connection issues
- Storage capacity limits
- Security incidents

## Security Best Practices

### Secrets Management

- All sensitive data marked as `sensitive = true`
- Environment variables for all secrets
- No hardcoded credentials
- Regular secret rotation

### Access Control

- Principle of least privilege
- Role-based access patterns
- Audit logging enabled
- Network security groups

### Compliance

- GDPR compliance features
- Data encryption at rest and in transit
- Backup retention policies
- Disaster recovery procedures

## Troubleshooting

### Common Issues

1. **State Lock Issues**
   ```bash
   # Force unlock state
   terraform force-unlock LOCK_ID
   ```

2. **Provider Authentication**
   ```bash
   # Verify provider configuration
   terraform providers
   ```

3. **Resource Dependencies**
   ```bash
   # Check dependency graph
   terraform graph | dot -Tpng > dependency-graph.png
   ```

### Debug Mode

Enable debug logging:
```bash
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform.log
```

## Migration Guide

### From Manual Infrastructure

1. Import existing resources:
   ```bash
   terraform import vercel_project.main project_id
   ```

2. Update configuration to match existing state
3. Validate and apply changes
4. Decommission manual processes

### Environment Migration

1. Set up new environment variables
2. Initialize new environment:
   ```bash
   cp -r environments/production environments/staging
   ```
3. Update environment-specific configurations
4. Deploy new environment

## Performance Optimization

### Terraform Performance

- Use remote state locking
- Enable parallel operations
- Optimize dependency chains
- Use targeted applies

### Infrastructure Performance

- Right-size resource allocations
- Enable auto-scaling where applicable
- Optimize database configurations
- Implement caching strategies

## Cost Management

### Cost Monitoring

- Track resource costs by environment
- Set budget alerts
- Regular cost reviews
- Optimization recommendations

### Cost Optimization

- Use appropriate resource sizes
- Enable auto-shutdown for test environments
- Optimize storage tiers
- Review and remove unused resources

## Contributing

### Adding New Modules

1. Create module directory under `modules/`
2. Follow established module structure
3. Include comprehensive variables and outputs
4. Add documentation and examples
5. Update main configuration

### Code Standards

- Use consistent naming conventions
- Include resource descriptions
- Add proper tagging
- Follow security best practices
- Include comprehensive documentation

## Support

### Documentation

- Architecture diagrams in `docs/architecture/`
- Operational procedures in `docs/runbooks/`
- API documentation in `docs/api/`
- Troubleshooting guides in `docs/troubleshooting/`

### Contact

- Infrastructure team: infra@fashion-app.com
- Emergency contact: emergency@fashion-app.com
- Documentation: https://docs.fashion-app.com/infrastructure
