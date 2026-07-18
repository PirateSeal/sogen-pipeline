# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Dependabot version updates for npm and GitHub Actions, SonarQube Cloud
  quality-gate enforcement, and Trivy scans for the repository and release
  images before publication.

### Changed

- Removed client-specific references from the public documentation and project graph.

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
