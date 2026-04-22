# Enterprise Monitoring Component Variables
# Focused interface for application and infrastructure monitoring

variable "name_prefix" {
  description = "Prefix for naming all resources"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Log Groups Configuration
variable "log_groups" {
  description = "CloudWatch log groups configuration"
  type = map(object({
    retention_days = number
  }))
  default = {
    application = {
      retention_days = 30
    }
    security = {
      retention_days = 90
    }
    access = {
      retention_days = 365
    }
  }
}

# Metric Alarms Configuration
variable "metric_alarms" {
  description = "CloudWatch metric alarms configuration"
  type = map(object({
    comparison_operator = string
    evaluation_periods  = number
    metric_name         = string
    namespace           = string
    period              = number
    statistic           = string
    threshold           = number
    description         = string
    treat_missing_data  = string
    dimensions          = map(string)
    alarm_actions       = list(string)
    ok_actions          = list(string)
  }))
  default = {}
}

# Dashboard Configuration
variable "enable_dashboard" {
  description = "Enable CloudWatch dashboard"
  type        = bool
  default     = true
}

variable "dashboard_widgets" {
  description = "CloudWatch dashboard widgets configuration"
  type = list(any)
  default = []
}

# Alerts Configuration
variable "enable_alerts" {
  description = "Enable monitoring alerts"
  type        = bool
  default     = true
}

variable "alert_emails" {
  description = "Email addresses for monitoring alerts"
  type        = list(string)
  default     = []
}

# X-Ray Configuration
variable "enable_xray" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = true
}

variable "xray_sampling_rules" {
  description = "X-Ray sampling rules configuration"
  type = map(object({
    priority         = number
    fixed_rate       = number
    reservoir_size   = number
    service_name     = string
    host             = string
    http_method      = string
    url_path         = string
  }))
  default = {}
}

# Application Insights Configuration
variable "enable_application_insights" {
  description = "Enable AWS Application Insights"
  type        = bool
  default     = false
}

# Synthetics Configuration
variable "synthetics_canaries" {
  description = "CloudWatch Synthetics canaries configuration"
  type = map(object({
    execution_role_arn   = string
    runtime_version      = string
    schedule_expression  = string
    timeout_in_seconds   = number
    memory_in_mb         = number
  }))
  default = {}
}

variable "synthetics_s3_bucket" {
  description = "S3 bucket for Synthetics artifacts"
  type        = string
  default     = ""
}

# Log Insights Configuration
variable "log_insights_queries" {
  description = "CloudWatch Logs Insights queries"
  type = map(object({
    log_group_names = list(string)
    query_string   = string
  }))
  default = {}
}

# Contributor Insights Configuration
variable "contributor_insights_rules" {
  description = "CloudWatch Contributor Insights rules"
  type = map(object({
    rule_body = object({
      source = string
      keys    = list(string)
      aggregate = string
    })
  }))
  default = {}
}

# Composite Alarms Configuration
variable "composite_alarms" {
  description = "CloudWatch composite alarms"
  type = map(object({
    description  = string
    alarm_rule   = string
    alarm_actions = list(string)
    ok_actions    = list(string)
  }))
  default = {}
}

# Anomaly Detection Configuration
variable "enable_anomaly_detection" {
  description = "Enable CloudWatch anomaly detection"
  type        = bool
  default     = false
}

variable "anomaly_detectors" {
  description = "CloudWatch anomaly detectors configuration"
  type = map(object({
    metric_name = string
    namespace   = string
    stat        = string
    dimensions  = map(string)
    excluded_time_ranges = list(object({
      start_time = string
      end_time   = string
    }))
  }))
  default = {}
}

# Metric Streams Configuration
variable "enable_metric_streams" {
  description = "Enable CloudWatch metric streams"
  type        = bool
  default     = false
}

variable "metric_stream_firehose_arn" {
  description = "Kinesis Firehose ARN for metric streams"
  type        = string
  default     = ""
}

variable "metric_stream_role_arn" {
  description = "IAM role ARN for metric streams"
  type        = string
  default     = ""
}

# Log Metric Filters Configuration
variable "log_metric_filters" {
  description = "CloudWatch log metric filters"
  type = map(object({
    log_group_key = string
    pattern      = string
    metric_name  = string
    namespace    = string
    value        = string
  }))
  default = {}
}

# EventBridge Monitoring Rules
variable "monitoring_event_rules" {
  description = "CloudWatch EventBridge monitoring rules"
  type = map(object({
    description         = string
    schedule_expression = string
    target_arn          = string
    input_transformer = object({
      input_paths    = map(string)
      input_template = string
    })
  }))
  default = {}
}

# Log Subscription Filters Configuration
variable "log_subscription_filters" {
  description = "CloudWatch log subscription filters"
  type = map(object({
    log_group_key     = string
    filter_pattern    = string
    destination_arn   = string
    distribution = object({
      log_group_name = string
    })
  }))
  default = {}
}

# Advanced Monitoring Features
variable "enable_advanced_monitoring" {
  description = "Enable advanced monitoring features"
  type        = bool
  default     = false
}

variable "monitoring_retention_days" {
  description = "Default retention period for monitoring data"
  type        = number
  default     = 30
}

variable "enable_cross_region_monitoring" {
  description = "Enable cross-region monitoring"
  type        = bool
  default     = false
}

variable "monitoring_regions" {
  description = "Additional regions for cross-region monitoring"
  type        = list(string)
  default     = []
}

# Performance Monitoring
variable "enable_performance_monitoring" {
  description = "Enable detailed performance monitoring"
  type        = bool
  default     = true
}

variable "performance_metrics" {
  description = "Performance metrics to monitor"
  type = list(object({
    name        = string
    namespace   = string
    statistic   = string
    period      = number
    threshold   = number
  }))
  default = []
}

# Security Monitoring
variable "enable_security_monitoring" {
  description = "Enable security monitoring"
  type        = bool
  default     = true
}

variable "security_events" {
  description = "Security events to monitor"
  type = list(string)
  default = [
    "UnauthorizedAPIAttempts",
    "RootAccountUsage",
    "IAMPolicyChanges",
    "CloudTrailChanges"
  ]
}
