# Graph Report - .  (2026-07-18)

## Corpus Check
- Corpus is ~14,323 words - fits in a single context window. You may not need a graph.

## Summary
- 275 nodes · 451 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API Monitoring Core
- Production AWS Platform
- Frontend Tooling
- Dashboard Data Flow
- Terraform Bootstrap Security
- Node Build Configuration
- Delivery Governance
- TypeScript Build Settings
- Local Container Topology
- Compose Verification
- Container Verification
- Bootstrap Provider Lock
- AWS Platform Rationale
- Production Provider Lock

## God Nodes (most connected - your core abstractions)
1. `local.tags` - 15 edges
2. `aws_ecs_service.app` - 14 edges
3. `var.project_name` - 14 edges
4. `MonitorService` - 14 edges
5. `aws_ecs_task_definition.app` - 13 edges
6. `scripts` - 13 edges
7. `Dashboard()` - 13 edges
8. `aws_vpc.main` - 11 edges
9. `aws_security_group.task` - 10 edges
10. `compilerOptions` - 10 edges

## Surprising Connections (you probably didn't know these)
- `createApp()` --calls--> `buildApp()`  [EXTRACTED]
  tests/app.test.ts → src/app.ts
- `Sonar Trivy Dependabot Complementarity` --rationale_for--> `Quality Job`  [INFERRED]
  docs/ARCHITECTURE_RESEARCH.md → .github/workflows/ci.yml
- `Sonar Trivy Dependabot Complementarity` --rationale_for--> `Trivy Filesystem Scan Job`  [INFERRED]
  docs/ARCHITECTURE_RESEARCH.md → .github/workflows/ci.yml
- `Release Procedure` --references--> `Tagged Release Job`  [EXTRACTED]
  docs/RELEASE.md → .github/workflows/ci.yml
- `Production Delivery Pipeline` --conceptually_related_to--> `Tagged Release Job`  [EXTRACTED]
  README.md → .github/workflows/ci.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Verified Release Delivery Chain** — github_workflows_ci_quality, github_workflows_ci_trivy_fs, github_workflows_ci_release, github_workflows_ci_immutable_image_deployment, github_workflows_ci_github_aws_oidc [EXTRACTED 1.00]
- **Terraform Delivery Governance** — github_workflows_terraform_validate, docs_deployment_bootstrap, docs_terraform_decisions_terraform_isolation, docs_implementation_requirements_aws_deployment [INFERRED 0.85]

## Communities (17 total, 5 thin omitted)

### Community 0 - "API Monitoring Core"
Cohesion: 0.07
Nodes (30): AppDependencies, buildApp(), AppConfig, Environment, loadConfig(), MonitoredTarget, parseNumber(), parsePositiveInteger() (+22 more)

### Community 1 - "Production AWS Platform"
Cohesion: 0.11
Nodes (46): aws_acm_certificate.site, aws_acm_certificate_validation.site, aws_cloudwatch_log_group.app, aws_ecs_cluster.main, aws_ecs_service.app, aws_ecs_task_definition.app, aws_iam_role.execution, aws_iam_role_policy_attachment.execution (+38 more)

### Community 2 - "Frontend Tooling"
Cohesion: 0.05
Nodes (37): eslint, @eslint/js, jsdom, devDependencies, eslint, @eslint/js, jsdom, react (+29 more)

### Community 3 - "Dashboard Data Flow"
Cohesion: 0.11
Nodes (25): getHistory(), getJson(), getStatus(), ProbeResult, StatusSnapshot, TargetHistory, TargetSnapshot, TargetState (+17 more)

### Community 4 - "Terraform Bootstrap Security"
Cohesion: 0.14
Nodes (24): aws_iam_openid_connect_provider.github, aws_iam_role.github_terraform, aws_iam_role_policy.github_terraform, aws_kms_alias.state, aws_kms_key.state, aws_s3_bucket_public_access_block.state, aws_s3_bucket_server_side_encryption_configuration.state, aws_s3_bucket.state (+16 more)

### Community 5 - "Node Build Configuration"
Cohesion: 0.08
Nodes (23): fastify, dependencies, fastify, description, engines, node, name, private (+15 more)

### Community 6 - "Delivery Governance"
Cohesion: 0.13
Nodes (20): Release 1.0.0, Terraform Deployment Permissions, Public GHCR Registry Choice, OIDC Instead of Static AWS Keys, Sonar Trivy Dependabot Complementarity, Terraform Bootstrap, Immutable Digest Rollback, Exercise Delivery Constraints (+12 more)

### Community 7 - "TypeScript Build Settings"
Cohesion: 0.15
Nodes (12): src/**/*.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir (+4 more)

### Community 8 - "Local Container Topology"
Cohesion: 0.67
Nodes (4): API Container Service, Web Container Service, Container Compose Topology, Dashboard Application Root

## Knowledge Gaps
- **76 isolated node(s):** `provider.registry.terraform.io/hashicorp/aws`, `provider.registry.terraform.io/hashicorp/aws`, `name`, `version`, `private` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Frontend Tooling` to `Node Build Configuration`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `provider.registry.terraform.io/hashicorp/aws`, `provider.registry.terraform.io/hashicorp/aws`, `name` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Monitoring Core` be split into smaller, more focused modules?**
  _Cohesion score 0.0746606334841629 - nodes in this community are weakly interconnected._
- **Should `Production AWS Platform` be split into smaller, more focused modules?**
  _Cohesion score 0.1110204081632653 - nodes in this community are weakly interconnected._
- **Should `Frontend Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Dashboard Data Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.11290322580645161 - nodes in this community are weakly interconnected._
- **Should `Terraform Bootstrap Security` be split into smaller, more focused modules?**
  _Cohesion score 0.1402116402116402 - nodes in this community are weakly interconnected._