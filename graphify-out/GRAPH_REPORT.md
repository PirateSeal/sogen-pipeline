# Graph Report - sogen-pipeline  (2026-07-18)

## Corpus Check
- 37 files · ~13,165 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 282 nodes · 321 edges · 37 communities (13 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a105d5f4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Runtime Package
- Development Tooling
- Monitoring Types
- TypeScript Configuration
- HTTP API and Metrics
- Monitoring Service
- Product Security and Delivery
- Cloud and Terraform
- Runtime Configuration
- Exercise Constraints
- SLO Watch Project
- Recherches et décisions d’architecture
- 1. Périmètre du produit
- verify-compose.sh
- verify-container.sh
- EKS with Argo CD
- GitHub Container Registry
- GitHub Actions AWS OIDC
- Immutable Image Traceability
- Definition of Done
- Monitoring API Endpoints
- ECS Deployment
- GitHub Actions Pipeline
- Runtime Configuration
- SLO Watch Product Scope
- SSRF Protections
- Deferred Terraform Decisions
- Manual Protected Terraform Apply
- S3 Remote Terraform State
- Delivery Pipeline
- Public GHCR Image
- In-Memory Measurements
- Local API Execution
- TARGETS_JSON

## God Nodes (most connected - your core abstractions)
1. `MonitorService` - 14 edges
2. `Exigences d’implémentation` - 14 edges
3. `scripts` - 13 edges
4. `Dashboard()` - 12 edges
5. `Recherches et décisions d’architecture` - 12 edges
6. `compilerOptions` - 10 edges
7. `AppConfig` - 7 edges
8. `SLO Watch` - 7 edges
9. `Consignes de l’exercice` - 7 edges
10. `loadConfig()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `createApp()` --calls--> `buildApp()`  [EXTRACTED]
  tests/app.test.ts → src/app.ts
- `StubProbeClient` --implements--> `ProbeClient`  [EXTRACTED]
  tests/monitor.test.ts → src/monitor.ts
- `AppDependencies` --references--> `AppConfig`  [EXTRACTED]
  src/app.ts → src/config.ts
- `AppDependencies` --references--> `MonitorService`  [EXTRACTED]
  src/app.ts → src/monitor.ts
- `buildApp()` --calls--> `toPrometheusMetrics()`  [EXTRACTED]
  src/app.ts → src/metrics.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SLO Watch Delivery Flow** — readme_slo_watch, readme_delivery_pipeline, docs_architecture_research_ghcr, docs_architecture_research_ecsfargate, docs_architecture_research_github_oidc [EXTRACTED 1.00]
- **Monitoring Runtime Contract** — docs_implementation_requirements_slo_watch, docs_implementation_requirements_runtime_configuration, docs_implementation_requirements_api_endpoints, docs_implementation_requirements_ssrf_protections, readme_in_memory_measurements [INFERRED 0.85]
- **Terraform Delivery Controls** — docs_terraform_decisions_deferred_terraform, docs_terraform_decisions_s3_remote_state, docs_terraform_decisions_manual_apply, docs_implementation_requirements_github_actions_pipeline [EXTRACTED 1.00]

## Communities (37 total, 24 thin omitted)

### Community 0 - "Runtime Package"
Cohesion: 0.08
Nodes (23): fastify, dependencies, fastify, description, engines, node, name, private (+15 more)

### Community 1 - "Development Tooling"
Cohesion: 0.05
Nodes (37): eslint, @eslint/js, jsdom, devDependencies, eslint, @eslint/js, jsdom, react (+29 more)

### Community 2 - "Monitoring Types"
Cohesion: 0.21
Nodes (10): MonitoredTarget, FetchProbeClient, MonitorDependencies, ProbeClient, ProbeResult, TargetHistory, TargetSnapshot, TargetState (+2 more)

### Community 3 - "TypeScript Configuration"
Cohesion: 0.15
Nodes (12): src/**/*.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir (+4 more)

### Community 4 - "HTTP API and Metrics"
Cohesion: 0.05
Nodes (37): 10. Plan des quatre heures, 11. Plan de commits, 12. Démonstration en deux minutes, 13. Questions de soutenance, 1. Périmètre du produit, 2. Tests et qualité, 3. Image Docker, 4. Pipeline GitHub Actions (+29 more)

### Community 5 - "Monitoring Service"
Cohesion: 0.10
Nodes (20): AppDependencies, buildApp(), AppConfig, Environment, loadConfig(), parseNumber(), parsePositiveInteger(), parseTargets() (+12 more)

### Community 8 - "Runtime Configuration"
Cohesion: 0.13
Nodes (22): getHistory(), getJson(), getStatus(), ProbeResult, StatusSnapshot, TargetHistory, TargetSnapshot, TargetState (+14 more)

### Community 11 - "SLO Watch Project"
Cohesion: 0.06
Nodes (25): Bootstrap unique, Déploiement AWS économique, Livraison, rollback et coût, Consignes de l’exercice, Contraintes confirmées, Définition de « terminé », Lecture des attentes, Livrable attendu (+17 more)

### Community 12 - "Recherches et décisions d’architecture"
Cohesion: 0.11
Nodes (19): 1. ECS/Fargate plutôt qu’EKS/Argo CD, 2. GHCR public plutôt qu’ECR ou Docker Hub, 3. OIDC plutôt que des clés AWS statiques, 4. Sonar, Trivy et Dependabot, 5. Pourquoi l’application justifie Trivy, 6. Traçabilité et promotion, 7.1 Coût AWS maîtrisé, 7. Coût hors AWS (+11 more)

### Community 13 - "1. Périmètre du produit"
Cohesion: 0.22
Nodes (8): [0.1.0] - 2026-07-18, [0.2.0] - 2026-07-18, Added, Added, Changed, Changed, Changelog, [Unreleased]

## Knowledge Gaps
- **154 isolated node(s):** `name`, `version`, `private`, `description`, `type` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Exigences d’implémentation` connect `HTTP API and Metrics` to `SLO Watch Project`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Development Tooling` to `Runtime Package`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `Recherches et décisions d’architecture` connect `Recherches et décisions d’architecture` to `SLO Watch Project`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _154 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Runtime Package` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Development Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `HTTP API and Metrics` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._