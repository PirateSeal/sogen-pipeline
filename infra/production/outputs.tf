output "application_url" { value = "https://${var.domain_name}" }
output "load_balancer_dns_name" { value = aws_lb.site.dns_name }
output "ecs_cluster_name" { value = aws_ecs_cluster.main.name }
