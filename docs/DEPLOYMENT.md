# Déploiement AWS économique

L'environnement de démonstration est déployé dans `ca-central-1` sur
`https://sogen.tcousin.com` : ALB public, certificat ACM validé par Route 53,
et une seule task ECS/Fargate contenant l'API et le dashboard. Les tasks sont
dans des subnets publics uniquement pour leur sortie Internet ; leur groupe de
sécurité n'accepte le port 80 que depuis l'ALB.

## Bootstrap unique

Avec la CLI AWS configurée sur le compte cible :

```bash
terraform -chdir=infra/bootstrap init
terraform -chdir=infra/bootstrap apply
```

Reporter les outputs dans les variables GitHub du dépôt :

- `AWS_TERRAFORM_ROLE_ARN` : `github_terraform_role_arn`;
- `TF_STATE_BUCKET` : `state_bucket_name`.

Créer ensuite l'environnement GitHub protégé `production`.

Le trust OIDC utilise le sujet GitHub immuable, composé des identifiants
numériques du propriétaire et du dépôt, et reste limité à cet environnement.
Si le dépôt est transféré ou recréé, mettre à jour `github_owner_id` et
`github_repository_id` avant de rejouer le bootstrap.

## Livraison, rollback et coût

Un tag `v*` publie et signe les images GHCR, génère les SBOM/attestations,
applique Terraform par OIDC avec les deux digests, puis vérifie `/healthz` et
`/api/status`. Revenir en arrière consiste à rejouer l'apply avec les deux
digests immuables de la release précédente ; ne jamais reconstruire une image
historique.

Cette démonstration exclut NAT Gateway, AMP et Grafana. Amazon Managed Grafana
n'est pas disponible dans `ca-central-1` et son coût mensuel minimal n'est pas
justifié pour l'exercice ; l'issue #16 reste ouverte avec cette évolution
documentée. Après la démo, supprimer les ressources facturées :

```bash
terraform -chdir=infra/production destroy
```
