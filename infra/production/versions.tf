terraform {
  required_version = "~> 1.15.0"

  backend "s3" {
    key          = "production/terraform.tfstate"
    region       = "ca-central-1"
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.49.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
