# Enterprise Terraform Architecture

This document explains the atomic design principles applied to the Terraform infrastructure for the fashion enterprise application.

## Architecture Overview

The infrastructure is built using atomic design principles that promote:
- **Single Responsibility**: Each component has one clear purpose
- **Composability**: Components can be combined in different ways
- **Reusability**: Components can be reused across environments
- **Testability**: Each component can be tested independently
- **Dependency Injection**: Clean interfaces between components

## Directory Structure

```
enterprise/
|-- components/           # Atomic building blocks
|   |-- core/            # VPC and fundamental networking
|   |-- subnets/         # Subnet management and routing
|   |-- security/        # Security groups and access control
|
|-- compositions/         # Component assemblies
|   |-- enterprise-networking.tf  # Full enterprise setup
|   |-- simple-networking.tf      # Minimal setup
|
|-- main.tf              # Main infrastructure assembly
|-- variables.tf         # Global variables
|-- outputs.tf           # Global outputs
```

## Atomic Components

### Core Component (`components/core/`)
**Single Responsibility**: VPC and fundamental networking

**Resources**:
- VPC
- Internet Gateway
- VPC Flow Logs
- DHCP Options

**Interface**:
```hcl
variable "name_prefix" {}
variable "cidr_block" {}
variable "enable_flow_logs" {}
variable "flow_log_destination_arn" {}
variable "tags" {}
```

**Outputs**:
```hcl
output "vpc_id" {}
output "internet_gateway_id" {}
output "vpc_cidr_block" {}
```

### Subnets Component (`components/subnets/`)
**Single Responsibility**: Subnet provisioning and routing

**Resources**:
- Public Subnets
- Private Subnets
- Database Subnets
- NAT Gateways
- Route Tables
- Route Associations

**Interface**:
```hcl
variable "name_prefix" {}
variable "vpc_id" {}
variable "internet_gateway_id" {}
variable "availability_zones" {}
variable "public_subnet_cidrs" {}
variable "private_subnet_cidrs" {}
variable "database_subnet_cidrs" {}
```

**Outputs**:
```hcl
output "public_subnet_ids" {}
output "private_subnet_ids" {}
output "database_subnet_ids" {}
output "nat_gateway_ids" {}
```

### Security Component (`components/security/`)
**Single Responsibility**: Network security and access control

**Resources**:
- Application Security Groups
- Database Security Groups
- Cache Security Groups
- Load Balancer Security Groups

**Interface**:
```hcl
variable "name_prefix" {}
variable "vpc_id" {}
variable "application_ingress_rules" {}
variable "database_ingress_rules" {}
variable "cache_ingress_rules" {}
```

**Outputs**:
```hcl
output "application_security_group_id" {}
output "database_security_group_id" {}
output "cache_security_group_id" {}
```

## Component Compositions

### Enterprise Networking (`compositions/enterprise-networking.tf`)
**Purpose**: Complete enterprise-grade networking setup

**Composition**:
```hcl
# Core VPC
module "vpc_core" {
  source = "../components/core"
  # Enterprise configuration
}

# Subnets with full AZ coverage
module "subnet_management" {
  source = "../components/subnets"
  vpc_id = module.vpc_core.vpc_id
  internet_gateway_id = module.vpc_core.internet_gateway_id
  # Enterprise subnet configuration
}

# Comprehensive security
module "security_groups" {
  source = "../components/security"
  vpc_id = module.vpc_core.vpc_id
  # Enterprise security rules
}
```

### Simple Networking (`compositions/simple-networking.tf`)
**Purpose**: Minimal networking for development/testing

**Composition**:
```hcl
# Reuse core component with minimal config
module "vpc_core" {
  source = "../components/core"
  enable_flow_logs = false
}

# Reuse subnet component with basic setup
module "subnet_management" {
  source = "../components/subnets"
  database_subnet_cidrs = []
}

# Basic security only
module "security_groups" {
  source = "../components/security"
  # Minimal security rules
}
```

## Dependency Injection

Dependencies are injected through module outputs and variables:

```hcl
# Core provides VPC ID
module "vpc_core" {
  # ...
}

# Subnets consumes VPC ID
module "subnet_management" {
  vpc_id = module.vpc_core.vpc_id
  internet_gateway_id = module.vpc_core.internet_gateway_id
}

# Security consumes VPC ID
module "security_groups" {
  vpc_id = module.vpc_core.vpc_id
}
```

## Benefits of Atomic Design

