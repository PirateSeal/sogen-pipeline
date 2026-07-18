# Release guide

## 0.2.0 readiness

Version 0.2.0 contains the implemented application delivery baseline:

- PR and `master` validation: dependency installation, linting, coverage tests,
  and production builds;
- SonarQube Cloud analysis with a blocking quality gate;
- Trivy filesystem scanning and pre-publication scanning of both release images;
- weekly Dependabot version updates for npm and GitHub Actions;
- release publication to GHCR and a generated GitHub Release for `v*` tags.

Terraform provisions the ECS/Fargate environment after image publication. The
protected `production` environment supplies short-lived AWS credentials through
OIDC; no long-lived AWS key is stored in GitHub.

## Release procedure

1. Ensure `master` is clean and all required checks have passed.
2. Confirm `package.json` and `package-lock.json` carry the intended version.
3. Update `CHANGELOG.md` with the release date and user-visible changes.
4. Create and push the annotated release tag:

   ```bash
   git tag -a v0.2.0 -m "v0.2.0"
   git push origin v0.2.0
   ```

5. Monitor the tag workflow. It builds, verifies, scans, and publishes the API
   and web images before creating the GitHub Release.
6. Approve the production deployment, then verify ECS stability and the HTTPS
   smoke tests on `/healthz` and `/api/status`.
7. Verify the release page, GHCR digests, signatures and attestations.

## Rollback

Do not overwrite release tags. To revert a deployment, select a previously
verified immutable image tag or SHA; to correct a release, publish a new patch
version with its own tag and release notes.
