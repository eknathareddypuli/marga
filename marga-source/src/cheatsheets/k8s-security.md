---
title: Kubernetes security
summary: RBAC audit commands, Pod Security labels, hardening flags and incident response steps.
module: k8s-security
---

## Quick RBAC audit

| Job | Command |
|-----|---------|
| What can a user do | `kubectl auth can-i --list --as=USER -n NS` |
| Who can read secrets | `kubectl auth can-i get secrets --as=USER -n NS` |
| Find broad bindings | `kubectl get clusterrolebindings -o wide` |
| Wildcard rules | `kubectl get clusterroles -o yaml | grep -B3 '\*'` |

## Pod Security labels

| Label | Meaning |
|-------|---------|
| `pod-security.kubernetes.io/enforce` | Reject pods that break the standard |
| `pod-security.kubernetes.io/audit` | Record violations |
| `pod-security.kubernetes.io/warn` | Show warnings to the user |

## Hardening checks

| Control | Check |
|---------|-------|
| Anonymous API access | `--anonymous-auth=false` |
| Authorization modes | `--authorization-mode=Node,RBAC` |
| Kubelet anonymous | `anonymous: enabled: false` in the kubelet config |
| Audit logging | `--audit-policy-file` and `--audit-log-path` |
| Benchmark | `kube-bench run --targets master,node` |

## Incident basics

| Step | Action |
|------|--------|
| Contain | Quarantine label, deny policy, cordon the node |
| Preserve | Copy logs and snapshot the node disk |
| Rotate | Tokens, secrets and cloud keys the pod could reach |
| Rebuild | Known good image and clean node |

## Handy commands

```bash
kubectl auth can-i --list --as=system:serviceaccount:NAMESPACE:NAME
```

```bash
kubectl get ns --show-labels | grep pod-security
```

```bash
kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext}{"\n"}{end}'
```

```bash
kubectl get networkpolicy -A
```

```bash
kubectl get clusterrolebindings -o wide
```

```bash
kubectl get sa -A
```

```bash
kubectl get ns --show-labels
```

## Watch out for

> **Warning:** Do not grant cluster-admin to make an error go away, because the grant tends to stay.

> **Warning:** A privileged pod can reach the host, so deny it with Pod Security admission.

> **Warning:** Secrets are encoded, not encrypted, unless encryption at rest is enabled.

> **Warning:** Default service account tokens should not be mounted into pods that do not call the API.
