---
title: Infrastructure design
summary: Design checklist, build platform, registry and recovery objectives.
module: infra-design
---

## Design checklist for infrastructure

| Question | Answer in the document |
|----------|------------------------|
| Who uses it and how much? | Users and numbers |
| What does it not do? | Non goals |
| What fails together? | Blast radius |
| How is it upgraded and rolled back? | Day two plan |
| Who owns it? | Team and on call |

## Build platform

| Part | Design choice |
|------|---------------|
| Runners | Ephemeral, one job each |
| Scaling | On queue wait, warm pool |
| Caches | Keyed by content |
| Secrets | Short lived, protected branches only |

## Registry

| Part | Design choice |
|------|---------------|
| Storage | Object storage, content addressed |
| Reads | Regional replicas and pull through cache |
| Tags | Immutable, deploy by digest |
| Clean up | Dry run, never remove used images |

## Recovery objectives

| Tier | RPO | RTO |
|------|-----|-----|
| Critical | Minutes | Minutes |
| Important | Hours | Hours |
| Internal | One day | One day |

## Handy commands

```bash
kubectl get deploy -A -o wide
```

```bash
kubectl rollout history deploy/NAME
```

```bash
crane digest IMAGE:TAG
```

```bash
aws s3 ls s3://BACKUP_BUCKET/ --human-readable
```

```bash
kubectl get hpa -A
```

```bash
kubectl get pdb -A
```

```bash
dig +short registry.example.com
```

## Watch out for

> **Warning:** A shared service with one replica and no rollback plan will never be upgraded, so plan day two first.

> **Warning:** Reusing runners between jobs lets one job read the leftovers of another.

> **Warning:** Syntax checks do not test routing, so check real routes before widening a rollout.

> **Warning:** A backup that only the production account can delete is not safe from ransomware.
