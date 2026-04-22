# Terraform Atomic Design Patterns

This directory demonstrates how atomic design principles have been applied to Terraform infrastructure, breaking down complex configurations into smaller, focused, and composable components.

## Applied Atomic Design Principles

### Single Responsibility
Each pattern has one clear responsibility:

- **VPC Pattern**: Manages VPC and core networking only
- **Subnet Pattern**: Handles subnet creation and routing only
- **Security Pattern**: Manages security groups and rules only
- **Database Pattern**: Handles database infrastructure only
- **Cache Pattern**: Manages caching infrastructure only

### Composability & Reusability
Patterns can be combined in different ways:

```hcl
# Production Environment
module "vpc_core" {
  source = "../networking/vpc.tf"
  # VPC-specific configuration
}

module "subnet_management" {
  source = "../networking/subnets.tf"
  vpc_id = module.vpc_core.vpc_id
  # Subnet-specific configuration
}

# Development Environment (same patterns, different config)
module "dev_vpc" {
  source = "../networking/vpc.tf"
  # Development VPC configuration
}
```

### Testability & Scalability
Each pattern can be tested independently:

```hcl
# Test Environment - Use same patterns with test data
module "test_vpc" {
  source = "../networking/vpc.tf"
  name_prefix = "test"
  cidr_block = "10.1.0.0/16"
}
```

### Dependency Injection
Patterns receive dependencies through variables:

```hcl
module "subnet_management" {
  source = "../networking/subnets.tf"
  
  # Injected dependencies
  vpc_id = module.vpc_core.vpc_id
  internet_gateway_id = module.vpc_core.internet_gateway_id
  
  # Configuration
  availability_zones = var.availability_zones
}
```

## Pattern Structure

### Core Patterns

#### VPC Pattern (`networking/vpc.tf`)
- **Responsibility**: VPC creation and management
- **Inputs**: CIDR block, DNS settings, flow logs
- **Outputs**: VPC ID, CIDR block, Internet Gateway ID
- **Composable**: Used by all other networking patterns

#### Subnet Pattern (`networking/subnets.tf`)
- **Responsibility**: Subnet creation and routing
- **Inputs**: VPC ID, availability zones, CIDR blocks
- **Outputs**: Subnet IDs, route table IDs, NAT Gateway IDs
- **Composable**: Depends on VPC pattern

#### Security Pattern (`security/security-groups.tf`)
- **Responsibility**: Security group management
- **Inputs**: VPC ID, security rules
- **Outputs**: Security group IDs
- **Composable**: Used by application, database, and cache patterns

### Compositions

#### Production Networking (`compositions/simple-networking.tf`)
Demonstrates how patterns compose together:

```hcl
# Compose multiple patterns for production
module "vpc_core" { ... }
module "subnet_management" { ... }
module "security_management" { ... }

# Clean interface for outputs
output "networking_outputs" {
  value = {
    vpc = { ... }
    subnets = { ... }
    security_groups = { ... }
  }
}
```

## Benefits Achieved

### 1. Maintainability
- **Clear Separation**: Each pattern handles one concern
- **Easy Updates**: Changes to one pattern don't affect others
- **Consistent Structure**: All patterns follow the same structure

### 2. Reusability
- **Environment Agnostic**: Same patterns work for dev/staging/prod
- **Project Agnostic**: Patterns can be reused across projects
- **Configuration Driven**: Behavior controlled through variables

### 3. Testability
- **Independent Testing**: Each pattern can be tested in isolation
- **Mock Dependencies**: Easy to mock dependencies for testing
- **Validation**: Each pattern can validate its own inputs

### 4. Scalability
- **Easy Extension**: Add new patterns without affecting existing ones
- **Flexible Composition**: Combine patterns in different ways
- **Performance**: Parallel execution of independent patterns

## Usage Examples

