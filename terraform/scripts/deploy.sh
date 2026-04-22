#!/bin/bash

# Production Deployment Script
# Applies Terraform infrastructure for production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "environments/production/main.tf" ]; then
    print_error "Please run this script from the terraform directory"
    exit 1
fi

# Check if required environment variables are set
check_env_vars() {
    local missing_vars=()
    
    # Required variables
    local required_vars=(
        "TF_VAR_vercel_api_token"
        "TF_VAR_neon_api_key"
        "TF_VAR_upstash_email"
        "TF_VAR_upstash_api_key"
        "TF_VAR_cloudflare_api_token"
        "TF_VAR_cloudflare_account_id"
        "TF_VAR_anthropic_api_key"
        "TF_VAR_openai_api_key"
        "TF_VAR_pinecone_api_key"
        "TF_VAR_pinecone_index_host"
        "TF_VAR_pinecone_index_name"
        "TF_VAR_clerk_publishable_key"
        "TF_VAR_clerk_secret_key"
        "TF_VAR_clerk_webhook_secret"
        "TF_VAR_apify_token"
        "TF_VAR_apify_api_key"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_error "Please set these variables and try again"
        exit 1
    fi
}

# Function to run Terraform commands
run_terraform() {
    local command=$1
    local environment=$2
    
    print_status "Running terraform $command for $environment environment"
    
    cd "environments/$environment"
    
    case $command in
        "init")
            terraform init -upgrade
            ;;
        "plan")
            terraform plan -out=tfplan
            ;;
        "apply")
            terraform apply tfplan
            ;;
        "destroy")
            terraform destroy
            ;;
        "validate")
            terraform validate
            ;;
        "fmt")
            terraform fmt -recursive
            ;;
        *)
            print_error "Unknown command: $command"
            exit 1
            ;;
    esac
    
    cd ../..
}

# Function to backup current state
backup_state() {
    local environment=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="backups/$environment"
    
    mkdir -p "$backup_dir"
    
    if [ -f "environments/$environment/terraform.tfstate" ]; then
        cp "environments/$environment/terraform.tfstate" "$backup_dir/terraform.tfstate.$timestamp"
        print_status "State backed up to $backup_dir/terraform.tfstate.$timestamp"
    fi
}

# Function to show outputs
show_outputs() {
    local environment=$1
    
    print_status "Infrastructure outputs for $environment:"
    cd "environments/$environment"
    terraform output
    cd ../..
}

# Main deployment function
deploy_production() {
    print_status "Starting production deployment"
    
    # Check environment variables
    check_env_vars
    
    # Backup current state
    backup_state "production"
    
    # Format and validate
    print_status "Formatting and validating Terraform files"
    run_terraform "fmt" "production"
    run_terraform "validate" "production"
    
    # Initialize Terraform
    print_status "Initializing Terraform"
    run_terraform "init" "production"
    
    # Plan deployment
    print_status "Planning deployment"
    run_terraform "plan" "production"
    
    # Ask for confirmation
    echo
    read -p "Do you want to apply these changes? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Apply changes
        print_status "Applying infrastructure changes"
        run_terraform "apply" "production"
        
        # Show outputs
        show_outputs "production"
        
        print_status "Production deployment completed successfully!"
    else
        print_warning "Deployment cancelled"
        exit 0
    fi
}

# Function to destroy infrastructure
destroy_production() {
    print_warning "This will destroy all production infrastructure"
    echo
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup_state "production"
        run_terraform "destroy" "production"
        print_status "Production infrastructure destroyed"
    else
        print_warning "Destroy operation cancelled"
        exit 0
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  deploy    Deploy production infrastructure"
    echo "  plan      Show deployment plan"
    echo "  destroy   Destroy production infrastructure"
    echo "  outputs   Show infrastructure outputs"
    echo "  validate  Validate Terraform configuration"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 plan"
    echo "  $0 outputs"
}

# Main script logic
case "${1:-help}" in
    "deploy")
        deploy_production
        ;;
    "plan")
        check_env_vars
        run_terraform "init" "production"
        run_terraform "plan" "production"
        ;;
    "destroy")
        destroy_production
        ;;
    "outputs")
        show_outputs "production"
        ;;
    "validate")
        run_terraform "fmt" "production"
        run_terraform "validate" "production"
        print_status "Terraform configuration is valid"
        ;;
    "help"|*)
        show_help
        ;;
esac
