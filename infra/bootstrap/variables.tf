variable "aws_region" {
  type    = string
  default = "ca-central-1"
}

variable "github_repository" {
  type    = string
  default = "PirateSeal/sogen-pipeline"
}

variable "github_owner_id" {
  description = "Immutable GitHub numeric identifier for the repository owner."
  type        = number
  default     = 33653999
}

variable "github_repository_id" {
  description = "Immutable GitHub numeric identifier for the repository."
  type        = number
  default     = 1305107622
}

variable "project_name" {
  type    = string
  default = "slo-watch"
}
