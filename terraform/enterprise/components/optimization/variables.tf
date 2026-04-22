# Cost Optimization Component Variables
# Focused interface for cost management and resource optimization

variable "name_prefix" {
  description = "Prefix for naming all resources"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Budget and Cost Management
variable "enable_budget_alerts" {
  description = "Enable AWS budget alerts"
  type        = bool
  default     = true
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 10000
}

variable "monitored_services" {
  description = "AWS services to monitor for budget"
  type        = list(string)
  default     = ["Amazon EC2", "Amazon RDS", "Amazon S3", "AWS Lambda", "Amazon CloudFront"]
}

variable "budget_notification_emails" {
  description = "Email addresses for budget notifications"
  type        = list(string)
  default     = []
}

variable "cost_optimization_emails" {
  description = "Email addresses for cost optimization recommendations"
  type        = list(string)
  default     = []
}

variable "cost_allocation_tags" {
  description = "Cost allocation tags for billing"
  type        = map(string)
  default     = {}
}

# Auto Scaling Configuration
variable "enable_autoscaling" {
  description = "Enable auto scaling for cost optimization"
  type        = bool
  default     = true
}

variable "asg_configs" {
  description = "Auto Scaling Group configurations"
  type = list(object({
    name = string
    subnet_ids = list(string)
    target_group_arns = list(string)
    health_check_type = string
    health_check_grace_period = number
    min_size = number
    max_size = number
    desired_capacity = number
    launch_template_id = string
    on_demand_base_capacity = number
    on_demand_percentage = number
    primary_instance_type = string
    secondary_instance_type = string
    scale_up_threshold = number
    scale_down_threshold = number
    scale_up_cooldown = number
    scale_down_cooldown = number
    business_hours_min_size = number
    business_hours_max_size = number
    business_hours_desired_capacity = number
    off_hours_min_size = number
    off_hours_max_size = number
    off_hours_desired_capacity = number
  }))
  default = []
}

# Scheduled Scaling
variable "enable_scheduled_scaling" {
  description = "Enable scheduled scaling for business hours"
  type        = bool
  default     = true
}

# Rightsizing and Optimization
variable "enable_rightsizing" {
  description = "Enable automatic rightsizing recommendations"
  type        = bool
  default     = true
}

# Spot Instance Configuration
variable "enable_spot_instances" {
  description = "Enable spot instances for cost savings"
  type        = bool
  default     = true
}

variable "spot_instance_config" {
  description = "Spot instance configuration"
  type = object({
    max_price = string
    allocation_strategy = string
    instance_types = list(string)
  })
  default = {
    max_price = ""
    allocation_strategy = "capacity-optimized"
    instance_types = []
  }
}

# Resource Tagging for Cost Tracking
variable "enable_resource_tagging" {
  description = "Enable automatic resource tagging for cost tracking"
  type        = bool
  default     = true
}

variable "cost_tracking_tags" {
  description = "Tags for cost tracking and allocation"
  type        = map(string)
  default     = {}
}

# Advanced Cost Optimization
variable "enable_advanced_optimization" {
  description = "Enable advanced cost optimization features"
  type        = bool
  default     = false
}

variable "optimization_frequency" {
  description = "Frequency of cost optimization analysis"
  type        = string
  default     = "daily"
  validation {
    condition     = contains(["hourly", "daily", "weekly"], var.optimization_frequency)
    error_message = "Optimization frequency must be hourly, daily, or weekly."
  }
}

# Cost Thresholds
variable "cost_thresholds" {
  description = "Cost thresholds for alerts and actions"
  type = object({
    warning_percentage = number
    critical_percentage = number
    daily_limit = number
    weekly_limit = number
  })
  default = {
    warning_percentage = 70
    critical_percentage = 90
    daily_limit = 500
    weekly_limit = 3500
  }
}

# Environment-specific settings
variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

# Lambda Configuration for Rightsizing
variable "lambda_config" {
  description = "Lambda function configuration for rightsizing analysis"
  type = object({
    memory_size = number
    timeout = number
    runtime = string
  })
  default = {
    memory_size = 256
    timeout = 300
    runtime = "python3.9"
  }
}
