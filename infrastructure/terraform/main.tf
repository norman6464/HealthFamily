provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

terraform {
  # key は環境ごとに分離するため、terraform init 時に指定する:
  #   terraform init -backend-config="key=infrastructure/dev/terraform.tfstate"
  #   terraform init -backend-config="key=infrastructure/staging/terraform.tfstate"
  #   terraform init -backend-config="key=infrastructure/prod/terraform.tfstate"
  backend "s3" {
    bucket         = "healthfamily-terraform-state"
    region         = "ap-northeast-1"
    dynamodb_table = "healthfamily-terraform-lock"
    encrypt        = true
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
