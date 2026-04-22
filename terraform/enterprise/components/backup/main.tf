# Disaster Recovery and Backup Component
# Single responsibility: Backup, recovery, and business continuity
# Follows atomic design principles with focused functionality

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Backup Vault
resource "aws_backup_vault" "production" {
  name = "${var.name_prefix}-backup-vault"
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-backup-vault"
      Type = "BackupVault"
      Environment = var.environment
    }
  )
}

# Backup Plan for Databases
resource "aws_backup_plan" "databases" {
  name = "${var.name_prefix}-database-backup-plan"
  
  rule {
    rule_name         = "daily-backups"
    target_vault_name = aws_backup_vault.production.name
    schedule          = "cron(0 2 * * ? *)"  # Daily at 2 AM
    
    lifecycle {
      delete_after = var.backup_retention_days
    }
    
    recovery_point_tags = merge(
      var.tags,
      {
        BackupType = "Daily"
        Environment = var.environment
      }
    )
    
    copy_action {
      destination_vault_arn = aws_backup_vault.dr_region.arn
      lifecycle {
        delete_after = var.dr_backup_retention_days
      }
    }
  }
  
  advanced_backup_setting {
    backup_options = {
      MySql = {
        engine = "mysql"
        preferred_backup_window = "02:00-03:00"
      }
      PostgreSQL = {
        engine = "postgresql"
        preferred_backup_window = "02:00-03:00"
      }
    }
    resource_type = "RDS"
  }
}

# Backup Selection for RDS
resource "aws_backup_selection" "rds" {
  plan_id      = aws_backup_plan.databases.id
  name         = "rds-backup-selection"
  iam_role_arn = aws_iam_role.backup.arn
  
  selection_tag {
    type  = "STRING_EQUALS"
    key   = "Backup"
    value = "Enabled"
  }
  
  resources = var.backup_resources
}

# Cross-Region Backup Vault
resource "aws_backup_vault" "dr_region" {
  count = var.enable_cross_region_backup ? 1 : 0
  
  name = "${var.name_prefix}-dr-backup-vault"
  provider =.aws.dr
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-dr-backup-vault"
      Type = "BackupVault"
      Environment = var.environment
      Region = var.dr_region
    }
  )
}

# S3 Backup Bucket
resource "aws_s3_bucket" "backup" {
  bucket = "${var.name_prefix}-backups-${random_id.bucket_suffix.hex}"
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-backups"
      Type = "BackupBucket"
      Environment = var.environment
    }
  )
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "backup" {
  bucket = aws_s3_bucket.backup.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id
  
  rule {
    id     = "backup-lifecycle"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
    
    expiration {
      days = var.backup_retention_days
    }
  }
}

# Cross-Region Replication
resource "aws_s3_bucket_replication_configuration" "backup" {
  count = var.enable_cross_region_backup ? 1 : 0
  
  role = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.backup.id
  
  rule {
    id = "backup-replication"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.dr_backup[0].arn
      storage_class = "STANDARD"
    }
    
    delete_marker_replication {
      status = "Enabled"
    }
  }
}

# DR Region Backup Bucket
resource "aws_s3_bucket" "dr_backup" {
  count = var.enable_cross_region_backup ? 1 : 0
  
  bucket = "${var.name_prefix}-dr-backups-${random_id.dr_bucket_suffix.hex}"
  provider = aws.dr
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-dr-backups"
      Type = "BackupBucket"
      Environment = var.environment
      Region = var.dr_region
    }
  )
}

resource "random_id" "dr_bucket_suffix" {
  count = var.enable_cross_region_backup ? 1 : 0
  byte_length = 4
}

# Database Point-in-Time Recovery
resource "aws_db_instance" "primary" {
  count = var.enable_database_backup ? 1 : 0
  
  identifier = "${var.name_prefix}-primary-db"
  
  backup_retention_period = var.backup_retention_days
  backup_window          = "02:00-03:00"
  maintenance_window     = "sun:03:00-sun:04:00"
  
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name_prefix}-primary-db-final-snapshot"
  
  delete_automated_backups = false
  
  tags = var.tags
}

