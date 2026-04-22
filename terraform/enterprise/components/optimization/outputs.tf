# Cost Optimization Component Outputs
# Clean interface for dependency injection

output "budget_arn" {
  description = "ARN of the AWS budget"
  value       = var.enable_budget_alerts ? aws_budgets_budget.monthly[0].arn : null
}

output "autoscaling_group_arns" {
  description = "ARNs of the auto scaling groups"
  value       = var.enable_autoscaling ? [for asg in aws_autoscaling_group.optimized : asg.arn] : []
}

output "autoscaling_group_names" {
  description = "Names of the auto scaling groups"
  value       = var.enable_autoscaling ? [for asg in aws_autoscaling_group.optimized : asg.name] : []
}

output "scale_up_policy_arns" {
  description = "ARNs of the scale up policies"
  value       = var.enable_autoscaling ? [for policy in aws_autoscaling_policy.scale_up : policy.arn] : []
}

output "scale_down_policy_arns" {
  description = "ARNs of the scale down policies"
  value       = var.enable_autoscaling ? [for policy in aws_autoscaling_policy.scale_down : policy.arn] : []
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of the CloudWatch alarms"
  value       = var.enable_autoscaling ? concat(
    [for alarm in aws_cloudwatch_metric_alarm.scale_up : alarm.arn],
    [for alarm in aws_cloudwatch_metric_alarm.scale_down : alarm.arn]
  ) : []
}

output "scheduled_scaling_arns" {
  description = "ARNs of the scheduled scaling policies"
  value       = var.enable_scheduled_scaling ? concat(
    [for schedule in aws_autoscaling_schedule.business_hours : schedule.arn],
    [for schedule in aws_autoscaling_schedule.off_hours : schedule.arn]
  ) : []
}

output "lambda_function_arn" {
  description = "ARN of the rightsizing Lambda function"
  value       = var.enable_rightsizing ? aws_lambda_function.rightsizing_analyzer[0].arn : null
}

output "lambda_function_name" {
  description = "Name of the rightsizing Lambda function"
  value       = var.enable_rightsizing ? aws_lambda_function.rightsizing_analyzer[0].function_name : null
}

output "sns_topic_arn" {
  description = "ARN of the cost optimization SNS topic"
  value       = (var.enable_budget_alerts || var.enable_rightsizing) ? aws_sns_topic.cost_optimization[0].arn : null
}

output "cost_allocation_tag_status" {
  description = "Status of cost allocation tags"
  value       = { for tag in aws_ce_cost_allocation_tag.optimization : tag.tag_key => tag.status }
}

output "cloudwatch_event_rule_arn" {
  description = "ARN of the CloudWatch event rule for rightsizing"
  value       = var.enable_rightsizing ? aws_cloudwatch_event_rule.daily_rightsizing[0].arn : null
}

output "iam_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = var.enable_rightsizing ? aws_iam_role.lambda_exec[0].arn : null
}
