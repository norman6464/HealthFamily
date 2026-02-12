# ===== Origin Access Control =====
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}-frontend-oac"
  description                       = "フロントエンドS3バケット用OAC"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ===== CloudFront Function: APIパスリライト =====
resource "aws_cloudfront_function" "api_rewrite" {
  name    = "${local.name_prefix}-api-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "/api/* プレフィックスを除去してAPI Gatewayに転送"
  publish = true

  code = <<-EOF
    function handler(event) {
      var request = event.request;
      request.uri = request.uri.replace(/^\/api/, '');
      if (request.uri === '') {
        request.uri = '/';
      }
      return request;
    }
  EOF
}

# ===== CloudFrontディストリビューション =====
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name_prefix} フロントエンド配信"
  default_root_object = "index.html"
  price_class         = "PriceClass_200"
  aliases             = var.domain_name != "" ? [var.domain_name] : []

  # S3オリジン（フロントエンドSPA）
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "s3-frontend"
  }

  # API Gatewayオリジン
  origin {
    domain_name = "${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com"
    origin_id   = "api-gateway"
    origin_path = "/${var.api_gateway_stage_name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # デフォルト動作: S3からSPAを配信
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # API動作: API Gatewayにプロキシ（/api/* → /{stage}/members/… へ書き換え）
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-gateway"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Accept", "Content-Type"]
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.api_rewrite.arn
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # SPAルーティング: 403/404はindex.htmlを返す
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
    acm_certificate_arn            = var.acm_certificate_arn == "" ? null : var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn == "" ? null : "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name = "${local.name_prefix}-frontend-cdn"
  }
}
