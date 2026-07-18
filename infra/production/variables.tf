variable "aws_region" {
  type    = string
  default = "ca-central-1"
}

variable "domain_name" {
  type    = string
  default = "sogen.tcousin.com"
}

variable "hosted_zone_name" {
  type    = string
  default = "tcousin.com."
}

variable "project_name" {
  type    = string
  default = "slo-watch"
}

variable "api_image" { type = string }
variable "web_image" { type = string }
variable "app_version" { type = string }

variable "targets_json" {
  type    = string
  default = "[{\"id\":\"portfolio\",\"url\":\"https://tcousin.com\"},{\"id\":\"vs-calculator\",\"url\":\"https://vs-calculator.tcousin.com\"},{\"id\":\"sc-haul\",\"url\":\"https://sc-haul.tcousin.com\"}]"
}
