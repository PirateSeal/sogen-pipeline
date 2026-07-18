# Exigences d’implémentation

## 1. Périmètre du produit

### Application retenue : SLO Watch

SLO Watch surveille une URL configurable, mesure sa disponibilité et sa latence, puis indique si une cible de fiabilité simple est respectée.

Ce sujet est pertinent car il relie directement l’application à des notions attendues dans un contexte DevOps/SRE :

- **SLI** : la mesure observée, par exemple le taux de requêtes réussies ;
- **SLO** : la cible interne, par exemple `99,5 %` de succès ;
- **SLA** : l’engagement contractuel et ses conséquences éventuelles, volontairement hors du calcul applicatif.

### Stack recommandée

- Node.js LTS ;
- TypeScript ;
- Fastify ou Express ;
- Vitest pour les tests et la couverture ;
- ESLint pour l’analyse statique ;
- Docker avec une image d’exécution minimale et non privilégiée.

### Configuration

L’application lit au minimum :

| Variable | Rôle | Exemple |
|---|---|---|
| `PORT` | Port d’écoute | `3000` |
| `TARGET_URL` | URL surveillée | `https://example.com` |
| `SLO_TARGET` | Objectif de disponibilité | `0.995` |
| `CHECK_INTERVAL_MS` | Fréquence de mesure | `30000` |
| `REQUEST_TIMEOUT_MS` | Timeout d’une sonde | `5000` |
| `APP_VERSION` | SHA ou version de l’image | SHA Git |

La configuration doit être validée au démarrage. Une URL invalide ou une cible SLO hors limites doit provoquer un échec explicite.

### Endpoints obligatoires

| Endpoint | Rôle |
|---|---|
| `GET /` | Page ou réponse de présentation avec état synthétique |
| `GET /api/status` | SLI courant, SLO cible, latence, compteurs et version |
| `GET /healthz` | Santé du processus ; ne dépend pas de la cible surveillée |
| `GET /readyz` | Capacité de l’application à servir des requêtes |
| `GET /metrics` | Métriques Prometheus ou format texte équivalent |

`/healthz` ne doit pas devenir rouge parce que `TARGET_URL` est indisponible : sinon l’orchestrateur redémarrerait une application saine à cause d’une dépendance externe défaillante.

### État

Pour tenir en quatre heures, les mesures peuvent être conservées en mémoire dans une fenêtre bornée. Le README doit signaler que :

- l’historique disparaît au redémarrage ;
- plusieurs réplicas n’agrègent pas leurs mesures ;
- une base ou un backend de métriques serait nécessaire pour une version de production multi-instance.

## 2. Tests et qualité

### Tests minimaux

- validation de configuration ;
- calcul du taux de succès ;
- comparaison SLI/SLO ;
- comportement d’un timeout ou d’une cible indisponible ;
- `/healthz` ;
- `/readyz` ;
- `/api/status` avec une sonde HTTP simulée.

Les tests ne doivent pas dépendre d’Internet. Le client HTTP ou la fonction de sonde doit être injecté et simulé.

### Commandes attendues

```bash
npm ci
npm run lint
npm test
npm run test:coverage
npm run build
```

Un objectif raisonnable est une couverture globale de 80 %, sans consacrer la réussite de la chaîne à la poursuite d’un chiffre artificiel.

## 3. Image Docker

L’image doit :

- utiliser un build multi-stage ;
- installer les dépendances de façon déterministe avec `npm ci` ;
- ne contenir que les fichiers nécessaires à l’exécution ;
- exécuter le processus avec un utilisateur non-root ;
- posséder un `.dockerignore` ;
- exposer un endpoint de santé ;
- recevoir `APP_VERSION` au build ou au déploiement ;
- être étiquetée avec le SHA complet ou court du commit.

Tags recommandés :

- `<sha>` : référence immuable utilisée pour le déploiement et le rollback ;
- `main` : alias pratique facultatif ;
- éviter d’utiliser `latest` comme seule référence.

## 4. Pipeline GitHub Actions

### Déclencheurs

- `pull_request` vers `main` : validations sans déploiement ;
- `push` sur `main` : validations, image, publication, déploiement et smoke test ;
- `workflow_dispatch` : relance ou démonstration manuelle facultative.

### Graphe des jobs

