# Exercice CI/CD — Société Générale via SII

Ce dossier contient la préparation de l’exercice permettant d’accéder au second entretien.

> **Important — chrono non démarré :** le dossier n’est volontairement pas encore initialisé comme dépôt Git. Le premier commit déclenche la fenêtre de réalisation de **4 heures maximum**. Ne lancer `git init` et ne créer le premier commit qu’au moment où les quatre heures suivantes sont entièrement disponibles.

## Échéance

- **Dernier délai : lundi 20 juillet 2026 à 17 h**
- **Fuseau horaire de référence : America/Toronto**
- La remise anticipée reste préférable afin de conserver une marge pour les problèmes d’accès ou de déploiement.

## Documents

- [Consignes de l’exercice](docs/EXERCISE_RULES.md) — contraintes confirmées, livrables et critères de réussite.
- [Exigences d’implémentation](docs/IMPLEMENTATION_REQUIREMENTS.md) — périmètre fonctionnel, CI/CD, sécurité, cloud et plan des quatre heures.
- [Recherches et décisions d’architecture](docs/ARCHITECTURE_RESEARCH.md) — choix retenus, solutions écartées, coûts et sources officielles.

## Solution proposée

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

## CI et releases

Le workflow [CI](.github/workflows/ci.yml) exécute `lint`, les tests avec couverture et la compilation de l’API et du dashboard sur les pull requests vers `master` ainsi que sur les push vers cette branche. Son résumé GitHub Actions affiche les taux de couverture obtenus. Un tag Git `v*` déclenche ensuite la construction de deux images, leur vérification ensemble, leur publication dans GHCR avec les tags de version et de SHA court, puis la création d’une GitHub Release avec notes générées automatiquement. Le résumé de ce job relie le tag, le commit et les quatre références d’image publiées.

Les seules actions réutilisées sont les actions GitHub officielles `actions/checkout` et `actions/setup-node`, épinglées à des SHA immuables. Docker, l’authentification GHCR et la création de release passent par les exécutables natifs du runner (`docker` et `gh`) : aucune action tierce ni action locale n’est nécessaire à ce stade. Si un besoin non couvert apparaît, une action composite locale, minimale et versionnée dans le dépôt sera privilégiée et documentée avec ses entrées, sorties et permissions.

## Exécuter localement

```bash
cp .env.example .env
npm install
npm run dev
```

`TARGETS_JSON` déclare les cibles contrôlées par le serveur. Par défaut, l’exemple configure `tcousin.com`, `vs-calculator.tcousin.com` et `sc-haul.tcousin.com`. Les résultats de leurs sondes sont conservés une heure en mémoire ; ils sont donc perdus au redémarrage.

- `GET /healthz` et `GET /readyz` indiquent la santé de l’API elle-même ;
- `GET /api/status` retourne `503` tant qu’une cible est inconnue ou indisponible ;
- `GET /api/targets/<id>/history` retourne les sondes retenues de la dernière heure pour une cible connue ;
- `GET /metrics` expose les mesures au format Prometheus.

Le dashboard React est en anglais. Dans un second terminal, lancer :

```bash
npm run dev:web
```

Vite sert l’interface sur son port par défaut et proxyfie les routes API vers `http://localhost:3000`. Aucune variable de configuration ou information sensible n’est exposée au navigateur.

## Construire et exécuter les images Docker

```bash
docker build --target api --build-arg APP_VERSION=0.1.0 -t slo-watch-api:0.1.0 .
docker build --target web --build-arg APP_VERSION=0.1.0 -t slo-watch-web:0.1.0 .
npm run test:compose
```

Le target `api` utilise un build multi-stage basé sur `node:24-alpine`. Son runtime ne contient que les dépendances de production et le code compilé ; il s’exécute avec l’utilisateur non-root `node`. Le target `web` compile Vite puis utilise Nginx uniquement pour les assets statiques et le proxy vers l’API. Son endpoint `/healthz` reflète la disponibilité du dashboard, indépendamment de l’API.

`compose.yaml` relie les deux images : le dashboard appelle l’API via le proxy Nginx et la variable runtime non sensible `API_UPSTREAM` (par défaut : `http://api:3000`). Un déploiement peut remplacer cette valeur avec son URL de découverte de service sans reconstruire l’image web.

Pour rejouer la vérification de conteneur après un build local :

```bash
npm run test:container -- slo-watch-api:0.1.0
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
