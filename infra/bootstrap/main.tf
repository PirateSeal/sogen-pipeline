data "aws_caller_identity" "current" {}

locals {
  state_bucket_name = "${var.project_name}-tfstate-${data.aws_caller_identity.current.account_id}"
  github_oidc_url   = "https://token.actions.githubusercontent.com"
  github_owner      = split("/", var.github_repository)[0]
  github_repo       = split("/", var.github_repository)[1]
  github_subject    = "repo:${local.github_owner}@${var.github_owner_id}/${local.github_repo}@${var.github_repository_id}:environment:production"
}

resource "aws_s3_bucket" "state" {
  bucket = local.state_bucket_name
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_kms_key" "state" {
  description             = "KMS key for the ${local.state_bucket_name} Terraform state bucket"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_alias" "state" {
  name          = "alias/${var.project_name}-terraform-state"
  target_key_id = aws_kms_key.state.key_id
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.state.arn
      sse_algorithm     = "aws:kms"
    }

    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = local.github_oidc_url
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = []
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.github_subject]
    }
  }
}

resource "aws_iam_role" "github_terraform" {
  name               = "${var.project_name}-github-terraform-production"
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

resource "aws_iam_role_policy" "github_terraform" {
  name = "${var.project_name}-provision-production"
  role = aws_iam_role.github_terraform.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "acm:*", "ec2:*", "ecs:*", "elasticloadbalancing:*", "logs:*",
          "route53:ChangeResourceRecordSets", "route53:GetHostedZone", "route53:ListHostedZonesByName",
          "iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:PassRole", "iam:TagRole",
          "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:PutRolePolicy", "iam:DeleteRolePolicy",
          "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies",
          "s3:GetBucketVersioning", "s3:GetEncryptionConfiguration", "s3:GetPublicAccessBlock"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = ["${aws_s3_bucket.state.arn}/production/terraform.tfstate", "${aws_s3_bucket.state.arn}/production/terraform.tfstate.tflock"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.state.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.state.arn
      }
    ]
  })
}
