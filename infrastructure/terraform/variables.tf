# ===== 一般設定 =====
variable "project_name" {
  description = "リソース命名に使用するプロジェクト名"
  type        = string
  default     = "HealthFamily"
}

variable "environment" {
  description = "デプロイ環境（dev, staging, prod）"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment は dev, staging, prod のいずれかである必要があります。"
  }
}

variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

# ===== DynamoDB =====
variable "dynamodb_billing_mode" {
  description = "DynamoDB課金モード"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "dynamodb_point_in_time_recovery" {
  description = "DynamoDBのポイントインタイムリカバリを有効にする"
  type        = bool
  default     = false
}

variable "dynamodb_deletion_protection" {
  description = "DynamoDBの削除保護を有効にする"
  type        = bool
  default     = false
}

# ===== Lambda =====
variable "lambda_runtime" {
  description = "Lambdaランタイム"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory_size" {
  description = "Lambdaメモリサイズ（MB）"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambdaタイムアウト（秒）"
  type        = number
  default     = 30
}

variable "lambda_log_retention_days" {
  description = "CloudWatch Logsの保持期間（日）"
  type        = number
  default     = 14
}

# ===== Cognito =====
variable "cognito_auto_verify" {
  description = "Cognitoで自動検証する属性"
  type        = list(string)
  default     = ["email"]
}

variable "cognito_password_min_length" {
  description = "Cognitoパスワードの最小文字数"
  type        = number
  default     = 8
}

variable "cognito_callback_urls" {
  description = "CognitoコールバックURL"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "cognito_logout_urls" {
  description = "CognitoログアウトURL"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

# ===== S3 =====
variable "s3_force_destroy" {
  description = "S3バケットの強制削除を許可する（開発環境のみ）"
  type        = bool
  default     = true
}

# ===== API Gateway =====
variable "api_gateway_stage_name" {
  description = "API Gatewayステージ名"
  type        = string
  default     = "v1"
}

variable "api_throttle_rate_limit" {
  description = "APIスロットリングレートリミット（リクエスト/秒）"
  type        = number
  default     = 100
}

variable "api_throttle_burst_limit" {
  description = "APIスロットリングバーストリミット"
  type        = number
  default     = 200
}

# ===== CloudFront =====
variable "domain_name" {
  description = "カスタムドメイン名（任意）"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "CloudFront用ACM証明書ARN（us-east-1）"
  type        = string
  default     = ""
}
