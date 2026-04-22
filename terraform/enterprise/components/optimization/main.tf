# Cost Optimization Component
# Single responsibility: AWS cost optimization and resource management
# Follows atomic design principles with focused functionality

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Cost and Usage Monitoring
resource "aws_ce_cost_allocation_tag" "optimization" {
  for_each = var.cost_allocation_tags
  
  tag_key = each.key
  status  = "Active"
}

# Budget Alerts
resource "aws_budgets_budget" "monthly" {
  count = var.enable_budget_alerts ? 1 : 0
  
  name              = "fashion-enterprise-monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.monthly_budget_limit
  limit_unit        = "USD"
  time_period_start = "2024-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = var.monitored_services
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                   = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                   = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }
}

# Auto Scaling Groups for Cost Optimization
resource "aws_autoscaling_group" "optimized" {
  count = var.enable_autoscaling ? length(var.asg_configs) : 0
  
  name = "${var.name_prefix}-${var.asg_configs[count.index].name}"
  
  vpc_zone_identifier = var.asg_configs[count.index].subnet_ids
  target_group_arns   = var.asg_configs[count.index].target_group_arns
  health_check_type   = var.asg_configs[count.index].health_check_type
  health_check_grace_period = var.asg_configs[count.index].health_check_grace_period
  
  min_size         = var.asg_configs[count.index].min_size
  max_size         = var.asg_configs[count.index].max_size
  desired_capacity = var.asg_configs[count.index].desired_capacity
  
  launch_template {
    id      = var.asg_configs[count.index].launch_template_id
    version = "$Latest"
  }
  
  # Mixed instances policy for cost optimization
  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = var.asg_configs[count.index].on_demand_base_capacity
      on_demand_percentage_above_base_capacity = var.asg_configs[count.index].on_demand_percentage
      spot_allocation_strategy                 = "capacity-optimized"
      
      spot_instance_pools = [
        {
          instance_type = var.asg_configs[count.index].primary_instance_type
        },
        {
          instance_type = var.asg_configs[count.index].secondary_instance_type
        }
      ]
    }
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.asg_configs[count.index].name}"
      Type = "AutoScalingGroup"
      CostOptimized = "true"
    }
  )
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  count = var.enable_autoscaling ? length(var.asg_configs) : 0
  
  name                   = "${var.name_prefix}-${var.asg_configs[count.index].name}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = var.asg_configs[count.index].scale_up_cooldown
  autoscaling_group_name = aws_autoscaling_group.optimized[count.index].name
}

resource "aws_autoscaling_policy" "scale_down" {
  count = var.enable_autoscaling ? length(var.asg_configs) : 0
  
  name                   = "${var.name_prefix}-${var.asg_configs[count.index].name}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = var.asg_configs[count.index].scale_down_cooldown
  autoscaling_group_name = aws_autoscaling_group.optimized[count.index].name
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "scale_up" {
  count = var.enable_autoscaling ? length(var.asg_configs) : 0
  
  alarm_name          = "${var.name_prefix}-${var.asg_configs[count.index].name}-scale-up"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = var.asg_configs[count.index].scale_up_threshold
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.optimized[count.index].name
  }
  
  alarm_actions = [aws_autoscaling_policy.scale_up[count.index].arn]
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "scale_down" {
  count = var.enable_autoscaling ? length(var.asg_configs) : 0
  
  alarm_name          = "${var.name_prefix}-${var.asg_configs[count.index].name}-scale-down"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = var.asg_configs[count.index].scale_down_threshold
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.optimized[count.index].name
  }
  
  alarm_actions = [aws_autoscaling_policy.scale_down[count.index].arn]
  
  tags = var.tags
}

# Scheduled Scaling for Cost Optimization
resource "aws_autoscaling_schedule" "business_hours" {
  count = var.enable_scheduled_scaling ? length(var.asg_configs) : 0
  
  scheduled_action_name = "${var.name_prefix}-${var.asg_configs[count.index].name}-business-hours"
  autoscaling_group_name = aws_autoscaling_group.optimized[count.index].name
  
  min_size         = var.asg_configs[count.index].business_hours_min_size
  max_size         = var.asg_configs[count.index].business_hours_max_size
  desired_capacity = var.asg_configs[count.index].business_hours_desired_capacity
  
  recurrence = "0 8 * * MON-FRI"  # 8 AM Monday-Friday
  
  tags = var.tags
}

resource "aws_autoscaling_schedule" "off_hours" {
  count = var.enable_scheduled_scaling ? length(var.asg_configs) : 0
  
  scheduled_action_name = "${var.name_prefix}-${var.asg_configs[count.index].name}-off-hours"
  autoscaling_group_name = aws_autoscaling_group.optimized[count.index].name
  
  min_size         = var.asg_configs[count.index].off_hours_min_size
  max_size         = var.asg_configs[count.index].off_hours_max_size
  desired_capacity = var.asg_configs[count.index].off_hours_desired_capacity
  
  recurrence = "0 20 * * MON-FRI"  # 8 PM Monday-Friday
  
  tags = var.tags
}

# Instance Rightsizing Recommendations (via Lambda)
resource "aws_lambda_function" "rightsizing_analyzer" {
  count = var.enable_rightsizing ? 1 : 0
  
  function_name = "${var.name_prefix}-rightsizing-analyzer"
  role          = aws_iam_role.lambda_exec[0].arn
  handler       = "index.handler"
  runtime       = "python3.9"
  
  filename         = "rightsizing-analyzer.zip"
  source_code_hash = filebase64sha256("rightsizing-analyzer.zip")
  
  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.cost_optimization[0].arn
    }
  }
  
  tags = var.tags
}

# CloudWatch Events for Rightsizing Analysis
resource "aws_cloudwatch_event_rule" "daily_rightsizing" {
  count = var.enable_rightsizing ? 1 : 0
  
  name                = "${var.name_prefix}-daily-rightsizing-analysis"
  description         = "Trigger rightsizing analysis daily"
  schedule_expression = "rate(24 hours)"
}

resource "aws_cloudwatch_event_target" "rightsizing" {
  count = var.enable_rightsizing ? 1 : 0
  
  rule      = aws_cloudwatch_event_rule.daily_rightsizing[0].name
  target_id = "RightsizingAnalyzer"
  arn       = aws_lambda_function.rightsizing_analyzer[0].arn
}

# SNS Topic for Cost Optimization Notifications
resource "aws_sns_topic" "cost_optimization" {
  count = var.enable_budget_alerts || var.enable_rightsizing ? 1 : 0
  
  name = "${var.name_prefix}-cost-optimization"
  
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count = var.enable_budget_alerts || var.enable_rightsizing ? length(var.cost_optimization_emails) : 0
  
  topic_arn = aws_sns_topic.cost_optimization[0].arn
  protocol  = "email"
  endpoint  = var.cost_optimization_emails[count.index]
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  count = var.enable_rightsizing ? 1 : 0
  
  name = "${var.name_prefix}-lambda-rightsizing-exec"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  count = var.enable_rightsizing ? 1 : 0
  
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_cloudwatch" {
  count = var.enable_rightsizing ? 1 : 0
  
  name = "${var.name_prefix}-lambda-cloudwatch-access"
  role = aws_iam_role.lambda_exec[0].name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceTypes",
          "autoscaling:DescribeAutoScalingGroups",
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}
