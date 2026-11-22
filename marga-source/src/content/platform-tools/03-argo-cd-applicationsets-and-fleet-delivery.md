---
title: Argo CD ApplicationSets and fleet delivery
minutes: 13
summary: Deliver to many clusters and environments with Argo CD ApplicationSets, generators, sync waves and progressive rollout, and keep the fleet understandable.
---

One Argo CD application per service per cluster does not scale. ApplicationSets generate them from a list, a folder structure or a set of clusters, so a hundred clusters are not a hundred hand written files.

## What you will learn

- The hub and spoke model for many clusters
- ApplicationSet generators: list, git and cluster
- Sync waves, hooks and ordering
- Progressive rollout across the fleet
- Access, secrets and failure handling

## Hub and spoke

A central Argo CD instance, or a few of them, manages applications in many target clusters registered as destinations. This gives one place to see the state of the fleet. Consider the blast radius: a failed central instance stops deployments everywhere, so plan its availability and keep clusters able to run without it.

## Generators

An ApplicationSet uses a template and generators to create applications. A list generator takes explicit values, a git generator creates one application per directory or file in a repository, and a cluster generator creates one per registered cluster that matches labels. A matrix generator combines two, for example every service on every production cluster.

## Ordering

Sync waves order resources inside an application, for example namespaces and CRDs before the workloads that use them. Hooks run jobs before or after a sync, such as a database migration. Keep waves few and simple, because complex ordering is hard to debug.

## Progressive rollout

Do not push a change to every cluster at once. Use rolling sync strategies in ApplicationSets or separate labels for rings: a canary cluster, then a small group, then the rest, with health checks between steps. Pause the rollout automatically when an application becomes degraded.

## Access and secrets

Give teams access to their own projects and destinations through AppProjects and RBAC, and restrict which repositories and clusters each project can use. Keep secrets out of manifests by using an external secrets operator or sealed secrets. Alert on out of sync and degraded applications.

```diagram
title: Argo CD ApplicationSets and fleet delivery
node: git | Config repository | 0 | 1 | Folders per env. | Wrong merge. | store
node: as | ApplicationSet | 1 | 1 | Generators. | Over broad. | process
node: hub | Argo CD hub | 2 | 1 | Syncs. | Single point. | service
node: cl | Cluster fleet | 3 | 1 | Rings. | All at once. | service
edge: git | as
edge: as | hub
edge: hub | cl
```

## Incident: A bad change that reached every cluster in minutes

> **Incident:** A broken ingress setting was merged and an ApplicationSet synced it to forty clusters at once.

```console
$ argocd app list -o name | wc -l
120
$ argocd app list --sync-status OutOfSync -o name | wc -l
40
(this is a simulated illustration, not a real incident)
```

The ApplicationSet used a cluster generator for all production clusters with automated sync, so one merge changed everything at once. The team added rollout rings by cluster label, a canary ring with health gates, manual approval for the final ring, and an automatic pause when applications became degraded.

## Common mistakes

- Syncing every cluster at once
- One broad AppProject for everyone
- Secrets stored in manifests
- Complex sync wave chains
- No plan for the hub being unavailable

```quiz
Q: What does an ApplicationSet do?
+ Generates many applications from a template and generators
- Builds images :: No.
- Stores secrets :: No.
- Replaces Kubernetes :: No.
> Scale without copy paste.

Q: What does a cluster generator use?
+ Registered clusters matched by labels
- Only one cluster :: No.
- Image tags :: No.
- Branch names only :: No.
> Labels select targets.

Q: How do you roll out safely to a fleet?
+ In rings with health checks between steps
- All at once :: Risky.
- Randomly :: Not controlled.
- Without checks :: Unsafe.
> Canary first. Review the matching section of this lesson if it is unclear.

Q: What should hold secrets?
+ An external secrets operator or sealed secrets
- Plain manifests :: Unsafe.
- The ApplicationSet :: No.
- Chat :: No.
> Keep them out of git.
```

```cards
ApplicationSet :: A template that generates Argo CD applications
Sync wave :: Ordering of resources in a sync
AppProject :: A boundary for repositories and clusters
Ring :: A group of clusters updated together
```
