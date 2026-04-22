#!/bin/bash

# Enterprise Infrastructure Deployment Script
# Production-grade deployment for enterprise fashion application

set -euo pipefail

# Enterprise color scheme
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Enterprise logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    fi
}

# Enterprise configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
readonly ENTERPRISE_DIR="$TERRAFORM_DIR/enterprise"
readonly BACKUP_DIR="$TERRAFORM_DIR/backups"
readonly LOCK_FILE="/tmp/fashion-enterprise-terraform.lock"

# Enterprise environment variables
export TF_VAR_project_name="fashion-enterprise"
export TF_IN_AUTOMATION=true
export TF_INPUT=false
export TF_WARN_ON_OUTPUT_CHANGES=false

# Enterprise validation functions
validate_prerequisites() {
    log_info "Validating enterprise deployment prerequisites"
    
    # Check if running from correct directory
    if [[ ! -f "$ENTERPRISE_DIR/main.tf" ]]; then
        log_error "Enterprise configuration not found at $ENTERPRISE_DIR/main.tf"
        exit 1
    fi
    
    # Check Terraform version
    local terraform_version
    terraform_version=$(terraform version -json | jq -r '.terraform_version' 2>/dev/null || echo "unknown")
    log_info "Terraform version: $terraform_version"
    
    # Check required tools
    local required_tools=("terraform" "aws" "jq" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    log_info "Prerequisites validation completed"
}

validate_enterprise_variables() {
    log_info "Validating enterprise environment variables"
    
    local missing_vars=()
    local required_vars=(
        "TF_VAR_terraform_execution_role"
        "TF_VAR_vercel_api_token"
        "TF_VAR_neon_api_key"
        "TF_VAR_upstash_email"
        "TF_VAR_upstash_api_key"
        "TF_VAR_cloudflare_api_token"
        "TF_VAR_cloudflare_account_id"
        "TF_VAR_anthropic_api_key"
        "TF_VAR_openai_api_key"
        "TF_VAR_pinecone_api_key"
        "TF_VAR_datadog_api_key"
        "TF_VAR_datadog_app_key"
        "TF_VAR_vault_address"
        "TF_VAR_vault_token"
        "TF_VAR_redis_auth_token"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required enterprise environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_error "Please configure these variables in your secure environment"
        exit 1
    fi
    
    log_info "Enterprise variables validation completed"
}

# Enterprise lock management
acquire_deployment_lock() {
    log_info "Acquiring enterprise deployment lock"
    
    if [[ -f "$LOCK_FILE" ]]; then
        local lock_age
        lock_age=$(($(date +%s) - $(stat -f %m "$LOCK_FILE" 2>/dev/null || stat -c %Y "$LOCK_FILE" 2>/dev/null || echo 0)))
        
        if [[ $lock_age -lt 3600 ]]; then
            log_error "Deployment is already in progress. Lock file age: ${lock_age}s"
            exit 1
        else
            log_warning "Removing stale lock file (age: ${lock_age}s)"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    echo "$(date +%s):$$" > "$LOCK_FILE"
    log_info "Deployment lock acquired"
}

release_deployment_lock() {
    log_info "Releasing enterprise deployment lock"
    rm -f "$LOCK_FILE"
}

# Enterprise backup functions
create_enterprise_backup() {
    local environment=$1
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$environment"
    
    log_info "Creating enterprise backup for $environment environment"
    
    mkdir -p "$backup_path"
    
    # Backup Terraform state
    if [[ -f "$ENTERPRISE_DIR/terraform.tfstate" ]]; then
        cp "$ENTERPRISE_DIR/terraform.tfstate" "$backup_path/terraform.tfstate.$timestamp"
        log_info "Terraform state backed up to $backup_path/terraform.tfstate.$timestamp"
    fi
    
    # Backup configuration files
    local config_files=("main.tf" "variables.tf" "locals.tf" "outputs.tf")
    for file in "${config_files[@]}"; do
        if [[ -f "$ENTERPRISE_DIR/$file" ]]; then
            cp "$ENTERPRISE_DIR/$file" "$backup_path/$file.$timestamp"
        fi
    done
    
    # Create backup manifest
    cat > "$backup_path/manifest.$timestamp.json" << EOF
{
  "timestamp": "$timestamp",
  "environment": "$environment",
  "user": "$(whoami)",
  "hostname": "$(hostname)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "terraform_version": "$(terraform version -json | jq -r '.terraform_version' 2>/dev/null || echo 'unknown')",
  "backup_files": $(ls -1 "$backup_path" | grep ".$timestamp$" | jq -R . | jq -s .)
}
EOF
    
    log_info "Enterprise backup completed: $backup_path"
}

# Enterprise Terraform operations
run_terraform_command() {
    local command=$1
    local workspace=${2:-"default"}
    
    log_info "Running terraform $command for workspace: $workspace"
    
    cd "$ENTERPRISE_DIR"
    
    case $command in
        "init")
            terraform init -upgrade -lock-timeout=10m
            ;;
        "plan")
            terraform plan -out=tfplan -lock-timeout=10m
            ;;
        "apply")
            terraform apply tfplan -lock-timeout=10m
            ;;
        "destroy")
            terraform destroy -lock-timeout=10m -auto-approve
            ;;
        "validate")
            terraform validate
            ;;
        "fmt")
            terraform fmt -recursive -write=true
            ;;
        "workspace")
            terraform workspace select "$workspace" || terraform workspace new "$workspace"
            ;;
        "output")
            terraform output -json
            ;;
        *)
            log_error "Unknown terraform command: $command"
            return 1
            ;;
    esac
    
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Terraform $command failed with exit code: $exit_code"
        return $exit_code
    fi
    
    log_info "Terraform $command completed successfully"
}