### Basic Usage
```hcl
# Simple VPC with subnets
module "vpc" {
  source = "../networking/vpc.tf"
  name_prefix = "my-app"
  cidr_block = "10.0.0.0/16"
}

module "subnets" {
  source = "../networking/subnets.tf"
  name_prefix = "my-app"
  vpc_id = module.vpc.vpc_id
  availability_zones = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
}
```

### Advanced Usage
```hcl
# Full production setup with security
module "vpc_core" {
  source = "../networking/vpc.tf"
  name_prefix = "production"
  cidr_block = "10.0.0.0/16"
  enable_flow_logs = true
  flow_log_destination_arn = var.log_bucket_arn
}

module "subnet_management" {
  source = "../networking/subnets.tf"
  name_prefix = "production"
  vpc_id = module.vpc_core.vpc_id
  internet_gateway_id = module.vpc_core.internet_gateway_id
  availability_zones = var.availability_zones
  
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
}

module "security_management" {
  source = "../security/security-groups.tf"
  name_prefix = "production"
  vpc_id = module.vpc_core.vpc_id
  
  application_ingress_rules = var.application_rules
  database_ingress_rules = var.database_rules
}
```

## Pattern Interface Standards

### Input Standards
- **Required Variables**: Clearly documented and validated
- **Optional Variables**: Sensible defaults provided
- **Type Safety**: Strong typing for all inputs
- **Validation**: Input validation where appropriate

### Output Standards
- **Consistent Naming**: Clear, predictable output names
- **Structured Data**: Related outputs grouped together
- **Documentation**: All outputs documented
- **Type Safety**: Strong typing for all outputs

### Tagging Standards
- **Consistent Tags**: Standard tags across all patterns
- **Environment Tags**: Environment-specific tagging
- **Component Tags**: Pattern identification
- **Ownership Tags**: Project and ownership information

## Migration Guide

### From Monolithic to Patterns

1. **Identify Components**: Break down existing infrastructure into logical groups
2. **Create Patterns**: Extract each group into a focused pattern
3. **Define Interfaces**: Create clear input/output contracts
4. **Test Patterns**: Validate each pattern independently
5. **Compose Infrastructure**: Combine patterns for complete solutions

### Example Migration

**Before (Monolithic)**:
```hcl
resource "aws_vpc" "main" { ... }
resource "aws_subnet" "public" { ... }
resource "aws_subnet" "private" { ... }
resource "aws_security_group" "app" { ... }
```

**After (Patterns)**:
```hcl
module "vpc_core" {
  source = "../networking/vpc.tf"
  # VPC configuration
}

module "subnet_management" {
  source = "../networking/subnets.tf"
  vpc_id = module.vpc_core.vpc_id
  # Subnet configuration
}

module "security_management" {
  source = "../security/security-groups.tf"
  vpc_id = module.vpc_core.vpc_id
  # Security configuration
}
```

## Best Practices

### Pattern Design
- **Single Responsibility**: Each pattern does one thing well
- **Clear Interfaces**: Well-defined inputs and outputs
- **Documentation**: Comprehensive documentation for all patterns
- **Testing**: Include test examples for each pattern

### Composition
- **Dependency Management**: Clear dependency chains
- **Configuration Management**: Centralized configuration where possible
- **Error Handling**: Proper error handling and validation
- **Performance**: Consider performance implications of compositions

### Maintenance
- **Version Control**: Version your patterns
- **Backward Compatibility**: Maintain compatibility when possible
- **Deprecation**: Clear deprecation policies
- **Documentation**: Keep documentation up to date

## Future Enhancements

### Planned Patterns
- **Load Balancer Pattern**: Application load balancer management
- **Auto Scaling Pattern**: Auto scaling group management
- **Monitoring Pattern**: Monitoring and alerting setup
- **Backup Pattern**: Backup and disaster recovery

### Advanced Features
- **Pattern Registry**: Central registry of available patterns
- **Pattern Validation**: Automated validation of pattern usage
- **Pattern Testing**: Automated testing framework for patterns
- **Pattern Documentation**: Generated documentation from patterns

This atomic design approach makes Terraform infrastructure more maintainable, testable, and scalable while following clean architecture principles.
