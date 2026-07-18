# Recherches et décisions d’architecture

> **Release status — 0.2.0:** the selected GitHub Actions, SonarQube Cloud,
> Trivy, Dependabot, and GHCR approach is implemented. The ECS/Fargate choice
> is implemented through Terraform for a low-cost production demonstration.

## Décision synthétique

La solution recommandée est :

```text
GitHub public
  -> GitHub Actions
     -> ESLint + Vitest
     -> SonarQube Cloud
     -> Trivy filesystem
     -> Docker Build
     -> Trivy image
     -> GitHub Container Registry (GHCR)
     -> Amazon ECS / Fargate behind ALB + ACM
     -> smoke test HTTP
```

GitHub Actions s’authentifie auprès d’AWS avec OIDC pour le déploiement. L’image est construite une seule fois, analysée, publiée dans GHCR avec un tag SHA puis déployée par digest sans reconstruction. La publication GHCR utilise le `GITHUB_TOKEN` éphémère et les commandes Docker disponibles sur le runner.

## 1. ECS/Fargate plutôt qu’EKS/Argo CD

### Option retenue

ECS/Fargate offre les éléments nécessaires à l’exercice :

- exécution d’une image OCI ;
- déploiement géré ;
- health checks ;
- logs ;
- identité IAM ;
- capacité à relier une image immuable à une révision déployée.

ECS Express Mode peut simplifier la création d’un service web en automatisant une partie de la configuration. Si sa région, ses prérequis ou son comportement font perdre du temps, un service ECS/Fargate standard reste acceptable.

### Option écartée pendant le chrono

EKS avec Argo CD apporterait une démonstration GitOps plus complète, mais il faudrait aussi gérer :

- le cluster et son temps de création ;
- l’accès Kubernetes ;
- le contrôleur Argo CD ;
- les manifests ou charts ;
- le registre et ses credentials/policies ;
- l’exposition réseau ;
- la synchronisation et son diagnostic.

Le risque est de présenter beaucoup de composants, mais aucun parcours terminé. Le choix d’ECS montre une meilleure priorisation sous contrainte. GitOps devient une amélioration explicitement documentée.

Références :

- [Amazon ECS Express Mode — documentation AWS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html)
- [Bonnes pratiques de sécurité Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/security.html)
- [Argo CD — automatisation CI](https://argo-cd.readthedocs.io/en/stable/user-guide/ci_automation/)

## 2. GHCR public plutôt qu’ECR ou Docker Hub

Les trois registres satisfont la consigne. GHCR est retenu parce qu’il :

- reste dans l’environnement GitHub du dépôt public et de la CI ;
- permet une image publique, inspectable par les évaluateurs et directement tirable par ECS/Fargate sans secret de registre ;
- s’authentifie depuis GitHub Actions avec le `GITHUB_TOKEN` éphémère, limité à `packages: write` pour le job de publication ;
- évite d’ajouter des actions tierces de connexion ou de build : le workflow appelle directement `docker login`, `docker build` et `docker push` sur le runner.

Le package doit être explicitement rendu public et lié au dépôt. L’image de production est référencée par digest dans la définition de tâche ECS ; le tag SHA reste la preuve lisible qui relie l’artefact au commit. ECR serait plus intégré à IAM, mais imposerait un registre AWS distinct de l’environnement GitHub choisi. Docker Hub ajouterait un fournisseur et des contraintes de compte inutiles.

Références :

- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Publication de packages Docker avec GitHub Actions](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images)

## 3. OIDC plutôt que des clés AWS statiques

OIDC permet à GitHub Actions d’obtenir des credentials AWS courts en échange d’un jeton lié au workflow. Cela réduit :

- le stockage de secrets longue durée ;
- le risque de fuite et la charge de rotation ;
- la portée d’un credential compromis.

La sécurité dépend toutefois d’une trust policy précise. Elle doit limiter le dépôt, la branche ou l’environnement et l’audience autorisés.

Références :

