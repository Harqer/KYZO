# Production Infrastructure Composition
# Enterprise-grade infrastructure with atomic design principles
# Combines all components with proper dependency injection

# Variables for production composition
variable "name_prefix" {
  description = "Prefix for naming all resources"
  type        = string
  default     = "fashion-enterprise"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "production_tags" {
  description = "Production environment tags"
  type        = map(string)
  default = {
    Environment = "production"
    Project = "fashion-enterprise"
    Owner = "infrastructure-team"
    CostCenter = "engineering"
    Compliance = "enterprise"
    DataClassification = "confidential"
    SecurityLevel = "high"
  }
}

# Core VPC Infrastructure (Atomic Component)
module "vpc_core" {
  source = "../components/core"
  
  name_prefix = var.name_prefix
  cidr_block = var.vpc_cidr
  
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  enable_flow_logs = true
  flow_log_destination_arn = "arn:aws:s3:::fashion-enterprise-logs-prod"
  flow_log_iam_role_arn   = "arn:aws:iam::123456789012:role/flow-logs-role"
  
  tags = var.production_tags
}

# Subnet Management (Atomic Component)
module "subnet_management" {
  source = "../components/subnets"
  
  name_prefix = var.name_prefix
  vpc_id = module.vpc_core.vpc_id
  internet_gateway_id = module.vpc_core.internet_gateway_id
  
  availability_zones = var.availability_zones
  
  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 1),
    cidrsubnet(var.vpc_cidr, 8, 2),
    cidrsubnet(var.vpc_cidr, 8, 3)
  ]
  
  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 11),
    cidrsubnet(var.vpc_cidr, 8, 12),
    cidrsubnet(var.vpc_cidr, 8, 13)
  ]
  
  database_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 21),
    cidrsubnet(var.vpc_cidr, 8, 22),
    cidrsubnet(var.vpc_cidr, 8, 23)
  ]
  
  tags = var.production_tags
}

# Security Groups (Atomic Component)
module "security_groups" {
  source = "../components/security"
  
  name_prefix = var.name_prefix
  vpc_id = module.vpc_core.vpc_id
  
  # Enterprise security rules
  application_ingress_rules = [
    {
      description = "HTTPS from internet"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    },
    {
      description = "HTTP from internet (redirect)"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    }
  ]
  
  application_egress_rules = [
    {
      description = "All outbound traffic"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
      security_groups = []
      self        = false
    }
  ]
  
  database_ingress_rules = [
    {
      description = "PostgreSQL from application"
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = []
      security_groups = [module.security_groups.application_security_group_id]
      self        = false
    }
  ]
  
  tags = var.production_tags
}

# Cost Optimization (Atomic Component)
module "cost_optimizer" {
  source = "../components/optimization"
  
  name_prefix = var.name_prefix
  tags = var.production_tags
  
  enable_budget_alerts = true
  monthly_budget_limit = 50000
  monitored_services = ["Amazon EC2", "Amazon RDS", "Amazon S3", "AWS Lambda", "Amazon CloudFront"]
  budget_notification_emails = ["alerts@fashion-enterprise.com"]
  cost_optimization_emails = ["finance@fashion-enterprise.com"]
  
  enable_autoscaling = true
  asg_configs = [
    {
      name = "web-servers"
      subnet_ids = module.subnet_management.private_subnet_ids
      target_group_arns = []
      health_check_type = "EC2"
      health_check_grace_period = 300
      min_size = 3
      max_size = 20
      desired_capacity = 5
      launch_template_id = "lt-web-servers"
      on_demand_base_capacity = 2
      on_demand_percentage = 50
      primary_instance_type = "t3.medium"
      secondary_instance_type = "t3a.medium"
      scale_up_threshold = 70
      scale_down_threshold = 30
      scale_up_cooldown = 300
      scale_down_cooldown = 300
      business_hours_min_size = 5
      business_hours_max_size = 15
      business_hours_desired_capacity = 8
      off_hours_min_size = 2
      off_hours_max_size = 8
      off_hours_desired_capacity = 3
    }
  ]
  
  enable_scheduled_scaling = true
  enable_rightsizing = true
  enable_spot_instances = true
  
  cost_allocation_tags = var.production_tags
}

# Enterprise Monitoring (Atomic Component)
module "monitoring" {
  source = "../components/monitoring"
  
  name_prefix = var.name_prefix
  tags = var.production_tags
  
  enable_dashboard = true
  enable_alerts = true
  alert_emails = ["alerts@fashion-enterprise.com", "devops@fashion-enterprise.com"]
  
  enable_xray = true
  enable_application_insights = true
  enable_anomaly_detection = true
  enable_metric_streams = true
  
  log_groups = {
    application = { retention_days = 30 }
    security = { retention_days = 90 }
    access = { retention_days = 365 }
    performance = { retention_days = 14 }
  }
  
  metric_alarms = {
    high_cpu = {
      comparison_operator = "GreaterThanThreshold"
      evaluation_periods  = 2
      metric_name         = "CPUUtilization"
      namespace           = "AWS/EC2"
      period              = 300
      statistic           = "Average"
      threshold           = 80
      description         = "High CPU utilization detected"
      treat_missing_data  = "missing"
      dimensions          = {}
      alarm_actions       = [module.cost_optimizer.sns_topic_arn]
      ok_actions          = [module.cost_optimizer.sns_topic_arn]
    }
    
    high_memory = {
      comparison_operator = "GreaterThanThreshold"
      evaluation_periods  = 2
      metric_name         = "MemoryUtilization"
      namespace           = "CWAgent"
      period              = 300
      statistic           = "Average"
      threshold           = 85
      description         = "High memory utilization detected"
      treat_missing_data  = "missing"
      dimensions          = {}
      alarm_actions       = [module.cost_optimizer.sns_topic_arn]
      ok_actions          = [module.cost_optimizer.sns_topic_arn]
    }
  }
  
  enable_security_monitoring = true
  enable_performance_monitoring = true
}

# Production Outputs
output "vpc_id" {
  description = "Production VPC ID"
  value       = module.vpc_core.vpc_id
}

output "public_subnet_ids" {
  description = "Production public subnet IDs"
  value       = module.subnet_management.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Production private subnet IDs"
  value       = module.subnet_management.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Production database subnet IDs"
  value       = module.subnet_management.database_subnet_ids
}

output "application_security_group_id" {
  description = "Application security group ID"
  value       = module.security_groups.application_security_group_id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = module.security_groups.database_security_group_id
}

output "budget_arn" {
  description = "Production budget ARN"
  value       = module.cost_optimizer.budget_arn
}

output "autoscaling_group_names" {
  description = "Auto scaling group names"
  value       = module.cost_optimizer.autoscaling_group_names
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.enable_dashboard ? "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${var.name_prefix}-monitoring-dashboard" : ""
}

output "cost_optimization_recommendations" {
  description = "Cost optimization enabled features"
  value = {
    budget_alerts = module.cost_optimizer.budget_arn != null
    autoscaling = length(module.cost_optimizer.autoscaling_group_names) > 0
    scheduled_scaling = module.cost_optimizer.sns_topic_arn != null
    rightsizing = module.cost_optimizer.lambda_function_arn != null
  }
}

output "monitoring_features" {
  description = "Monitoring enabled features"
  value = {
    dashboard = module.monitoring.enable_dashboard
    alerts = module.monitoring.enable_alerts
    xray = module.monitoring.enable_xray
    application_insights = module.monitoring.enable_application_insights
    anomaly_detection = module.monitoring.enable_anomaly_detection
    metric_streams = module.monitoring.enable_metric_streams
  }
}
