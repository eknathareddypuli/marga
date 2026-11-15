---
title: Environments, ephemeral previews and multi-tenancy
minutes: 14
summary: Give teams isolated places to build and test without a cluster each: namespaces and quotas, per-change preview environments, clear promotion rules and cleanup that actually runs.
---

Teams need somewhere to run their code before production. Too few environments and people step on each other. Too many and the cloud bill and the maintenance work balloon. A platform decides how environments are shared, how isolated they are and how they are created and removed.

## What you will learn

- Choices for sharing clusters between teams
- How namespaces, quotas and policies create soft isolation
- Ephemeral preview environments for each change
- Promotion paths and cleanup

## Shared or separate

The main choices, from cheapest to most isolated, are:

| Model | Isolation | Cost and effort |
|---|---|---|
| Namespace per team on a shared cluster | Soft, enforced by policy | Lowest |
| Virtual clusters per team | Separate API server, shared nodes | Medium |
| Cluster per team or per environment | Hard, separate control planes | Highest |

Most platforms start with namespaces and move teams to stronger isolation when risk or scale demands it, for example for regulated workloads. The Kubernetes documentation on multi-tenancy describes the control plane and data plane concerns for each model.

## Making namespaces behave like tenants

A namespace by itself is only a naming boundary. To make it a tenant, add:

- **RBAC** so a team can manage only its own namespaces
- **Resource quotas and limit ranges** so one team cannot consume the whole cluster
- **Network policies** with default deny between namespaces, and explicit allows
- **Pod security standards** to restrict dangerous pod settings
- **Default labels** for owner and cost allocation

The platform should create all of this when a team onboards, from one definition, so every tenant starts identical.

## Ephemeral preview environments

A preview environment is a short-lived copy of the application created for a pull request, reachable on its own URL, and deleted when the pull request closes. Reviewers and testers see the change running. Compared with a shared staging environment, previews remove the queue for "who is using staging" and catch integration problems earlier.

To make previews practical:

- Keep them small: use reduced replicas and small databases, or seed data
- Create them from the same manifests as other environments, with parameters
- Give them a time limit and delete them automatically
- Isolate their data, and never copy production data without masking
- Tag every resource with the pull request and owner so cost and cleanup are traceable

## Promotion paths

Define how a change moves from development to production: the stages, the checks at each, and what is different. Avoid environment-specific code. Differences should be configuration, not branches. A change should be the same artifact at every stage, so what you tested is what you ship.

## Cleanup is a feature

Forgotten environments are one of the largest sources of wasted spend and a security risk, because old environments are rarely patched. Run an automatic job that finds environments past their expiry or without an owner and removes them, with a warning first.

```python
from datetime import date, timedelta

today = date(2026, 11, 14)
envs = [
    {"name": "pr-412", "owner": "team-search", "expires": date(2026, 11, 16)},
    {"name": "pr-377", "owner": "team-search", "expires": date(2026, 10, 30)},
    {"name": "demo-old", "owner": None, "expires": None},
]

for e in envs:
    if not e["owner"] or not e["expires"]:
        print(e["name"], "no owner or expiry: warn and schedule removal")
    elif e["expires"] < today:
        print(e["name"], "expired", (today - e["expires"]).days, "days ago: delete")
    elif e["expires"] - today < timedelta(days=3):
        print(e["name"], "expires soon: notify owner")
    else:
        print(e["name"], "ok")
```

## When soft isolation is not enough

Namespaces share a kernel, nodes and often a control plane. If tenants are untrusted, handle sensitive data or must meet strict compliance, use stronger isolation: separate node pools, sandboxed runtimes, virtual clusters or separate clusters. Decide this from a threat model, not from convenience.

```diagram
title: A tenant and its environments
node: onb | Team onboarding | 0 | 1 | One definition creates the tenant. | Manual setup that differs per team. | process
node: ns | Namespaces and quotas | 1 | 1 | Isolation, limits and default labels. | Missing network policy. | security
node: pr | Preview environments | 2 | 0 | One per pull request, deleted on close. | Never cleaned up. | process
node: stg | Shared staging | 2 | 2 | Integration tests before release. | Everyone fights for it. | service
node: prod | Production | 3 | 1 | Same artifact, different configuration. | Environment-specific code. | store
node: gc | Cleanup job | 4 | 1 | Removes expired or ownerless environments. | Not running, or too gentle. | observe
edge: onb | ns
edge: ns | pr
edge: ns | stg
edge: pr | prod
edge: stg | prod
edge: gc | pr
edge: gc | stg
```

## Incident: The preview that outlived the pull request

> **Incident:** A cloud bill jumped by 18 percent over two months. The cause was hundreds of preview environments that nobody deleted.

```console
$ platformctl envs --older-than 14d --count
preview environments older than 14d: 312
estimated monthly cost: 9,400
owners missing: 41
(this is a simulated illustration, not a real incident)
```

The preview workflow created environments on pull request open but relied on a webhook to delete them on close, and the webhook silently failed for merged branches. The team added a time-to-live label to every preview, a nightly sweep that deleted anything expired, and a weekly report of the count and cost, so the next leak would show up in days.

## Common mistakes

- Treating a namespace as a security boundary without quotas, policies and RBAC
- Creating environments by hand with different settings
- Allowing previews with no expiry
- Copying unmasked production data into test environments
- Using code branches instead of configuration to handle environment differences

```quiz
Q: What turns a namespace into a usable tenant boundary?
+ RBAC, quotas, network policies, pod security rules and default labels
- Only a unique name :: That is a label, not a control.
- A larger node :: Unrelated.
- A different programming language :: Unrelated.
> Isolation comes from the controls applied to the namespace.

Q: What is a preview environment?
+ A short-lived copy of the app for one change, deleted when the change closes
- A permanent copy of production :: That is not short-lived.
- A backup of the database :: Different purpose.
- A developer laptop :: Not a platform environment.
> It lets reviewers see a change running without a shared staging queue.

Q: Why should differences between environments be configuration, not code?
+ So the artifact you tested is the artifact you ship
- Because configuration is secret :: Not the reason.
- To make builds slower :: It does not.
- To avoid version control :: It uses version control.
> One artifact with different settings keeps testing meaningful.

Q: When is namespace-level isolation not enough?
+ For untrusted tenants, sensitive data or strict compliance
- For a small internal team on a development cluster :: Soft isolation usually suffices.
- When there are no quotas :: Add quotas instead.
- Never, namespaces are always enough :: They share a kernel and nodes.
> Stronger isolation is justified by threat model and compliance, not convenience.
```

```cards
Tenant :: A team or customer that shares platform infrastructure with others
Soft isolation :: Separation enforced by policy on shared infrastructure
Preview environment :: A temporary environment created for one change and removed afterwards
Time to live :: A label or setting that says when something should be deleted
Promotion :: Moving the same artifact through environments toward production
```
