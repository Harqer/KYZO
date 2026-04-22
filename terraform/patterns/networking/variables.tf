# VPC Pattern Variables
# Configuration for VPC core networking infrastructure

variable "name_prefix" {
  description = "Prefix for resource naming"
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "create_dhcp_options" {
  description = "Whether to create custom DHCP options"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for DHCP options"
  type        = string
  default     = ""
}

variable "domain_name_servers" {
  description = "Domain name servers for DHCP options"
  type        = list(string)
  default     = []
}

variable "netbios_name_servers" {
  description = "NetBIOS name servers for DHCP options"
  type        = list(string)
  default     = []
}

variable "netbios_node_type" {
  description = "NetBIOS node type for DHCP options"
  type        = string
  default     = ""
}

variable "enable_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = false
}

variable "flow_log_destination_arn" {
  description = "ARN for flow log destination"
  type        = string
  default     = ""
}

variable "flow_log_traffic_type" {
  description = "Traffic type for flow logs"
  type        = string
  default     = "ALL"
}
