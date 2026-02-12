# ===== API Gateway -> Lambda 呼び出し権限 =====
resource "aws_lambda_permission" "api_gateway_domain" {
  for_each = local.api_resource_paths

  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/${var.api_gateway_stage_name}/*/*"
}

# ===== EventBridge -> Lambda 呼び出し権限 =====
resource "aws_lambda_permission" "eventbridge_process_reminder" {
  statement_id  = "AllowEventBridgeInvoke-processReminder"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification["process_reminder"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.medication_reminder.arn
}

resource "aws_lambda_permission" "eventbridge_check_missed" {
  statement_id  = "AllowEventBridgeInvoke-checkMissed"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification["check_missed"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.missed_medication_check.arn
}

resource "aws_lambda_permission" "eventbridge_low_stock" {
  statement_id  = "AllowEventBridgeInvoke-lowStock"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification["low_stock_alert"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.low_stock_check.arn
}

resource "aws_lambda_permission" "eventbridge_appointment" {
  statement_id  = "AllowEventBridgeInvoke-appointment"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification["appointment_reminder"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.appointment_reminder.arn
}
