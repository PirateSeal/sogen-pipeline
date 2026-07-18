# Décisions Terraform

> **Infrastructure status:** Terraform defines the demonstration environment:
> S3 state, GitHub OIDC, ALB/ACM/Route 53 and ECS/Fargate.

Terraform est isolé de l'application dans `infra/bootstrap` et
`infra/production`.

## Périmètre retenu

- Le périmètre couvre un VPC public minimal, un ALB et une task Fargate unique.
- Les tasks ont une IP publique pour éviter les NAT Gateway, mais leur ingress
  reste limité au security group de l'ALB.
- Le front React/Vite et l'API sont déployés dans la même task.

## État distant

L’état Terraform sera stocké dans S3. Un sous-projet `bootstrap`, exécuté localement une seule fois, créera le backend avant l’initialisation de l’infrastructure principale :

- bucket chiffré ;
- versionnement activé ;
- accès public bloqué.

Le backend utilise le verrou S3 (`use_lockfile`) et le bootstrap crée également
le fournisseur OIDC et le rôle GitHub de production.

## Livraison et contrôle

- La CI valide et scanne Terraform en pull request.
- Une release taguée, protégée par l’environnement `production`, applique les
  digests GHCR via OIDC et effectue les smoke tests.
- `terraform destroy` est exécuté après la démonstration pour maîtriser les coûts.
