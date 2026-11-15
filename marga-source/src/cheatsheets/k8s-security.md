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
