output "state_bucket_name" {
  value = aws_s3_bucket.state.bucket
}

output "github_terraform_role_arn" {
  value = aws_iam_role.github_terraform.arn
}
