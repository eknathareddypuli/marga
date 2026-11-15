---
title: Golden paths and paved roads
minutes: 13
summary: A golden path is the supported, well-lit way to build and run a common kind of service. Learn how to choose, design and maintain paths that people take because they are easier, not because they are forced.
---

Every team wants to move fast and nobody wants to rediscover how to set up logging. A golden path, sometimes called a paved road, is the platform's answer: a documented, automated, opinionated way to go from an idea to a running, observable, secure service. It is a path, not a wall. People can step off it when they have a good reason, and they know what they give up when they do.

## What you will learn

- What a golden path contains
- How to choose which paths to build
- How to design for the common case and still allow exits
- How to keep a path alive as technology changes

## What a golden path is made of

A good path covers the whole journey for one kind of workload, for example "a stateless HTTP service in Go" or "a scheduled data job in Python". Typically it includes:

- A repository template with the right layout and tooling
- A pipeline with build, test, scan and deploy steps
- A runtime definition with sensible resources, probes and scaling
- Default logging, metrics, tracing and an initial dashboard
- Security basics such as an image policy and secret handling
- Documentation and an owner field in the catalog

Each piece is something the team would otherwise assemble by hand. Together they mean the first deploy takes an afternoon, not weeks.

## Choose paths by demand

Look at what teams build. If 60 percent of new services are stateless web APIs, build that path first. Do not build a path for a one-off workload. A short list of paths that cover most cases beats a long list that is hard to maintain. A reasonable starting set is: web service, background worker, scheduled job and static or frontend site.

## Opinionated, with exits

A path works because it makes decisions for the user: which language versions, which base image, which pipeline stages, which dashboards. Too many options recreate the problem. But a path with no exit forces teams with unusual needs to fight it or leave. The usual pattern is to make the path the default and supported option, and offer a documented way to customise individual layers, for example adding an extra sidecar or a different build step, while keeping the guardrails that matter: ownership metadata, scanning and observability.

State what support looks like on and off the path. On the path, the platform team handles upgrades and answers questions. Off the path, the team owns more, and the platform may only support the common pieces.

## Make the right thing the easy thing

Do not rely on rules and review to push people onto the path. Rely on convenience. If the path creates a repository, wires the pipeline and shows a green deploy in ten minutes, people will use it. If it needs three tickets, they will not.

## Check what a service has

You can measure how much of a service follows the path by checking its metadata. The snippet below counts which required pieces a service declares.

```python
required = {"owner", "pipeline", "dashboard", "runbook", "slo"}

services = {
    "checkout": {"owner", "pipeline", "dashboard", "runbook", "slo"},
    "search": {"owner", "pipeline", "dashboard"},
    "legacy-report": {"pipeline"},
}

for name, have in services.items():
    missing = sorted(required - have)
    status = "on path" if not missing else "missing " + ", ".join(missing)
    print(f"{name:14} {status}")
```

## Keep the path alive

A path is a product with a lifecycle. Version it. When a language version, base image or library has a security fix, update the template and give existing services an automatic pull request, so they stay current without manual work. Deprecate old versions with a date and a migration guide. Track how many services use each version, because a path that nobody updates becomes a trap.

## Avoid the two failure modes

The first is the abandoned path: built with fanfare, never updated, now a source of outdated defaults. The second is the cage: a path so rigid that every real need requires an exception. Review exceptions regularly. A repeated exception is a signal to improve the path.

```diagram
title: A golden path for a web service
node: tmpl | Template | 0 | 1 | Repository with layout, tests and tooling. | Outdated language or base image. | store
node: ci | Pipeline | 1 | 1 | Build, test, scan and deploy. | Steps copied and edited by hand. | process
node: run | Runtime | 2 | 1 | Defaults for resources, probes and scaling. | Defaults that do not fit the workload. | service
node: obs | Observability | 3 | 0 | Logs, metrics, traces and a dashboard. | A dashboard nobody looks at. | observe
node: sec | Security | 3 | 2 | Image policy and secret handling. | Checks that can be skipped silently. | security
node: own | Catalog entry | 4 | 1 | Owner, tier and runbook link. | Metadata that is never filled in. | store
edge: tmpl | ci
edge: ci | run
edge: run | obs
edge: run | sec
edge: obs | own
edge: sec | own
```

## Incident: The cage and the escape

> **Incident:** A golden path allowed only one language version. A team needing a newer runtime for a security fix could not get it, so it built its own pipeline.

```console
$ platformctl path status web-service
path version:    3.2
runtime pinned:  17
services on 3.2: 41
services off path: 9 (7 cite "runtime version")
(this is a simulated illustration, not a real incident)
```

The platform team saw that nine services had left the path and seven gave the same reason. They added a supported choice of two runtime versions, with an automatic upgrade pull request for the older one. Within two months most of the nine had come back, because staying on the path was now easier than maintaining their own pipeline.

## Common mistakes

- Building a path for a workload only one team has
- Giving the path no exit, so teams leave it entirely
- Forgetting to update templates after launch
- Counting services that used the template once as "on the path" years later
- Measuring paths by how many rules they enforce instead of how fast they get people to production

```quiz
Q: What is a golden path?
+ A supported, automated way to build and run a common kind of workload
- A rule that forbids all other approaches :: It is a default, not a ban.
- A single dashboard :: It covers the full journey.
- A list of banned tools :: It is positive, not only restrictive.
> It gives teams a ready-made route with sensible defaults, and room to step off.

Q: How should you choose which paths to build first?
+ By the kinds of workloads most teams build
- By which technology is newest :: That ignores demand.
- By what the platform team enjoys :: That is a bias.
- By random choice :: No basis.
> Demand shows where a path will be reused most.

Q: What keeps a path from becoming a trap over time?
+ Versioning, automatic update pull requests and dated deprecations
- Never changing it :: Dependencies age and become unsafe.
- Letting each team edit its own copy freely :: Copies drift apart.
- Removing the documentation :: It makes things worse.
> Paths need a lifecycle like any product.

Q: Why offer a documented way to customise a path?
+ So teams with unusual needs stay on supported ground instead of leaving
- To remove all guardrails :: Key guardrails stay.
- To make the path less useful :: The aim is the opposite.
- To avoid owning the path :: The platform team still owns it.
> Exits with limits keep the benefits while allowing real variation.
```

```cards
Golden path :: A supported, opinionated way to take a common workload from idea to production
Paved road :: Another name for a golden path, emphasising that it is smooth but optional
Exit :: A documented way to customise or leave a path while keeping key guardrails
Path version :: A numbered release of a template and pipeline that services can upgrade to
Off-path service :: A service that does not follow the supported path and owns more of its own setup
```
