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

## Handy commands

```bash
trivy image IMAGE
```

```bash
syft IMAGE -o spdx-json
```

```bash
cosign verify IMAGE --certificate-identity ID --certificate-oidc-issuer URL
```

```bash
kubectl get pods -A -o jsonpath='{.items[*].spec.containers[*].image}'
```

```bash
kubectl get validatingadmissionpolicies
```

```bash
kubectl get pods -A -o wide
```

```bash
cosign tree IMAGE
```

## Watch out for

> **Warning:** Audit mode only records violations, so move to enforce after a clean report.

> **Warning:** Tags can move, so deploy by digest and verify the signature of that digest.

> **Warning:** A scan that nobody owns produces a report and no fix, so assign owners and deadlines.

> **Warning:** Trusting every image in a registry defeats signing, so verify the identity of the signer.
