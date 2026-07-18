# SLO Watch

SLO Watch is a lightweight monitoring service that measures the availability
and latency of configured HTTP targets.

**Current release:** `0.2.0` (release preparation). The application, quality
gates, dependency maintenance, and container-release workflow are implemented;
 Terraform and ECS/Fargate deployment are defined as infrastructure as code for
 the production demonstration.

## Documentation

- [Project guidelines](docs/EXERCISE_RULES.md) — delivery constraints and acceptance criteria.
- [Implementation requirements](docs/IMPLEMENTATION_REQUIREMENTS.md) — functional scope, CI/CD, security and cloud design.
- [Architecture research](docs/ARCHITECTURE_RESEARCH.md) — selected approaches, alternatives and sources.
- [Release guide](docs/RELEASE.md) — the verified path from `master` to a tagged release.
- [Deployment guide](docs/DEPLOYMENT.md) — bootstrap, production delivery, rollback and cleanup.
- [Terraform decisions](docs/TERRAFORM_DECISIONS.md) — infrastructure scope and cost trade-offs.

## Product scope

Construire **SLO Watch**, une petite API TypeScript qui mesure la disponibilité et la latence d’une URL, expose un état synthétique ainsi que des endpoints de santé et de métriques.

La valeur principale du projet n’est pas la complexité de l’application. Elle réside dans une chaîne de livraison professionnelle et explicable :

```text
Pull request
  -> lint + tests + couverture
  -> SonarQube Cloud
  -> Trivy (dépôt et image)
  -> construction des images API et dashboard
  -> publication dans GitHub Container Registry (GHCR)
  -> déploiement sur Amazon ECS/Fargate
  -> smoke test et preuve du déploiement
```

L’authentification GitHub vers AWS doit utiliser **OIDC**, sans clé AWS longue durée stockée dans les secrets GitHub.

Les images sont publiques dans `ghcr.io/<owner>/slo-watch-api` et `ghcr.io/<owner>/slo-watch-web`. La CI publie avec le `GITHUB_TOKEN` éphémère et les commandes Docker du runner ; elle n’utilise ni identifiant de registre persistant ni action tierce pour la connexion ou le push.

## CI and releases

The [CI workflow](.github/workflows/ci.yml) runs linting, coverage tests, and
production builds for the API and dashboard on pull requests and pushes to
`master`. SonarQube Cloud then enforces its quality gate. Trivy fails the
pipeline for fixable `CRITICAL` vulnerabilities, secrets, or misconfigurations
in the repository and scans both final images before they can be published.
Dependabot checks npm and GitHub Actions dependencies weekly.

A `v*` Git tag builds and verifies both images, publishes them to GHCR with
version and short-SHA tags, and creates a GitHub Release with generated notes.
The job summary links the tag, commit, and all four published image references.

Les actions réutilisées sont les actions GitHub officielles `actions/checkout` et `actions/setup-node`, ainsi que les actions maintenues par SonarSource et Aqua Security pour les analyses de sécurité ; toutes sont épinglées à des SHA immuables. Docker, l’authentification GHCR et la création de release passent par les exécutables natifs du runner (`docker` et `gh`). Si un besoin non couvert apparaît, une action composite locale, minimale et versionnée dans le dépôt sera privilégiée et documentée avec ses entrées, sorties et permissions.

## Exécuter localement

```bash
cp .env.example .env
npm install
npm run dev
```

`TARGETS_JSON` déclare les cibles contrôlées par le serveur. Par défaut, l’exemple configure `tcousin.com`, `vs-calculator.tcousin.com` et `sc-haul.tcousin.com`. Les résultats de leurs sondes sont conservés une heure en mémoire ; ils sont donc perdus au redémarrage.

- `GET /healthz` et `GET /readyz` indiquent la santé de l’API elle-même ;
- `GET /api/status` retourne l’état de chaque cible, sa dernière sonde, le SLI et les compteurs de la dernière heure, ainsi que `averageLatencyMs` (ou `null` avant toute sonde). Il retourne `503` tant qu’une cible est inconnue ou indisponible ;
- `GET /api/targets/<id>/history` retourne les sondes retenues de la dernière heure pour une cible connue ;
- `GET /metrics` expose les mesures au format Prometheus.

The React dashboard is in English. In a second terminal, run:

```bash
npm run dev:web
```

Vite sert l’interface sur son port par défaut et proxyfie les routes API vers `http://localhost:3000`. Aucune variable de configuration ou information sensible n’est exposée au navigateur.

Le dashboard se rafraîchit toutes les 30 secondes et permet de sélectionner une cible. Sa courbe de latence conserve une échelle glissante d’une heure, ancrée sur l’heure courante ; chaque carte affiche la dernière latence et, lorsqu’elle est disponible, la moyenne de la fenêtre. Les indicateurs utilisent des états sémantiques (vert, ambre, rouge) et la barre de fiabilité évolue progressivement selon le SLI.

## Construire et exécuter les images Docker

```bash
docker build --target api --build-arg APP_VERSION=0.2.0 -t slo-watch-api:0.2.0 .
docker build --target web --build-arg APP_VERSION=0.2.0 -t slo-watch-web:0.2.0 .
npm run test:compose
```

Le target `api` utilise un build multi-stage basé sur `node:24-alpine`. Son runtime ne contient que les dépendances de production et le code compilé ; il s’exécute avec l’utilisateur non-root `node`. Le target `web` compile Vite puis utilise Nginx uniquement pour les assets statiques et le proxy vers l’API. Son endpoint `/healthz` reflète la disponibilité du dashboard, indépendamment de l’API.

`compose.yaml` relie les deux images : le dashboard appelle l’API via le proxy Nginx et la variable runtime non sensible `API_UPSTREAM` (par défaut : `http://api:3000`). Un déploiement peut remplacer cette valeur avec son URL de découverte de service sans reconstruire l’image web.

Pour rejouer la vérification de conteneur après un build local :

```bash
npm run test:container -- slo-watch-api:0.2.0
```

## Gate avant démarrage

Avant le premier commit, préparer sans exécuter le projet :

- un compte GitHub et un nom de dépôt public ;
- un package GHCR public lié au dépôt ;
- un compte SonarQube Cloud et les secrets nécessaires ;
- l’accès AWS et la région cible ;
- le rôle IAM OIDC destiné à GitHub Actions ;
- les valeurs de configuration non sensibles ;
- une fenêtre de quatre heures sans interruption.

À l’instant du démarrage, noter l’heure exacte du premier commit et calculer immédiatement l’heure limite à `T0 + 4 h`.
