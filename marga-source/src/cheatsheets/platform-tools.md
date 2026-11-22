---
title: Platform engineering tooling
summary: Tool roles, safe defaults and measures.
module: platform-tools
---

## Tool roles

| Tool | Job |
|------|-----|
| Backstage | Catalog, templates, docs |
| Crossplane | Self service infrastructure APIs |
| Argo CD | Delivery to many clusters |
| Cluster API | Cluster lifecycle |
| vcluster | Preview environments |

## Safe defaults

| Area | Rule |
|------|------|
| Deletion policy | Orphan for important data |
| Rollout | Rings with health gates |
| Previews | Time to live and quotas |
| Provider versions | Pinned |

## Measures

| Measure | Use |
|---------|-----|
| Deployment frequency and lead time | Speed |
| Change failure rate and time to restore | Stability |
| Time to first deploy | Onboarding |
| Survey | Friction |

## Handy commands

```bash
kubectl get applicationsets -n argocd
```

```bash
argocd app list
```

```bash
kubectl get composite
```

```bash
clusterctl describe cluster NAME
```

```bash
kubectl get providers.pkg.crossplane.io
```

```bash
argocd appset list
```

```bash
kubectl get clusters.cluster.x-k8s.io -A
```

## Watch out for

> **Warning:** The default Delete policy on a composition can remove a production database with its namespace.

> **Warning:** An ApplicationSet with automated sync on every cluster spreads a bad change in minutes, so use rings.

> **Warning:** Backstage entities with no valid owner destroy trust in the portal.

> **Warning:** Preview environments with no time to live become permanent cost.
