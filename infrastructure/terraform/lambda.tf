# ===== Lambdaデプロイ用S3バケット =====
resource "aws_s3_bucket" "lambda_deploy" {
  bucket        = "${lower(local.name_prefix)}-lambda-deploy"
  force_destroy = var.s3_force_destroy

  tags = {
    Name = "${local.name_prefix}-lambda-deploy"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_deploy" {
  bucket = aws_s3_bucket.lambda_deploy.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# ===== API Lambda関数 =====
locals {
  api_lambda_functions = {
    members      = { description = "メンバー管理 CRUD API" }
    medications  = { description = "お薬管理 CRUD API" }
    schedules    = { description = "スケジュール管理 CRUD API" }
    records      = { description = "服薬記録 API" }
    hospitals    = { description = "病院管理 CRUD API" }
    appointments = { description = "通院予約管理 CRUD API" }
  }
}

resource "aws_lambda_function" "api" {
  for_each = local.api_lambda_functions

  function_name = "${local.name_prefix}-api-${each.key}"
  description   = each.value.description
  role          = aws_iam_role.lambda_execution.arn
  handler       = "dist/lambda.handler"
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  s3_bucket = aws_s3_bucket.lambda_deploy.id
  s3_key    = "api/${each.key}/function.zip"

  environment {
    variables = merge(local.lambda_common_env_vars, {
      SNS_TOPIC_ARN = aws_sns_topic.push_notifications.arn
      USER_POOL_ID  = aws_cognito_user_pool.main.id
      FUNCTION_NAME = each.key
    })
  }

  tags = {
    Name     = "${local.name_prefix}-api-${each.key}"
    Function = each.key
    Type     = "api"
  }

  lifecycle {
    ignore_changes = [s3_key, s3_object_version]
  }
}

# API Lambda用CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_lambda" {
  for_each = local.api_lambda_functions

  name              = "/aws/lambda/${local.name_prefix}-api-${each.key}"
  retention_in_days = var.lambda_log_retention_days

  tags = {
    Name = "${local.name_prefix}-api-${each.key}-logs"
  }
}

# ===== 通知Lambda関数 =====
locals {
  notification_lambda_functions = {
    process_reminder = {
      description = "服薬リマインダー処理（毎分実行）"
      handler     = "dist/functions/notifications/processReminder.handler"
    }
    check_missed = {
      description = "飲み忘れチェック（5分毎実行）"
      handler     = "dist/functions/notifications/checkMissedMedication.handler"
    }
    low_stock_alert = {
      description = "在庫不足アラート（毎日9時JST実行）"
      handler     = "dist/functions/notifications/lowStockAlert.handler"
    }
    appointment_reminder = {
      description = "通院リマインダー（毎日8時JST実行）"
      handler     = "dist/functions/notifications/appointmentReminder.handler"
    }
  }
}

resource "aws_lambda_function" "notification" {
  for_each = local.notification_lambda_functions

  function_name = "${local.name_prefix}-notification-${each.key}"
  description   = each.value.description
  role          = aws_iam_role.lambda_execution.arn
  handler       = each.value.handler
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  s3_bucket = aws_s3_bucket.lambda_deploy.id
  s3_key    = "notifications/${each.key}/function.zip"

  environment {
    variables = merge(local.lambda_common_env_vars, {
      SNS_TOPIC_ARN = aws_sns_topic.push_notifications.arn
      USER_POOL_ID  = aws_cognito_user_pool.main.id
    })
  }

  tags = {
    Name     = "${local.name_prefix}-notification-${each.key}"
    Function = each.key
    Type     = "notification"
  }

  lifecycle {
    ignore_changes = [s3_key, s3_object_version]
  }
}

# 通知Lambda用CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "notification_lambda" {
  for_each = local.notification_lambda_functions

  name              = "/aws/lambda/${local.name_prefix}-notification-${each.key}"
  retention_in_days = var.lambda_log_retention_days

  tags = {
    Name = "${local.name_prefix}-notification-${each.key}-logs"
  }
}
