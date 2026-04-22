# Core VPC Component Outputs
# Clean interface for dependency injection

output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "flow_log_id" {
  description = "ID of the Flow Log (if enabled)"
  value       = var.enable_flow_logs ? aws_flow_log.main[0].id : null
}

output "dhcp_options_id" {
  description = "ID of custom DHCP options (if enabled)"
  value       = var.enable_custom_dhcp ? aws_vpc_dhcp_options.main[0].id : null
}

output "default_security_group_id" {
  description = "ID of the default security group"
  value       = aws_vpc.main.default_security_group_id
}

output "main_route_table_id" {
  description = "ID of the main route table"
  value       = aws_vpc.main.main_route_table_id
}

output "default_network_acl_id" {
  description = "ID of the default network ACL"
  value       = aws_vpc.main.default_network_acl_id
}
