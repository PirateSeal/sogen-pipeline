# Release guide

## 0.2.0 readiness

Version 0.2.0 contains the implemented application delivery baseline:

- PR and `master` validation: dependency installation, linting, coverage tests,
  and production builds;
- SonarQube Cloud analysis with a blocking quality gate;
- Trivy filesystem scanning and pre-publication scanning of both release images;
- weekly Dependabot version updates for npm and GitHub Actions;
- release publication to GHCR and a generated GitHub Release for `v*` tags.

Terraform and ECS/Fargate deployment are not part of this release. They remain
an explicitly documented follow-up rather than an implied delivery promise.

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
6. Verify the release page and the GHCR version and short-SHA image tags.

SonarQube Cloud quality gates run on pull requests and `master`. The tag points
to a commit that has already passed this gate, so the release workflow does not
submit a duplicate tag analysis.

## Rollback

Do not overwrite release tags. To revert a deployment, select a previously
verified immutable image tag or SHA; to correct a release, publish a new patch
version with its own tag and release notes.