# Database Read Replica for DR
resource "aws_db_instance" "read_replica" {
  count = var.enable_database_backup && var.enable_read_replicas ? 1 : 0
  
  identifier = "${var.name_prefix}-read-replica"
  
  replicate_source_db = aws_db_instance.primary[0].identifier
  
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name_prefix}-read-replica-final-snapshot"
  
  tags = var.tags
}

# RDS Automated Backups
resource "aws_db_instance_automated_backups" "primary" {
  count = var.enable_database_backup ? 1 : 0
  
  db_instance_identifier = aws_db_instance.primary[0].identifier
  
  retention_period = var.backup_retention_days
  
  tags = var.tags
}

# EBS Snapshots
resource "aws_ebs_snapshot" "volume_snapshots" {
  for_each = var.enable_ebs_snapshots ? var.ebs_volumes : {}
  
  volume_id = each.value
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${each.key}-snapshot"
      Type = "EBSSnapshot"
      SourceVolume = each.key
    }
  )
}

# Snapshot Lifecycle Policy
resource "aws_dlm_lifecycle_policy" "ebs" {
  count = var.enable_ebs_snapshots ? 1 : 0
  
  description        = "${var.name_prefix} EBS snapshot lifecycle policy"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"
  
  policy_details {
    resource_types = ["VOLUME"]
    
    schedule {
      name = "daily-snapshots"
      
      create_rule {
        interval = 24
        interval_unit = "HOURS"
        times = ["02:00"]
      }
      
      retain_rule {
        count = var.snapshot_retention_count
      }
      
      tags_to_add = merge(
        var.tags,
        {
          CreatedBy = "DLM"
          Environment = var.environment
        }
      )
    }
    
    target_tags = {
      Backup = "Enabled"
    }
  }
}

# Backup IAM Role
resource "aws_iam_role" "backup" {
  name = "${var.name_prefix}-backup-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "backup_service" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_dlm" {
  count = var.enable_ebs_snapshots ? 1 : 0
  
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForDLM"
}

# S3 Replication IAM Role
resource "aws_iam_role" "s3_replication" {
  count = var.enable_cross_region_backup ? 1 : 0
  
  name = "${var.name_prefix}-s3-replication-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

resource "aws_iam_policy" "s3_replication" {
  count = var.enable_cross_region_backup ? 1 : 0
  
  name = "${var.name_prefix}-s3-replication-policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [aws_s3_bucket.backup.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          "${aws_s3_bucket.backup.arn}/*",
          "${aws_s3_bucket.dr_backup[0].arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  count = var.enable_cross_region_backup ? 1 : 0
  
  role       = aws_iam_role.s3_replication[0].name
  policy_arn = aws_iam_policy.s3_replication[0].arn
}

# DLM IAM Role
resource "aws_iam_role" "dlm" {
  count = var.enable_ebs_snapshots ? 1 : 0
  
  name = "${var.name_prefix}-dlm-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dlm.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "dlm_service" {
  count = var.enable_ebs_snapshots ? 1 : 0
  
  role       = aws_iam_role.dlm[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

# Backup Monitoring
resource "aws_cloudwatch_metric_alarm" "backup_failures" {
  count = var.enable_backup_monitoring ? 1 : 0
  
  alarm_name          = "${var.name_prefix}-backup-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "NumberOfFailedJobs"
  namespace           = "AWS/Backup"
  period              = "3600"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Backup job failures detected"
  treat_missing_data  = "notBreaching"
  
  alarm_actions = var.backup_failure_alarm_actions
  
  tags = var.tags
}

# Backup Success Alarm
resource "aws_cloudwatch_metric_alarm" "backup_success" {
  count = var.enable_backup_monitoring ? 1 : 0
  
  alarm_name          = "${var.name_prefix}-backup-success"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "NumberOfSuccessfulJobs"
  namespace           = "AWS/Backup"
  period              = "86400"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "No successful backup jobs in 24 hours"
  treat_missing_data  = "breaching"
  
  alarm_actions = var.backup_failure_alarm_actions
  
  tags = var.tags
}