```text
quality
  ├── lint
  ├── tests + coverage
  └── build applicatif
       ├── sonar
       └── trivy-fs
            └── container
                 ├── build image une seule fois
                 ├── trivy-image
                 └── push GHCR (main uniquement)
                      └── deploy ECS
                           └── smoke-test
```

La même image analysée doit être celle publiée puis déployée. Il faut éviter une reconstruction après le scan.

### Permissions

Appliquer le moindre privilège :

```yaml
permissions:
  contents: read
```

Le job `container`, exécuté seulement sur `main`, ajoute uniquement l’autorisation de publier le package :

```yaml
permissions:
  contents: read
  packages: write
```

Le job de déploiement ajoute uniquement :

```yaml
permissions:
  contents: read
  id-token: write
```

`id-token: write` sert à obtenir un jeton OIDC court ; ce n’est pas une autorisation générale d’écriture dans le dépôt.

La publication GHCR utilise `GITHUB_TOKEN` via `docker login ghcr.io --username "$GITHUB_ACTOR" --password-stdin`, puis `docker build` et `docker push`. Ces commandes utilisent Docker sur le runner et évitent les actions tierces de connexion ou de build. Le mot de passe n’est jamais affiché dans les logs.

### Concurrence

Configurer un groupe de concurrence pour `production` afin d’éviter deux déploiements simultanés. Ne pas annuler automatiquement un déploiement déjà en cours si cela risque de laisser l’environnement dans un état indéterminé.

## 5. SonarQube Cloud

SonarQube Cloud doit recevoir :

- le code source ;
- le rapport de couverture LCOV ;
- les métadonnées du dépôt ou de la pull request.

La quality gate doit être visible et bloquante. Si son activation automatique n’est pas possible dans le temps imparti, documenter précisément la limitation plutôt que de présenter une simple analyse comme une gate.

## 6. Trivy et Dependabot

### Trivy

Deux analyses complémentaires :

1. `trivy fs` sur le dépôt pour les vulnérabilités, mauvaises configurations et secrets accidentels ;
2. `trivy image` sur l’image finale avant sa publication.

Politique conseillée :

- bloquer sur les vulnérabilités `CRITICAL` corrigibles ;
- inclure `HIGH` si le bruit reste maîtrisable ;
- produire un rapport lisible dans GitHub Actions ;
- ne jamais masquer globalement les vulnérabilités sans justification.

### Dependabot

Configurer `.github/dependabot.yml` pour :

- `npm` ;
- `github-actions` ;
- une fréquence hebdomadaire ;
- un nombre raisonnable de pull requests ouvertes.

Dependabot propose les mises à jour. Trivy évalue l’état du dépôt et de l’image au moment du build. Les deux outils ne sont donc pas redondants.

## 7. AWS

### Cible

- GitHub Container Registry (`ghcr.io`) public pour le registre ;
- Amazon ECS sur Fargate pour l’exécution ;
- ECS Express Mode si disponible et maîtrisé dans la région choisie ;
- sinon service ECS/Fargate standard avec load balancer ou endpoint public approprié.

### Authentification

GitHub Actions doit assumer un rôle IAM avec OIDC. Interdiction de stocker `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` longue durée dans GitHub.

Le package GHCR étant public, les tâches ECS/Fargate le tirent sans identifiant GitHub ni secret de registre dans AWS. Le package doit être explicitement rendu public et lié au dépôt avant le déploiement.

La relation de confiance IAM doit limiter au minimum :

- le dépôt GitHub concerné ;
- la branche ou l’environnement autorisé ;
- l’audience STS attendue.

Le rôle de déploiement ne doit recevoir que les permissions nécessaires à ECS et `iam:PassRole` sur les rôles explicitement requis ; aucune permission ECR ni aucun secret GitHub ne sont requis pour le pull runtime.

### Déploiement

- déployer l’image par digest ou par tag SHA ;
- utiliser un environnement GitHub `production` ;
- journaliser la version déployée ;
- attendre la stabilisation du service ;
- exécuter un smoke test sur `/healthz` puis `/api/status` ;
- échouer clairement si la nouvelle tâche ne devient pas saine.

### Rollback

Le README doit expliquer comment redéployer le SHA précédent. Le rollback doit réutiliser une image immuable existante, sans reconstruire le code.

## 8. Sécurité applicative

- refuser les schémas autres que `http` et `https` pour `TARGET_URL` ;
- appliquer un timeout strict ;
- ne jamais retourner de secret dans les endpoints ;
- limiter la taille des réponses lues ;
- ne pas suivre aveuglément des redirections vers des réseaux privés ;
- documenter le risque SSRF si l’utilisateur peut modifier librement la cible ;
- préférer une allowlist dans une évolution de production.