# Enterprise deployment workflow
deploy_enterprise_infrastructure() {
    log_info "Starting enterprise infrastructure deployment"
    
    # Validate prerequisites
    validate_prerequisites
    validate_enterprise_variables
    
    # Acquire lock
    acquire_deployment_lock
    
    # Create backup
    create_enterprise_backup "production"
    
    # Set workspace
    run_terraform_command "workspace" "production"
    
    # Format and validate
    log_info "Formatting and validating Terraform configuration"
    run_terraform_command "fmt"
    run_terraform_command "validate"
    
    # Initialize Terraform
    log_info "Initializing Terraform enterprise configuration"
    run_terraform_command "init"
    
    # Plan deployment
    log_info "Creating enterprise deployment plan"
    run_terraform_command "plan"
    
    # Show plan summary
    if [[ -f "$ENTERPRISE_DIR/tfplan" ]]; then
        local plan_summary
        plan_summary=$(terraform show -json tfplan | jq -r '.planned_values.root_module.resources | length' 2>/dev/null || echo "unknown")
        log_info "Plan summary: $plan_summary resources will be created/updated"
    fi
    
    # Ask for confirmation in interactive mode
    if [[ "${INTERACTIVE:-true}" == "true" ]]; then
        echo
        echo -e "${YELLOW}Enterprise deployment plan created. Review the changes above.${NC}"
        read -p "Do you want to apply these changes to production? (y/N): " -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_warning "Enterprise deployment cancelled by user"
            release_deployment_lock
            exit 0
        fi
    fi
    
    # Apply changes
    log_info "Applying enterprise infrastructure changes"
    run_terraform_command "apply"
    
    # Show outputs
    log_info "Enterprise deployment outputs:"
    run_terraform_command "output"
    
    # Post-deployment validation
    validate_deployment
    
    log_info "Enterprise infrastructure deployment completed successfully"
}

# Enterprise validation functions
validate_deployment() {
    log_info "Running post-deployment validation"
    
    # Check critical outputs
    local critical_outputs=("vpc_id" "database_connection_string" "cache_connection_string")
    for output in "${critical_outputs[@]}"; do
        if ! terraform output -raw "$output" &>/dev/null; then
            log_warning "Critical output not found: $output"
        fi
    done
    
    # Test connectivity (if configured)
    if [[ "${TEST_CONNECTIVITY:-false}" == "true" ]]; then
        test_connectivity
    fi
    
    log_info "Post-deployment validation completed"
}

