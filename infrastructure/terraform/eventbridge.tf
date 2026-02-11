# ===== 服薬リマインダー（毎分実行） =====
resource "aws_cloudwatch_event_rule" "medication_reminder" {
  name                = "${local.name_prefix}-medication-reminder"
  description         = "服薬リマインダーチェックを毎分実行"
  schedule_expression = "rate(1 minute)"
  state               = "ENABLED"

  tags = {
    Name = "${local.name_prefix}-medication-reminder"
  }
}

resource "aws_cloudwatch_event_target" "medication_reminder" {
  rule      = aws_cloudwatch_event_rule.medication_reminder.name
  target_id = "process-reminder-lambda"
  arn       = aws_lambda_function.notification["process_reminder"].arn
}

# ===== 飲み忘れチェック（5分毎実行） =====
resource "aws_cloudwatch_event_rule" "missed_medication_check" {
  name                = "${local.name_prefix}-missed-medication-check"
  description         = "飲み忘れチェックを5分毎に実行"
  schedule_expression = "rate(5 minutes)"
  state               = "ENABLED"

  tags = {
    Name = "${local.name_prefix}-missed-medication-check"
  }
}

resource "aws_cloudwatch_event_target" "missed_medication_check" {
  rule      = aws_cloudwatch_event_rule.missed_medication_check.name
  target_id = "check-missed-lambda"
  arn       = aws_lambda_function.notification["check_missed"].arn
}

# ===== 在庫不足アラート（毎日9時JST = 0時UTC） =====
resource "aws_cloudwatch_event_rule" "low_stock_check" {
  name                = "${local.name_prefix}-low-stock-check"
  description         = "在庫不足チェックを毎日9時JSTに実行"
  schedule_expression = "cron(0 0 * * ? *)"
  state               = "ENABLED"

  tags = {
    Name = "${local.name_prefix}-low-stock-check"
  }
}

resource "aws_cloudwatch_event_target" "low_stock_check" {
  rule      = aws_cloudwatch_event_rule.low_stock_check.name
  target_id = "low-stock-alert-lambda"
  arn       = aws_lambda_function.notification["low_stock_alert"].arn
}

# ===== 通院リマインダー（毎日8時JST = 23時UTC前日） =====
resource "aws_cloudwatch_event_rule" "appointment_reminder" {
  name                = "${local.name_prefix}-appointment-reminder"
  description         = "通院リマインダーを毎日8時JSTに送信"
  schedule_expression = "cron(0 23 * * ? *)"
  state               = "ENABLED"

  tags = {
    Name = "${local.name_prefix}-appointment-reminder"
  }
}

resource "aws_cloudwatch_event_target" "appointment_reminder" {
  rule      = aws_cloudwatch_event_rule.appointment_reminder.name
  target_id = "appointment-reminder-lambda"
  arn       = aws_lambda_function.notification["appointment_reminder"].arn
}
