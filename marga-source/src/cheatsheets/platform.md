---
title: Platform engineering
summary: Platform as a product, golden path checklist, catalog descriptor, self-service design, guardrails, cost labels and measures.
module: platform
---

## Roles compared

| Role | Main question | Typical output |
|------|---------------|----------------|
| DevOps | How do build and run work together? | Shared practice and culture |
| SRE | How reliable is the service? | SLOs, error budgets, incident process |
| Platform | How can teams ship safely with less effort? | A self-service internal product |

## Golden path checklist

| Item | Check |
|------|-------|
| Demand | Many teams do this job repeatedly |
| Defaults | Secure, observable and cost-labelled out of the box |
| Escape | A documented way to customise |
| Updates | Pushed as pull requests, versioned |
| Evidence | Time to first deploy measured |

## Catalog descriptor fields

| Field | Why it matters |
|-------|----------------|
| owner | Who gets the page and the questions |
| lifecycle | Experimental, production or deprecated |
| tier | How critical the service is |
| dependsOn | What breaks if it fails |
| links | Runbook, dashboard, repository |

## Self-service design rules

| Rule | Reason |
|------|--------|
| Ask few questions | Fewer wrong answers |
| Validate before creating | Failures happen early and cleanly |
| Make steps idempotent | A retry cannot duplicate or corrupt |
| Report failure to the requester | Nobody waits in silence |
| Test the template in CI | A broken template breaks every new service |

## Policy rollout

| Stage | Behaviour |
|-------|-----------|
| Audit | Record violations only |
| Warn | Show a message with the fix |
| Enforce | Reject, with a clear message and a time-limited exception route |

## Cost labels

| Label | Use |
|-------|-----|
| owner | Which team pays |
| service | Which product it supports |
| environment | Production, staging or preview |
| expires | When a preview should be removed |

## Measures

| Measure | Reads as |
|---------|----------|
| Deployment frequency | How often value ships |
| Lead time for changes | How fast a change reaches production |
| Change failure rate | How often a change causes harm |
| Time to restore | How fast service recovers |
| Time to first deploy | How easy the platform is for a new service |

## Handy commands

```bash
kubectl get ns --show-labels
```

```bash
kubectl get resourcequota -A
```

```bash
argocd app list
```

```bash
terraform plan -detailed-exitcode
```

```bash
kubectl get ingress -A
```

```bash
kubectl get applications -n argocd
```

```bash
kubectl get certificates -A
```

```bash
kubectl get ns --show-labels
```

```bash
kubectl get resourcequota -A
```

## Watch out for

> **Warning:** A platform nobody asked for becomes shelfware, so start from user problems.

> **Warning:** Golden paths that cannot be left force teams to work around the platform.

> **Warning:** Measure adoption and satisfaction, not only uptime of the platform.

> **Warning:** Never ship a platform change to every team at once.
