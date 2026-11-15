---
title: The anatomy of an internal developer platform
minutes: 14
summary: See the layers of an internal developer platform: developer control, delivery, resource orchestration, monitoring and security, and how they connect so that one request creates a working, governed service.
---

An internal developer platform, or IDP, is not one product. It is a set of layers that together let a developer ask for something and get a safe, working result. Understanding the layers helps you decide what to build, what to buy and where the seams will hurt.

## What you will learn

- The main planes of a platform and what each does
- How a single request flows through them
- Where open source tools commonly fit
- How to avoid rebuilding everything at once

## The planes

Reference architectures from the CNCF and from vendors describe slightly different layers, but the idea is stable. A useful five-part view is:

| Plane | Purpose | Examples of what lives here |
|---|---|---|
| Developer control | Where people ask for things | Portal, command line, templates, catalog |
| Integration and delivery | Turns code into running software | Source control, pipelines, registries, deployment tools |
| Resource orchestration | Creates the infrastructure behind requests | Infrastructure as code, Crossplane, operators, cluster provisioning |
| Monitoring and logging | Shows what is happening | Metrics, logs, traces, dashboards, alerts |
| Security | Controls identity, secrets and policy | Identity provider, secret store, policy engine, scanners |

The labels vary, but a request always touches all of them: a developer asks for a service, a pipeline builds it, infrastructure appears, monitoring is wired up and security checks run.

## Follow one request

Suppose a developer wants a new web service with a database.

1. They pick a template in the portal and fill in a name and owner.
2. The platform creates a repository and registers the service in the catalog.
3. The pipeline builds the first version, scans it and deploys to a development environment.
4. A resource request creates a database through the orchestration layer, with credentials stored in the secret store.
5. Default dashboards and alerts appear because the template declared them.
6. Policy checks confirm the service has an owner, resource limits and an approved image.

If any step needs a ticket, the platform has a gap. Mapping a request like this is a good way to find the gaps.

## A catalog at the centre

Most successful platforms keep a catalog: a record of every service, its owner, its dependencies and its tier. The catalog is what other planes read. The pipeline reads the owner to route failures. Monitoring reads the tier to set alert severity. Policy reads the data class to decide what is allowed. Without it, each tool keeps its own incomplete picture.

## Compose, do not monolith

You do not need to build a platform in one go, and you rarely need to build every layer yourself. Most platforms are composed of existing tools with a thin layer of glue and a good front door. Decide, for each capability, whether to build, buy or adopt open source, and write down why. The seams between tools are where reliability and user experience break, so spend your effort there.

## Standards at the seams

Use open standards where they exist so that parts can be replaced: container images and registries follow OCI specifications, telemetry can use OpenTelemetry, deployments can be declared as Kubernetes resources, and identity can use OpenID Connect. Each standard lowers the cost of changing one part later.

## Model the platform's contract

Describe each capability as a contract: what the user asks for, what they get, what the service level is and who to contact. The snippet below checks that a list of capabilities has the fields a contract needs.

```python
capabilities = [
    {"name": "new-service", "input": "template, name, owner", "output": "repo, pipeline, dev env", "slo": "ready in 15 minutes", "owner": "platform-delivery"},
    {"name": "database", "input": "engine, size, env", "output": "instance and secret", "slo": "ready in 10 minutes", "owner": "platform-data"},
    {"name": "dashboard", "input": "service", "output": "default dashboard"},
]

need = {"name", "input", "output", "slo", "owner"}
for c in capabilities:
    gap = sorted(need - set(c))
    print(c["name"], "complete" if not gap else "missing " + ", ".join(gap))
```

```diagram
title: One request across the planes
node: ctl | Developer control | 0 | 1 | Portal, command line and templates. | A form that does not match what the system accepts. | service
node: cat | Catalog | 1 | 0 | Owners, tiers and dependencies. | Stale or incomplete records. | store
node: del | Delivery | 2 | 1 | Pipeline, registry and deployment. | Skipped checks. | process
node: res | Resource orchestration | 3 | 1 | Infrastructure created on request. | Resources with no owner. | process
node: mon | Monitoring | 3 | 3 | Dashboards and alerts from defaults. | Alerts with no routing. | observe
node: sec | Security and policy | 2 | 3 | Identity, secrets and rules. | Rules applied in one plane only. | security
edge: ctl | cat
edge: ctl | del
edge: del | res
edge: res | mon
edge: cat | sec
edge: sec | del
```

## Incident: The ticket hidden in the flow

> **Incident:** A new platform advertised "service in 15 minutes", yet teams reported waiting days. Nobody could say where the time went.

```console
$ platformctl trace new-service req-5530
portal-submit       00:00
repo-created        00:02
pipeline-first-run  00:09
database-requested  00:12
database-approved   2d 04:10   (manual approval)
(this is a simulated illustration, not a real incident)
```

Tracing one request showed that the database step waited for a manual approval by a person in another team. The platform team agreed a size limit and an automatic approval for small development databases, kept human review for production, and the end-to-end time for the common case dropped to under twenty minutes.

## Common mistakes

- Building every plane before any user has tried the first one
- Keeping no catalog, so each tool has its own partial picture
- Ignoring hand-offs and manual approvals in the middle of a flow
- Locking into a tool with no standard interface
- Describing capabilities by technology instead of by what users get

```quiz
Q: What does the developer control plane provide?
+ The front door where people request and see things
- The physical servers :: Those are infrastructure.
- Only dashboards :: Dashboards live in monitoring.
- The billing system :: Unrelated.
> It is the portal, command line and templates users interact with.

Q: Why keep a catalog at the centre of a platform?
+ Other planes read it for owners, tiers and dependencies
- It replaces all monitoring :: It supports monitoring, not replaces it.
- It stores container images :: That is a registry.
- It makes tickets unnecessary by itself :: Automation does that.
> A shared record keeps every plane consistent about who owns what.

Q: How can you find gaps in a platform?
+ Trace one request end to end and look for manual hand-offs
- Count the number of tools :: A count does not show waits.
- Ask only the platform team :: Users know where they wait.
- Wait for incidents :: Tracing finds issues earlier.
> End-to-end tracing of a real request exposes hidden tickets and waits.

Q: Why prefer open standards at the seams between tools?
+ They make each part easier to replace later
- They remove the need for testing :: Testing remains.
- They guarantee faster pipelines :: Not necessarily.
- They make the platform free :: Cost is separate.
> Standards reduce lock-in and integration work.
```

```cards
IDP :: Internal developer platform, a set of layers that let developers request governed infrastructure and delivery
Plane :: A layer of the platform with one purpose, such as delivery or monitoring
Software catalog :: A record of services, owners, tiers and dependencies used by other tools
Seam :: The boundary between two tools where integration problems occur
Platform contract :: What a capability accepts, delivers and promises, with an owner
```
