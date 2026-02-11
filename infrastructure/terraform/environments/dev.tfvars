environment = "dev"
aws_region  = "ap-northeast-1"

# DynamoDB
dynamodb_billing_mode           = "PAY_PER_REQUEST"
dynamodb_point_in_time_recovery = false
dynamodb_deletion_protection    = false

# Lambda
lambda_memory_size        = 256
lambda_timeout            = 30
lambda_log_retention_days = 7

# Cognito
cognito_password_min_length = 8
cognito_callback_urls       = ["http://localhost:5173", "http://localhost:3000"]
cognito_logout_urls         = ["http://localhost:5173", "http://localhost:3000"]

# S3
s3_force_destroy = true

# API Gateway
api_gateway_stage_name   = "dev"
api_throttle_rate_limit  = 50
api_throttle_burst_limit = 100
