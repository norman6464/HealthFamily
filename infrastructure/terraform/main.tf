provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

terraform {
  backend "s3" {
    bucket         = "healthfamily-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "healthfamily-terraform-lock"
    encrypt        = true
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
