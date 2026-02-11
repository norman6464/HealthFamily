# ===== REST API =====
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "HealthFamily REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${local.name_prefix}-api"
  }
}

# ===== Cognitoオーソライザー =====
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${local.name_prefix}-cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.main.arn]

  identity_source = "method.request.header.Authorization"
}

# ===== APIリソースパス定義 =====
locals {
  api_resource_paths = {
    members      = "members"
    medications  = "medications"
    schedules    = "schedules"
    records      = "records"
    hospitals    = "hospitals"
    appointments = "appointments"
  }
}

# トップレベルリソース
resource "aws_api_gateway_resource" "domain" {
  for_each = local.api_resource_paths

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = each.value
}

# プロキシリソース
resource "aws_api_gateway_resource" "domain_proxy" {
  for_each = local.api_resource_paths

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.domain[each.key].id
  path_part   = "{proxy+}"
}

# ===== ANYメソッド（ドメインルート） =====
resource "aws_api_gateway_method" "domain_any" {
  for_each = local.api_resource_paths

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.domain[each.key].id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# ANYメソッド（プロキシパス）
resource "aws_api_gateway_method" "domain_proxy_any" {
  for_each = local.api_resource_paths

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.domain_proxy[each.key].id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# ===== Lambda統合（ドメインルート） =====
resource "aws_api_gateway_integration" "domain_lambda" {
  for_each = local.api_resource_paths

  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.domain[each.key].id
  http_method             = aws_api_gateway_method.domain_any[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api[each.key].invoke_arn
}

# Lambda統合（プロキシパス）
resource "aws_api_gateway_integration" "domain_proxy_lambda" {
  for_each = local.api_resource_paths

  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.domain_proxy[each.key].id
  http_method             = aws_api_gateway_method.domain_proxy_any[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api[each.key].invoke_arn
}

# ===== CORS: OPTIONSメソッド =====
resource "aws_api_gateway_method" "domain_options" {
  for_each = local.api_resource_paths

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.domain[each.key].id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "domain_options_mock" {
  for_each = local.api_resource_paths

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.domain[each.key].id
  http_method = aws_api_gateway_method.domain_options[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "domain_options_200" {
  for_each = local.api_resource_paths

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.domain[each.key].id
  http_method = aws_api_gateway_method.domain_options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "domain_options_200" {
  for_each = local.api_resource_paths

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.domain[each.key].id
  http_method = aws_api_gateway_method.domain_options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.domain_options_mock]
}

# ===== デプロイメント・ステージ =====
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.domain,
      aws_api_gateway_resource.domain_proxy,
      aws_api_gateway_method.domain_any,
      aws_api_gateway_method.domain_proxy_any,
      aws_api_gateway_integration.domain_lambda,
      aws_api_gateway_integration.domain_proxy_lambda,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.api_gateway_stage_name

  tags = {
    Name = "${local.name_prefix}-api-${var.api_gateway_stage_name}"
  }
}

# スロットリング設定
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = var.api_throttle_rate_limit
    throttling_burst_limit = var.api_throttle_burst_limit
    metrics_enabled        = true
    logging_level          = "INFO"
  }
}
