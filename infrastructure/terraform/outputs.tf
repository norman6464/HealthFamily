# ===== DynamoDB =====
output "dynamodb_table_names" {
  description = "全DynamoDBテーブル名のマップ"
  value       = local.table_names
}

output "dynamodb_table_arns" {
  description = "全DynamoDBテーブルARNのマップ"
  value = {
    users              = aws_dynamodb_table.users.arn
    members            = aws_dynamodb_table.members.arn
    medications        = aws_dynamodb_table.medications.arn
    schedules          = aws_dynamodb_table.schedules.arn
    medication_records = aws_dynamodb_table.medication_records.arn
    hospitals          = aws_dynamodb_table.hospitals.arn
    appointments       = aws_dynamodb_table.appointments.arn
    medical_history    = aws_dynamodb_table.medical_history.arn
    nutrition_records  = aws_dynamodb_table.nutrition_records.arn
    exercise_records   = aws_dynamodb_table.exercise_records.arn
  }
}

# ===== Cognito =====
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_user_pool_endpoint" {
  description = "Cognito User Poolエンドポイント"
  value       = aws_cognito_user_pool.main.endpoint
}

# ===== API Gateway =====
output "api_gateway_url" {
  description = "API Gateway呼び出しURL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

# ===== S3 =====
output "s3_assets_bucket" {
  description = "S3アセットバケット名"
  value       = aws_s3_bucket.assets.id
}

output "s3_frontend_bucket" {
  description = "S3フロントエンドバケット名"
  value       = aws_s3_bucket.frontend.id
}

output "s3_lambda_deploy_bucket" {
  description = "S3 Lambdaデプロイバケット名"
  value       = aws_s3_bucket.lambda_deploy.id
}

# ===== CloudFront =====
output "cloudfront_distribution_id" {
  description = "CloudFrontディストリビューションID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFrontディストリビューションドメイン名"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

# ===== SNS =====
output "sns_push_notification_topic_arn" {
  description = "SNSプッシュ通知トピックARN"
  value       = aws_sns_topic.push_notifications.arn
}

# ===== Lambda =====
output "lambda_api_function_names" {
  description = "API Lambda関数名のマップ"
  value       = { for k, v in aws_lambda_function.api : k => v.function_name }
}

output "lambda_notification_function_names" {
  description = "通知Lambda関数名のマップ"
  value       = { for k, v in aws_lambda_function.notification : k => v.function_name }
}
