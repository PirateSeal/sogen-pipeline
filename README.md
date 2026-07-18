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
  -> construction de l’image
  -> publication dans GitHub Container Registry (GHCR)
  -> déploiement sur Amazon ECS/Fargate
  -> smoke test et preuve du déploiement
```

L’authentification GitHub vers AWS doit utiliser **OIDC**, sans clé AWS longue durée stockée dans les secrets GitHub.

L’image est publique dans `ghcr.io/<owner>/<image>`. La CI publie avec le `GITHUB_TOKEN` éphémère et les commandes Docker du runner ; elle n’utilise ni identifiant de registre persistant ni action tierce pour la connexion ou le push.

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
