environment = "staging"
aws_region  = "ap-northeast-1"

# DynamoDB
dynamodb_billing_mode           = "PAY_PER_REQUEST"
dynamodb_point_in_time_recovery = true
dynamodb_deletion_protection    = false

# Lambda
lambda_memory_size        = 256
lambda_timeout            = 30
lambda_log_retention_days = 14

# Cognito
cognito_password_min_length = 8
cognito_callback_urls       = ["https://staging.healthfamily.example.com"]
cognito_logout_urls         = ["https://staging.healthfamily.example.com"]

# S3
s3_force_destroy = true

# API Gateway
api_gateway_stage_name   = "staging"
api_throttle_rate_limit  = 100
api_throttle_burst_limit = 200