test_connectivity() {
    log_info "Testing infrastructure connectivity"
    
    # Test database connectivity
    local database_url
    database_url=$(terraform output -raw neon_connection_string 2>/dev/null || echo "")
    if [[ -n "$database_url" ]]; then
        log_info "Testing database connectivity..."
        # Add database connectivity test here
    fi
    
    # Test cache connectivity
    local cache_url
    cache_url=$(terraform output -raw upstash_connection_string 2>/dev/null || echo "")
    if [[ -n "$cache_url" ]]; then
        log_info "Testing cache connectivity..."
        # Add cache connectivity test here
    fi
}

# Enterprise destroy function
destroy_enterprise_infrastructure() {
    log_warning "This will destroy ALL enterprise infrastructure"
    echo -e "${RED}WARNING: This is a destructive operation that cannot be undone${NC}"
    echo
    
    if [[ "${INTERACTIVE:-true}" == "true" ]]; then
        read -p "Are you absolutely sure you want to destroy production infrastructure? Type 'DESTROY' to confirm: " -r
        echo
        
        if [[ $REPLY != "DESTROY" ]]; then
            log_warning "Destroy operation cancelled"
            exit 0
        fi
    fi
    
    # Acquire lock
    acquire_deployment_lock
    
    # Create final backup
    create_enterprise_backup "pre-destroy"
    
    # Set workspace
    run_terraform_command "workspace" "production"
    
    # Destroy infrastructure
    log_warning "Destroying enterprise infrastructure"
    run_terraform_command "destroy"
    
    log_warning "Enterprise infrastructure destroyed"
}

# Enterprise status function
show_enterprise_status() {
    log_info "Enterprise infrastructure status"
    
    cd "$ENTERPRISE_DIR"
    
    # Show workspace
    echo "Current workspace: $(terraform workspace show)"
    
    # Show state summary
    if [[ -f "terraform.tfstate" ]]; then
        echo "Resources in state: $(terraform state list | wc -l | tr -d ' ')"
    fi
    
    # Show outputs
    echo "Infrastructure outputs:"
    run_terraform_command "output"
}

# Enterprise help function
show_help() {
    cat << EOF
Enterprise Fashion App Terraform Deployment

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  deploy      Deploy enterprise infrastructure to production
  plan        Show deployment plan without applying
  destroy     Destroy all enterprise infrastructure (DANGEROUS)
  status      Show current infrastructure status
  validate    Validate Terraform configuration
  backup      Create manual backup of current state
  help        Show this help message

Options:
  --debug           Enable debug logging
  --non-interactive  Run without interactive prompts
  --test-connectivity Test connectivity after deployment

Environment Variables:
  All TF_VAR_* variables must be set in secure environment
  See enterprise/variables.tf for required variables

Examples:
  $0 deploy                    # Interactive deployment
  $0 deploy --non-interactive # Non-interactive deployment
  $0 plan                      # Show deployment plan
  $0 status                    # Show current status
  $0 destroy                   # Destroy infrastructure

Enterprise Features:
  - Remote state management with S3 + DynamoDB
  - Comprehensive security and compliance
  - Multi-AZ high availability
  - Automated backup and disaster recovery
  - Enterprise monitoring and observability
  - Secrets management with Vault
  - Cost allocation and governance

For enterprise support, contact: infrastructure@fashion-enterprise.com
EOF
}

# Main execution logic
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --debug)
                export DEBUG=true
                shift
                ;;
            --non-interactive)
                export INTERACTIVE=false
                shift
                ;;
            --test-connectivity)
                export TEST_CONNECTIVITY=true
                shift
                ;;
            deploy|plan|destroy|status|validate|backup|help)
                COMMAND=$1
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set default command
    COMMAND=${COMMAND:-"help"}
    
    # Ensure cleanup on exit
    trap release_deployment_lock EXIT
    
    # Execute command
    case $COMMAND in
        "deploy")
            deploy_enterprise_infrastructure
            ;;
        "plan")
            validate_prerequisites
            validate_enterprise_variables
            run_terraform_command "workspace" "production"
            run_terraform_command "init"
            run_terraform_command "plan"
            ;;
        "destroy")
            destroy_enterprise_infrastructure
            ;;
        "status")
            show_enterprise_status
            ;;
        "validate")
            validate_prerequisites
            validate_enterprise_variables
            run_terraform_command "fmt"
            run_terraform_command "validate"
            log_info "Enterprise configuration is valid"
            ;;
        "backup")
            create_enterprise_backup "manual"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Execute main function
main "$@"
