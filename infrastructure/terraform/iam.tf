# ===== Lambda実行ロール =====
resource "aws_iam_role" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-lambda-execution-role"
  }
}

# CloudWatch Logsポリシー
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDBアクセスポリシー
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${local.name_prefix}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
        ]
        Resource = flatten([
          for table in [
            aws_dynamodb_table.users,
            aws_dynamodb_table.members,
            aws_dynamodb_table.medications,
            aws_dynamodb_table.schedules,
            aws_dynamodb_table.medication_records,
            aws_dynamodb_table.hospitals,
            aws_dynamodb_table.appointments,
            aws_dynamodb_table.medical_history,
            aws_dynamodb_table.nutrition_records,
            aws_dynamodb_table.exercise_records,
          ] : [table.arn, "${table.arn}/index/*"]
        ])
      }
    ]
  })
}

# S3アクセスポリシー
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${local.name_prefix}-lambda-s3-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.assets.arn,
          "${aws_s3_bucket.assets.arn}/*",
        ]
      }
    ]
  })
}

# SNS Publishポリシー
resource "aws_iam_role_policy" "lambda_sns" {
  name = "${local.name_prefix}-lambda-sns-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = [aws_sns_topic.push_notifications.arn]
      }
    ]
  })
}

# Cognitoアクセスポリシー
resource "aws_iam_role_policy" "lambda_cognito" {
  name = "${local.name_prefix}-lambda-cognito-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminRespondToAuthChallenge",
        ]
        Resource = [aws_cognito_user_pool.main.arn]
      }
    ]
  })
}
