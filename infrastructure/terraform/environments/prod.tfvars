environment = "prod"
aws_region  = "ap-northeast-1"

# DynamoDB
dynamodb_billing_mode           = "PAY_PER_REQUEST"
dynamodb_point_in_time_recovery = true
dynamodb_deletion_protection    = true

# Lambda
lambda_memory_size        = 256
lambda_timeout            = 30
lambda_log_retention_days = 90

# Cognito
cognito_password_min_length = 8
cognito_callback_urls       = ["https://healthfamily.example.com"]
cognito_logout_urls         = ["https://healthfamily.example.com"]

# S3
s3_force_destroy = false

# API Gateway
api_gateway_stage_name   = "v1"
api_throttle_rate_limit  = 200
api_throttle_burst_limit = 500

# CloudFront
domain_name         = "healthfamily.example.com"
acm_certificate_arn = ""
