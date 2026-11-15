---
title: Supply chain and runtime security
summary: Supply chain controls, scan, sign and verify commands, and pod hardening.
module: k8s-supply-chain
---

## Supply chain controls

| Stage | Control |
|-------|---------|
| Source | Branch protection, signed commits, reviews |
| Build | Hosted builder, provenance, pinned bases |
| Registry | Immutable tags, scanning, signatures |
| Deploy | Admission policy that verifies signatures |
| Run | Falco, seccomp, RuntimeClass |

## Commands

| Job | Command |
|-----|---------|
| Scan image | `trivy image IMAGE` |
| Create SBOM | `syft IMAGE -o spdx-json` |
| Sign | `cosign sign IMAGE@sha256:DIGEST` |
| Verify | `cosign verify IMAGE --certificate-identity ID --certificate-oidc-issuer URL` |

## Pod hardening

| Setting | Value |
|---------|-------|
| seccompProfile | RuntimeDefault |
| runAsNonRoot | true |
| allowPrivilegeEscalation | false |
| runtimeClassName | gvisor for untrusted code |
