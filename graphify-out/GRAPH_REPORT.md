# Graph Report - .  (2026-07-18)

## Corpus Check
- Corpus is ~6,757 words - fits in a single context window. You may not need a graph.

## Summary
- 122 nodes · 167 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `MonitorService` - 13 edges
2. `compilerOptions` - 10 edges
3. `scripts` - 7 edges
4. `AppConfig` - 7 edges
5. `loadConfig()` - 6 edges
6. `ProbeClient` - 6 edges
7. `buildApp()` - 5 edges
8. `Delivery Pipeline` - 5 edges
9. `Amazon ECS Fargate` - 5 edges
10. `MonitoredTarget` - 4 edges

## Surprising Connections (you probably didn't know these)
- `GitHub Actions Pipeline` --semantically_similar_to--> `Delivery Pipeline`  [INFERRED] [semantically similar]
  docs/IMPLEMENTATION_REQUIREMENTS.md → README.md
- `SLO Watch Product Scope` --semantically_similar_to--> `SLO Watch`  [INFERRED] [semantically similar]
  docs/IMPLEMENTATION_REQUIREMENTS.md → README.md
- `Runtime Configuration` --semantically_similar_to--> `TARGETS_JSON`  [INFERRED] [semantically similar]
  docs/IMPLEMENTATION_REQUIREMENTS.md → README.md
- `createApp()` --calls--> `buildApp()`  [EXTRACTED]
  tests/app.test.ts → src/app.ts
- `Sonar Trivy Dependabot` --implements--> `Delivery Pipeline`  [EXTRACTED]
  docs/ARCHITECTURE_RESEARCH.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SLO Watch Delivery Flow** — readme_slo_watch, readme_delivery_pipeline, docs_architecture_research_ghcr, docs_architecture_research_ecsfargate, docs_architecture_research_github_oidc [EXTRACTED 1.00]
- **Monitoring Runtime Contract** — docs_implementation_requirements_slo_watch, docs_implementation_requirements_runtime_configuration, docs_implementation_requirements_api_endpoints, docs_implementation_requirements_ssrf_protections, readme_in_memory_measurements [INFERRED 0.85]
- **Terraform Delivery Controls** — docs_terraform_decisions_deferred_terraform, docs_terraform_decisions_s3_remote_state, docs_terraform_decisions_manual_apply, docs_implementation_requirements_github_actions_pipeline [EXTRACTED 1.00]

## Communities (11 total, 1 thin omitted)

### Community 0 - "Runtime Package"
Cohesion: 0.11
Nodes (17): fastify, dependencies, fastify, description, engines, node, name, private (+9 more)

### Community 1 - "Development Tooling"
Cohesion: 0.12
Nodes (17): eslint, @eslint/js, devDependencies, eslint, @eslint/js, tsx, @types/node, typescript (+9 more)

### Community 2 - "Monitoring Types"
Cohesion: 0.23
Nodes (9): MonitoredTarget, FetchProbeClient, MonitorDependencies, ProbeClient, ProbeResult, TargetSnapshot, TargetState, config (+1 more)

### Community 3 - "TypeScript Configuration"
Cohesion: 0.15
Nodes (12): src/**/*.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir (+4 more)

### Community 4 - "HTTP API and Metrics"
Cohesion: 0.24
Nodes (9): AppDependencies, buildApp(), AppConfig, label(), toPrometheusMetrics(), MonitorSnapshot, apps, config (+1 more)

### Community 5 - "Monitoring Service"
Cohesion: 0.22
Nodes (5): MonitorService, app, config, monitor, shutdown()

### Community 6 - "Product Security and Delivery"
Cohesion: 0.17
Nodes (12): Sonar Trivy Dependabot, Definition of Done, Monitoring API Endpoints, Runtime Configuration, SLO Watch Product Scope, SSRF Protections, Delivery Pipeline, Public GHCR Image (+4 more)

### Community 7 - "Cloud and Terraform"
Cohesion: 0.29
Nodes (10): Amazon ECS Fargate, EKS with Argo CD, GitHub Container Registry, GitHub Actions AWS OIDC, Immutable Image Traceability, ECS Deployment, GitHub Actions Pipeline, Deferred Terraform Decisions (+2 more)

### Community 8 - "Runtime Configuration"
Cohesion: 0.36
Nodes (6): Environment, loadConfig(), parseNumber(), parsePositiveInteger(), parseTargets(), targets

## Knowledge Gaps
- **51 isolated node(s):** `name`, `version`, `private`, `description`, `type` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Development Tooling` to `Runtime Package`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `MonitorService` connect `Monitoring Service` to `Monitoring Types`, `HTTP API and Metrics`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Runtime Package` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Development Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._