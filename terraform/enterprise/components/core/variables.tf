# Core VPC Component Variables
# Focused interface for VPC infrastructure

variable "name_prefix" {
  description = "Prefix for naming all resources"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = false
}

variable "flow_log_destination_arn" {
  description = "ARN for flow log destination (S3 bucket)"
  type        = string
  default     = ""
}

variable "flow_log_iam_role_arn" {
  description = "IAM role ARN for flow logs"
  type        = string
  default     = ""
}

variable "enable_custom_dhcp" {
  description = "Enable custom DHCP options"
  type        = bool
  default     = false
}

variable "dhcp_domain_name" {
  description = "Custom domain name for DHCP"
  type        = string
  default     = ""
}

variable "dhcp_domain_servers" {
  description = "Custom domain servers for DHCP"
  type        = list(string)
  default     = []
}

variable "dhcp_ntp_servers" {
  description = "Custom NTP servers for DHCP"
  type        = list(string)
  default     = []
}

variable "dhcp_netbios_servers" {
  description = "Custom NetBIOS servers for DHCP"
  type        = list(string)
  default     = []
}

variable "dhcp_netbios_node_type" {
  description = "NetBIOS node type for DHCP"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