### 1. **Single Responsibility**
- Each component has one clear purpose
- Easier to understand and maintain
- Reduced cognitive load

### 2. **Composability**
- Components can be combined in different ways
- Flexible infrastructure patterns
- Easy to create variations

### 3. **Reusability**
- Components reused across environments
- Consistent patterns
- Reduced duplication

### 4. **Testability**
- Each component can be tested independently
- Isolated failure domains
- Easier debugging

### 5. **Maintainability**
- Changes isolated to specific components
- Clear interfaces
- Reduced blast radius

## Usage Examples

### Development Environment
```hcl
module "dev_networking" {
  source = "./compositions/simple-networking"
  
  name_prefix = "fashion-dev"
  vpc_cidr = "10.1.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
  
  public_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
  
  tags = {
    Environment = "development"
    Project = "fashion"
  }
}
```

### Production Environment
```hcl
module "prod_networking" {
  source = "./compositions/enterprise-networking"
  
  vpc_cidr = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  flow_log_destination_arn = "arn:aws:s3:::fashion-prod-logs"
  flow_log_iam_role_arn = "arn:aws:iam::123456789012:role/flow-logs"
  
  enterprise_tags = {
    Environment = "production"
    Project = "fashion"
    Compliance = "enterprise"
  }
}
```

## Testing Strategy

### Component Testing
Each component can be tested independently:

```bash
# Test core component
cd components/core
terraform init
terraform validate
terraform plan

# Test subnet component
cd components/subnets
terraform init
terraform validate
terraform plan
```

### Composition Testing
Test different compositions:

```bash
# Test enterprise composition
cd compositions/enterprise-networking
terraform init
terraform validate
terraform plan

# Test simple composition
cd compositions/simple-networking
terraform init
terraform validate
terraform plan
```

## Extending the Architecture

### Adding New Components
1. Create new component directory under `components/`
2. Define single responsibility
3. Create clear interface (variables/outputs)
4. Test independently

### Creating New Compositions
1. Create new composition under `compositions/`
2. Combine existing components
3. Define composition-specific variables
4. Test the composition

### Example: Adding Monitoring Component
```hcl
# components/monitoring/main.tf
resource "aws_cloudwatch_log_group" "main" {
  name = "${var.name_prefix}-logs"
  # ...
}

# compositions/enterprise-networking.tf
module "monitoring" {
  source = "../components/monitoring"
  name_prefix = "fashion-enterprise"
  # ...
}
```

## Best Practices

### Component Design
- **Single Purpose**: Each component does one thing well
- **Clear Interface**: Well-defined inputs and outputs
- **No Hard Dependencies**: Avoid coupling to specific implementations
- **Idempotent**: Safe to apply multiple times

### Composition Design
- **Dependency Injection**: Pass dependencies through variables
- **Configuration Over Code**: Use variables for customization
- **Clear Documentation**: Explain the composition purpose
- **Test All Variations**: Ensure all configurations work

### Variable Management
- **Consistent Naming**: Use consistent variable names across components
- **Default Values**: Provide sensible defaults
- **Validation**: Add validation where appropriate
- **Documentation**: Document all variables

## Migration Guide

### From Monolithic to Atomic
1. **Identify Boundaries**: Find natural separation points
2. **Extract Components**: Move resources to focused components
3. **Define Interfaces**: Create clear variable/output contracts
4. **Create Compositions**: Assemble components for different use cases
5. **Test Thoroughly**: Ensure all functionality works
6. **Update Documentation**: Keep docs in sync with changes

### Example Migration
**Before** (monolithic):
```hcl
# modules/networking/main.tf - 300+ lines
resource "aws_vpc" "main" { ... }
resource "aws_subnet" "public" { ... }
resource "aws_subnet" "private" { ... }
resource "aws_security_group" "app" { ... }
```

**After** (atomic):
```hcl
# components/core/main.tf - VPC only
# components/subnets/main.tf - Subnets only
# components/security/main.tf - Security only
# compositions/enterprise-networking.tf - Assembly
```

## Conclusion

The atomic design approach provides a scalable, maintainable, and reusable infrastructure architecture. Each component has a clear responsibility, and compositions provide the flexibility to create different infrastructure patterns for different needs.

This architecture enables:
- Faster development through reuse
- Easier maintenance through isolation
- Better testing through focused components
- Flexible deployments through compositions
- Clear understanding through single responsibility

The principles applied here can be extended to any Terraform project to achieve similar benefits.
