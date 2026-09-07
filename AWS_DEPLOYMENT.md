# AWS Phase 7 — mecanica-nextjs

Status: prepared locally; deployment and public HTTPS are not verified yet.
Target: https://mecanica.innobyte-it.tech, from `main` only, on the new ARM64 platform in us-east-1.
Infrastructure source of truth: DanielTapia-dev/factupro-infrastructure, TECH_SPEC.md and docs/PHASE7.md.

## Build and validation

```sh
docker build --platform linux/arm64 --target runtime -t mecanica-nextjs:local .
python3 scripts/smoke-image.py mecanica-nextjs:local
```

The smoke uses an isolated Docker network, synthetic runtime settings and no production credentials. The image runs as UID 1000 with a read-only root filesystem, limited memory/CPU and a revision healthcheck at `/.well-known/platform-health`.

## Deployment

The new AWS workflow validates PRs without AWS credentials. An operator dispatches it from `main` after reviewing the exact commit. It builds and tests before assuming the repository/branch-specific OIDC role, publishes an immutable commit image to ECR, requires a completed scan without CRITICAL findings and invokes only the fixed `mecanica-nextjs` SSM deployment document. No permanent access keys, shell commands or secret values are supplied from GitHub.

Infrastructure owns Compose, secret allowlists, ports and rollback state. Enable the rollback-test input after a healthy first deployment. Deploy applications sequentially. After DNS/TLS activation, set repository variable `PUBLIC_HEALTH_URL=https://mecanica.innobyte-it.tech/.well-known/platform-health` and verify the public revision. Never consider an internal healthcheck alone a completed public rollout.

Existing GitHub variables AWS_ACCOUNT_ID, AWS_OIDC_ROLE_ARN and PLATFORM_INSTANCE_ID are used. GitHub publication/configuration and the saved Terraform plan require the owner's concrete approval. Production remains in Heroku until the separately approved migration; do not import its data or deploy another branch during this phase.

## Pending API integration

Publish main at mecanica.innobyte-it.tech. MECANICA_BACKEND_URL is server runtime configuration. FacturacionPruebas/master does not currently implement `/api/mecanica`; those routes exist only in mecanica-back, which the owner explicitly left pending. The frontend may render but authentication/business operations are not accepted as functional until an approved main/master backend provides those routes. Do not merge or deploy mecanica-back to work around this pending integration.
