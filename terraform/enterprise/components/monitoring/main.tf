# Enterprise Monitoring Component
# Single responsibility: Application and infrastructure monitoring
# Follows atomic design principles with focused functionality

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  for_each = var.log_groups
  
  name              = "/aws/${var.name_prefix}/${each.key}"
  retention_in_days = each.value.retention_days
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${each.key}-logs"
      Type = "LogGroup"
      Service = each.key
    }
  )
}

# CloudWatch Metric Alarms
resource "aws_cloudwatch_metric_alarm" "application" {
  for_each = var.metric_alarms
  
  alarm_name                = "${var.name_prefix}-${each.key}"
  comparison_operator       = each.value.comparison_operator
  evaluation_periods        = each.value.evaluation_periods
  metric_name               = each.value.metric_name
  namespace                 = each.value.namespace
  period                    = each.value.period
  statistic                 = each.value.statistic
  threshold                 = each.value.threshold
  alarm_description         = each.value.description
  treat_missing_data        = each.value.treat_missing_data
  
  dynamic "dimensions" {
    for_each = each.value.dimensions
    content {
      name  = dimensions.key
      value = dimensions.value
    }
  }
  
  alarm_actions = length(each.value.alarm_actions) > 0 ? each.value.alarm_actions : []
  ok_actions    = length(each.value.ok_actions) > 0 ? each.value.ok_actions : []
  
  tags = var.tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  count = var.enable_dashboard ? 1 : 0
  
  dashboard_name = "${var.name_prefix}-monitoring-dashboard"
  
  dashboard_body = jsonencode({
    widgets = var.dashboard_widgets
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  count = var.enable_alerts ? 1 : 0
  
  name = "${var.name_prefix}-monitoring-alerts"
  
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count = var.enable_alerts ? length(var.alert_emails) : 0
  
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_emails[count.index]
}

# X-Ray Tracing
resource "aws_xray_sampling_rule" "application" {
  for_each = var.enable_xray ? var.xray_sampling_rules : {}
  
  rule_name      = "${var.name_prefix}-${each.key}"
  version        = 1
  priority       = each.value.priority
  fixed_rate     = each.value.fixed_rate
  reservoir_size = each.value.reservoir_size
  service_name   = each.value.service_name
  host           = each.value.host
  http_method    = each.value.http_method
  url_path       = each.value.url_path
  
  tags = var.tags
}

# Application Insights
resource "aws_applicationinsights_application" "main" {
  count = var.enable_application_insights ? 1 : 0
  
  resource_group_name = "${var.name_prefix}-resource-group"
  auto_config_enabled = true
  
  log_patterns {
    pattern_name = "error-pattern"
    pattern      = "[ERROR]"
    rank         = 1
  }
  
  tags = var.tags
}

# CloudWatch Synthetics Canaries
resource "aws_cloudwatch_synthetics_canary" "application" {
  for_each = var.synthetics_canaries
  
  name                  = "${var.name_prefix}-${each.key}-canary"
  artifact_s3_location  = "s3://${var.synthetics_s3_bucket}/canary-artifacts/"
  execution_role_arn    = each.value.execution_role_arn
  handler              = "canary.handler"
  runtime_version      = each.value.runtime_version
  schedule_expression  = each.value.schedule_expression
  
  s3_bucket {
    bucket_name = var.synthetics_s3_bucket
  }
  
  run_config {
    timeout_in_seconds = each.value.timeout_in_seconds
    memory_in_mb       = each.value.memory_in_mb
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${each.key}-canary"
      Type = "SyntheticsCanary"
    }
  )
}

# CloudWatch Logs Insights
resource "aws_cloudwatch_query_definition" "insights" {
  for_each = var.log_insights_queries
  
  name = "${var.name_prefix}-${each.key}-query"
  
  log_group_names = each.value.log_group_names
  
  query_string = each.value.query_string
  
  tags = var.tags
}

# CloudWatch Contributor Insights Rules
resource "aws_cloudwatch_contributor_insight_rule" "application" {
  for_each = var.contributor_insights_rules
  
  name        = "${var.name_prefix}-${each.key}-rule"
  rule_body   = jsonencode(each.value.rule_body)
  
  tags = var.tags
}

# CloudWatch Composite Alarms
resource "aws_cloudwatch_composite_alarm" "application" {
  for_each = var.composite_alarms
  
  alarm_name          = "${var.name_prefix}-${each.key}-composite"
  alarm_description   = each.value.description
  
  alarm_rule = each.value.alarm_rule
  
  alarm_actions = length(each.value.alarm_actions) > 0 ? each.value.alarm_actions : []
  ok_actions    = length(each.value.ok_actions) > 0 ? each.value.ok_actions : []
  
  tags = var.tags
}

# CloudWatch Anomaly Detection
resource "aws_cloudwatch_anomaly_detector" "application" {
  for_each = var.enable_anomaly_detection ? var.anomaly_detectors : {}
  
  metric_name = each.value.metric_name
  namespace   = each.value.namespace
  stat        = each.value.stat
  
  dynamic "dimensions" {
    for_each = each.value.dimensions
    content {
      name  = dimensions.key
      value = dimensions.value
    }
  }
  
  configuration {
    excluded_time_ranges = each.value.excluded_time_ranges
  }
}

# CloudWatch Metric Streams
resource "aws_cloudwatch_metric_stream" "application" {
  count = var.enable_metric_streams ? 1 : 0
  
  name          = "${var.name_prefix}-metric-stream"
  firehose_arn  = var.metric_stream_firehose_arn
  role_arn      = var.metric_stream_role_arn
  output_format = "json"
  
  include_filter {
    namespace = "AWS/EC2"
  }
  
  include_filter {
    namespace = "AWS/ApplicationELB"
  }
  
  include_filter {
    namespace = "AWS/RDS"
  }
  
  include_filter {
    namespace = "AWS/Lambda"
  }
  
  tags = var.tags
}

# CloudWatch Logs Metric Filters
resource "aws_cloudwatch_log_metric_filter" "application" {
  for_each = var.log_metric_filters
  
  name           = "${var.name_prefix}-${each.key}-filter"
  pattern        = each.value.pattern
  log_group_name = aws_cloudwatch_log_group.application[each.value.log_group_key].name
  
  metric_transformation {
    name      = each.value.metric_name
    namespace = each.value.namespace
    value     = each.value.value
  }
}

# CloudWatch EventBridge Rules for Monitoring
resource "aws_cloudwatch_event_rule" "monitoring" {
  for_each = var.monitoring_event_rules
  
  name                = "${var.name_prefix}-${each.key}-rule"
  description         = each.value.description
  schedule_expression = each.value.schedule_expression
  
  tags = var.tags
}

resource "aws_cloudwatch_event_target" "monitoring" {
  for_each = var.monitoring_event_rules
  
  rule      = aws_cloudwatch_event_rule.monitoring[each.key].name
  target_id = "${each.key}-target"
  arn       = each.value.target_arn
  
  dynamic "input_transformer" {
    for_each = each.value.input_transformer != null ? [each.value.input_transformer] : []
    content {
      input_paths    = input_transformer.value.input_paths
      input_template = input_transformer.value.input_template
    }
  }
}

# CloudWatch Logs Subscription Filters
resource "aws_cloudwatch_log_subscription_filter" "application" {
  for_each = var.log_subscription_filters
  
  name            = "${var.name_prefix}-${each.key}-subscription"
  log_group_name  = aws_cloudwatch_log_group.application[each.value.log_group_key].name
  filter_pattern  = each.value.filter_pattern
  destination_arn = each.value.destination_arn
  
  dynamic "distribution" {
    for_each = each.value.distribution != null ? [each.value.distribution] : []
    content {
      log_group_name = distribution.value.log_group_name
    }
  }
}
