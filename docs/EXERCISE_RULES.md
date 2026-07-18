# Consignes de l’exercice

## Contraintes confirmées

| Élément | Exigence |
|---|---|
| Sujet | Libre |
| Dépôt | Public sur GitHub |
| Objectif principal | Construire une pipeline CI/CD fonctionnelle et démontrable |
| Déploiement | Déployer l’application sur un cloud ; AWS est le choix retenu |
| Conteneur | Construire et publier une image Docker |
| Registre | Docker Hub, GHCR ou équivalent acceptés ; GHCR public est le choix retenu |
| Qualité | Ajouter une analyse de code et une quality gate avec SonarQube Cloud |
| Sécurité | Vérifier le dépôt, les dépendances et l’image avec Trivy |
| Maintenance | Configurer Dependabot pour les dépendances npm et GitHub Actions |
| IA | Autorisée, à condition de pouvoir expliquer les décisions d’ingénierie |
| Durée | Quatre heures maximum à partir du premier commit |
| Échéance | Lundi 20 juillet 2026 à 17 h, fuseau `America/Toronto` |

## Lecture des attentes

La feuille remise pendant l’entretien met l’accent sur :

- les décisions d’ingénierie ;
- la capacité à prioriser sous une contrainte de temps ;
- la clarté des explications ;
- la cohérence globale de la solution.

Il faut donc privilégier une chaîne terminée et prouvée plutôt qu’une architecture plus prestigieuse mais partiellement opérationnelle.

## Livrable attendu

Le dépôt public doit permettre à un évaluateur de comprendre rapidement :

1. ce que fait l’application ;
2. comment la lancer localement ;
3. quelles vérifications sont exécutées sur une pull request ;
4. comment l’image est construite, analysée et identifiée ;
5. comment le déploiement AWS est authentifié et exécuté ;
6. comment vérifier que la version déployée correspond au commit Git ;
7. quels compromis ont été faits pour tenir en quatre heures.

À remettre ou rendre visibles :

- l’URL du dépôt GitHub public ;
- l’historique des workflows GitHub Actions ;
- l’URL publique de l’application si l’environnement AWS le permet ;
- les résultats SonarQube et Trivy ;
- un README expliquant l’architecture, les commandes, le rollback et les compromis.

## Règles de preuve

- Chaque image doit porter au minimum le SHA du commit, jamais seulement `latest`.
- La page ou l’API déployée doit exposer le SHA ou la version afin de relier Git, l’image et le runtime.
- Une quality gate annoncée doit réellement bloquer le workflow lorsqu’elle échoue.
- Aucun secret, jeton ou identifiant cloud ne doit être commité.
- L’usage de l’IA doit rester vérifiable : le candidat doit pouvoir expliquer chaque job, permission et compromis.

## Définition de « terminé »

Le projet est considéré terminé quand :

- une pull request déclenche lint, tests, couverture, Sonar et Trivy ;
- le workflow de `main` construit une seule image immuable et la publie dans GHCR ;
- cette même image est déployée sur ECS/Fargate ;
- un smoke test interroge l’application après le déploiement ;
- le README permet une démonstration de deux minutes ;
- le dépôt ne contient aucun secret ni vulnérabilité critique connue non documentée.

## Utilisation responsable de l’IA

Pour chaque portion générée ou fortement assistée, être capable de répondre :

- Pourquoi ce composant existe-t-il ?
- Quel risque réduit-il ?
- Pourquoi cette permission GitHub ou AWS est-elle nécessaire ?
- Que se passe-t-il si ce job échoue ?
- Comment revenir à la version précédente ?
- Qu’aurais-je simplifié ou renforcé avec davantage de temps ?
