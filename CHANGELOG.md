# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Allow the production Terraform role to discover Route 53 hosted zones and
  read the records and change status required to manage DNS safely.

## [1.0.2] - 2026-07-18

### Fixed

- Trust GitHub Actions' immutable OIDC subject, including the numeric owner and
  repository identifiers, while retaining the `production` environment scope.

## [1.0.1] - 2026-07-18

### Fixed

- Publish container SBOM and provenance attestations with untagged OCI subject
  names so the release workflow can push them to GHCR and continue to ECS.

## [1.0.0] - 2026-07-18

### Added

- Terraform bootstrap for the encrypted and versioned S3 state backend and the
  GitHub OIDC production role.
- Cost-conscious AWS production platform in `ca-central-1` with a public ALB,
  ACM/Route 53 HTTPS, and one ECS/Fargate task running the API and dashboard.
- Pull-request Terraform validation and Trivy scanning, plus tagged-release
  deployment with immutable GHCR digests and HTTPS smoke tests.
- Keyless Cosign signatures, CycloneDX SBOMs, and GitHub provenance and SBOM
  attestations for both release images.
- Deployment, rollback, destruction, architecture, and cost documentation.

### Changed

- Kept the demonstration infrastructure intentionally small by excluding NAT
  Gateway, AMP, ADOT, and Grafana while documenting the evaluated alternatives.
- Regenerated the architecture graph for the production delivery path.

### Security

- Protected Terraform state with a customer-managed KMS key, automatic key
  rotation, S3 Bucket Keys, versioning, and public-access blocking.
- Restricted ECS ingress to the ALB, ALB egress to the dashboard port, and task
  egress to VPC DNS and required HTTPS destinations.

## [0.2.0] - 2026-07-18

### Added

- Dependabot version updates for npm and GitHub Actions, SonarQube Cloud
  quality-gate enforcement, and Trivy scans for the repository and release
  images before publication.
- A release process that publishes verified API and dashboard images to GHCR
  from `v*` tags and creates the matching GitHub Release automatically.

### Changed

- Removed client-specific references from the public documentation and project graph.
- Updated the delivery toolchain to GitHub Actions v7, ESLint 10, Node.js type
  definitions 26, and TypeScript 6.0.3. TypeScript 7 is intentionally deferred
  until the `typescript-eslint` compatibility range supports it.

### Fixed

- Run the SonarQube Cloud quality gate on pull requests and `master` only,
  avoiding an unsupported duplicate tag-branch analysis during releases.

## [0.1.0] - 2026-07-18

### Added

- Fastify API for configuring targets, running retained HTTP probes, reporting
  SLI, status, latency and Prometheus metrics.
- React/Vite dashboard with automatic refresh, target history, theme support,
  responsive layout and accessibility states.
- `averageLatencyMs` in each target returned by `GET /api/status`.
- Docker `api` and `web` targets, Compose verification and release publishing
  for both GHCR images.
- Architecture knowledge graph and project documentation.

### Changed

- Latency history uses a fixed one-hour rolling timeline rather than evenly
  redistributing retained samples.
- Dashboard reliability and metric indicators use the OKLCH semantic palette.
