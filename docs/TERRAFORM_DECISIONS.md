# Décisions Terraform différées

Terraform fera l’objet d’un plan et d’une branche distincts de l’API. Aucun fichier Terraform ni aucune ressource AWS ne sont créés dans le lot `feat/api-monitoring`.

## Périmètre retenu

- Le futur périmètre Terraform couvre un réseau AWS complet.
- ECS/Fargate n’est pas inclus dans la première étape Terraform ; son implémentation sera décidée dans le plan d’infrastructure correspondant.
- Le front React/Vite est également différé : il consommera ultérieurement l’API existante sans modifier le moniteur serveur.

## État distant

L’état Terraform sera stocké dans S3. Un sous-projet `bootstrap`, exécuté localement une seule fois, créera le backend avant l’initialisation de l’infrastructure principale :

- bucket chiffré ;
- versionnement activé ;
- accès public bloqué.

Le détail du verrouillage et des politiques IAM sera défini avec l’implémentation Terraform, afin de rester compatible avec la version de Terraform retenue à ce moment-là.

## Livraison et contrôle

- La CI validera et planifiera les changements Terraform.
- L’application se fera seulement via un workflow GitHub `workflow_dispatch` protégé par l’environnement `production`.
- Aucun `terraform apply` ne sera lancé automatiquement sur un push.