## 9. Critères par priorité

### MUST

- application exécutable et testée ;
- Dockerfile non-root ;
- CI sur pull request ;
- SonarQube Cloud avec résultat visible ;
- Trivy sur dépôt et image ;
- image GHCR publique taguée par SHA et déployée par digest ;
- OIDC GitHub vers AWS ;
- déploiement ECS/Fargate ;
- smoke test ;
- README et architecture ;
- aucun secret commité.

### SHOULD

- quality gate Sonar bloquante ;
- rapport Trivy exploitable ;
- environnement GitHub `production` ;
- concurrence de déploiement ;
- cache npm/build ;
- rollback documenté et testé.

### COULD

- SBOM ;
- signature d’image ;
- scan IaC ;
- attestation de provenance ;
- dashboard plus soigné ;
- historique persistant ;
- GitOps sur Kubernetes.

### WON’T pendant les quatre heures

- EKS créé de zéro ;
- installation d’Argo CD ;
- haute disponibilité multi-région ;
- base de données ;
- authentification utilisateur ;
- système d’alerting complet ;
- infrastructure réseau complexe.

## 10. Plan des quatre heures

| Temps | Résultat attendu |
|---|---|
| `0:00–0:25` | squelette TypeScript, configuration, endpoints principaux |
| `0:25–0:50` | tests, couverture, lint et build local |
| `0:50–1:15` | Dockerfile, `.dockerignore`, exécution non-root |
| `1:15–1:50` | workflow PR, SonarQube Cloud et Trivy dépôt |
| `1:50–2:15` | build image, Trivy image, tags SHA |
| `2:15–2:50` | GHCR public, OIDC et bootstrap ECS/Fargate |
| `2:50–3:20` | déploiement, attente de stabilité, smoke test |
| `3:20–3:45` | README, diagramme, rollback et compromis |
| `3:45–4:00` | exécution finale, vérification secrets, preuve et remise |

### Checkpoints

- À `1:00`, l’application et les tests doivent fonctionner localement.
- À `2:00`, la CI de pull request doit être verte ou presque entièrement diagnostiquée.
- À `3:00`, une image doit être disponible dans GHCR et le déploiement doit être en cours.
- À `3:30`, cesser les bonus et sécuriser la démonstration.

### Ordre de coupe si le temps manque

1. retirer GitOps/Kubernetes ;
2. retirer les bonus supply-chain ;
3. simplifier l’interface visuelle ;
4. réduire les métriques secondaires ;
5. documenter un rollback au lieu de l’automatiser ;
6. conserver impérativement les tests, le scan, l’image immuable et le déploiement prouvé.

## 11. Plan de commits

Chaque commit doit être cohérent et démontrer une progression :

1. `feat: add SLO monitoring API`
2. `test: cover health and SLO calculations`
3. `build: add hardened container image`
4. `ci: add quality and security gates`
5. `ci: publish immutable image to GHCR`
6. `deploy: release application to ECS`
7. `docs: document architecture and trade-offs`

Le nombre exact de commits peut être réduit. Ne jamais créer des commits artificiels uniquement pour remplir l’historique.

## 12. Démonstration en deux minutes

1. Montrer l’application et le SHA exposé.
2. Ouvrir la pull request et les jobs qualité/sécurité.
3. Montrer la quality gate Sonar et le résultat Trivy.
4. Relier le SHA Git au tag/digest GHCR puis à la tâche ECS.
5. Expliquer OIDC et l’absence de clés AWS statiques.
6. Terminer par le compromis principal : ECS plutôt qu’EKS/Argo pour livrer une chaîne complète en quatre heures.

## 13. Questions de soutenance

- Pourquoi ECS plutôt qu’EKS ?
- Pourquoi GHCR public plutôt qu’ECR ou Docker Hub ?
- Quelle différence entre Sonar, Trivy et Dependabot ?
- Pourquoi le health check ne dépend-il pas de la cible surveillée ?
- Comment prouver quelle version est déployée ?
- Comment revenir en arrière ?
- Quelles permissions OIDC et IAM sont réellement nécessaires ?
- Quel risque SSRF présente `TARGET_URL` ?
- Que feriez-vous avec une journée supplémentaire ?