- [GitHub Actions — configuration d’OIDC dans AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [AWS IAM — fournisseur OIDC GitHub](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)

## 4. Sonar, Trivy et Dependabot

| Outil | Question traitée | Moment |
|---|---|---|
| SonarQube Cloud | Le code présente-t-il des problèmes de maintenabilité, fiabilité ou sécurité statique ? | PR et branche principale |
| Trivy filesystem | Le dépôt contient-il des dépendances vulnérables, secrets ou mauvaises configurations ? | Avant construction/publication |
| Trivy image | L’image finale et son OS contiennent-ils des vulnérabilités ? | Après build, avant push |
| Dependabot | Des versions plus récentes ou correctifs sont-ils disponibles ? | Pull requests périodiques |

Sonar analyse principalement la qualité du code. Trivy observe l’état de sécurité du dépôt et de l’artefact. Dependabot entretient les versions dans le temps. Ils sont complémentaires.

Références :

- [SonarQube Cloud avec GitHub Actions](https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/ci-based-analysis/github-actions-for-sonarcloud/)
- [Plans SonarQube Cloud](https://www.sonarsource.com/plans-and-pricing/sonarcloud/)
- [Trivy GitHub Action](https://github.com/aquasecurity/trivy-action)
- [Trivy — scanner une image](https://trivy.dev/latest/docs/target/container_image/)
- [GitHub Dependabot — démarrage](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates)

## 5. Pourquoi l’application justifie Trivy

Même une petite API TypeScript possède plusieurs surfaces analysables :

- dépendances npm directes et transitives ;
- image de base Node et paquets du système d’exploitation ;
- Dockerfile ;
- workflows GitHub Actions ;
- futurs manifests ou fichiers IaC ;
- risque de secret accidentel.

Il ne faut pas ajouter des dépendances artificielles pour « donner du travail » au scanner. Une image Node réelle suffit à démontrer la différence entre vulnérabilités applicatives et vulnérabilités de l’image de base.

## 6. Traçabilité et promotion

Une pipeline professionnelle doit permettre la relation suivante :

```text
commit SHA
  = tag d’image GHCR
  -> digest d’image
  -> révision ECS
  -> APP_VERSION exposée par l’application
```

Cette chaîne rend l’audit et le rollback compréhensibles. Reconstruire l’image au moment du déploiement casserait cette garantie, car deux builds du même code peuvent différer selon les dépendances ou l’image de base disponibles.

## 7. Coût hors AWS

Le scénario peut rester à **0 CAD hors AWS** si :

- le dépôt GitHub est public ;
- GitHub Actions reste dans les conditions gratuites applicables aux dépôts publics ;
- SonarQube Cloud utilise son offre gratuite pour un projet public compatible ;
- Trivy et Dependabot sont utilisés via leurs intégrations gratuites/open source ;
- GitHub Packages héberge l’image GHCR publique réellement déployée.

Les quotas et conditions peuvent évoluer : vérifier les pages officielles avant le démarrage.

## 7.1 Coût AWS maîtrisé

L'environnement conserve un ALB, ACM et Route 53 afin de démontrer HTTPS et un
nom de domaine stable. Il évite les NAT Gateway en plaçant la task Fargate dans
un subnet public, avec un security group n'autorisant le trafic entrant que
depuis l'ALB. Une seule task est maintenue et les logs expirent après sept jours.

AMP, ADOT et Amazon Managed Grafana sont reportés : ce dernier n'est pas
disponible dans `ca-central-1` et une licence mensuelle est disproportionnée
pour une démonstration courte. Cette évolution reste l'issue #16.

Références :

- [Facturation GitHub Actions](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Facturation GitHub Packages](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-packages/about-billing-for-github-packages)
- [Plans SonarQube Cloud](https://www.sonarsource.com/plans-and-pricing/sonarcloud/)

## 8. Compromis à présenter oralement

### « Pourquoi pas Kubernetes et GitOps ? »

> Kubernetes et Argo CD auraient démontré une boucle GitOps plus riche, mais leur bootstrap aurait consommé une part disproportionnée des quatre heures. J’ai priorisé une chaîne complète, sécurisée et prouvable sur ECS. Avec davantage de temps, je séparerais le dépôt applicatif du dépôt d’environnement et j’ajouterais une promotion par pull request avec Argo CD.

### « Pourquoi Sonar et Trivy ? »

> Sonar vérifie surtout la qualité et certains défauts du code source. Trivy couvre les dépendances, les configurations et l’image finale, y compris son système d’exploitation. Ils protègent des surfaces différentes.

### « Pourquoi Dependabot en plus ? »

> Trivy constate le risque présent au moment du build. Dependabot crée le flux de maintenance qui propose les mises à jour. L’un détecte, l’autre aide à corriger durablement.

### « Pourquoi GHCR plutôt qu’ECR ? »

> Le dépôt et l’image sont publics, comme le demande l’exercice. GHCR garde le code, la CI et l’artefact dans GitHub ; le `GITHUB_TOKEN` éphémère suffit à la publication. ECS tire l’image publique sans secret de registre. ECR aurait été un choix valide, mais aurait ajouté un registre AWS distinct sans bénéfice décisif pour ce scénario.

### « Pourquoi cette application simple ? »

> L’objectif principal est la chaîne de livraison. L’application reste assez réaliste pour produire des tests, des métriques, des health checks et une surface de sécurité, sans détourner le temps vers un produit complexe.

## 9. Évolutions après l’exercice

Dans une itération ultérieure :

- persister les mesures ;
- ajouter Prometheus/Grafana et de l’alerting ;
- construire l’infrastructure avec Terraform ;
- signer l’image et produire une SBOM ;
- ajouter une attestation de provenance ;
- déployer sur EKS avec Argo CD si GitOps devient un objectif central ;
- séparer les dépôts application et environnement ;
- ajouter une stratégie de promotion entre environnements.
