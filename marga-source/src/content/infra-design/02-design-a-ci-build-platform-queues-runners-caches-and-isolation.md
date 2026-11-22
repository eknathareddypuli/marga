---
title: Design: a CI build platform with queues, runners, caches and isolation
minutes: 13
summary: Design a shared build platform: job queue, autoscaled runners, caching, isolation between tenants, secrets handling and the limits that keep it available.
---

Developers wait on the build platform many times a day. It must be fast, fair and safe, because it runs untrusted code with access to secrets.

## What you will learn

- Requirements and sizing a build farm
- Queue, scheduler and autoscaled runners
- Caches: dependencies, layers and remote build cache
- Isolation and secrets for untrusted code
- Failure modes: queue backlog, cache poisoning and runaway jobs

## Requirements

Assume three thousand builds a day with a peak of ten times the average at the start of working hours. Goals might be that eighty percent of jobs start within one minute and that a failed runner never loses queued work. Non goals might include long running service hosting. Measure queue time and build time separately, because they have different fixes.

## Queue and runners

A job queue holds pending work, and a scheduler assigns it to runners with the right labels. Runners are created on demand, in containers or short lived virtual machines, and removed after use. Keep a warm pool for the morning peak, scale on queue length and set maximum limits so that a loop cannot create thousands of runners.

## Caches

Dependency caches avoid downloading the same packages. Layer caches speed up image builds. A remote build cache shares outputs between jobs and developers. Key caches by content and tool version, keep them near the runners to avoid transfer cost and set a retention policy so that they do not grow without limit.

## Isolation and secrets

Assume that a job can be malicious, because it runs code from pull requests. Use a fresh runner for each job, no shared host directories, restricted network egress and no access to production. Provide short lived credentials through federation and only to protected branches. Never allow forks to read secrets.

## Failure modes

A backlog appears when runners cannot start, so alert on queue wait time. A poisoned cache lets one job affect another, so make caches read only for untrusted jobs. A runaway job can fill disks or run for days, so set time and resource limits. Plan for the failure of the platform itself with a documented emergency path to release.

```diagram
title: Design: a CI build platform with queues, runners, caches and isolation
node: q | Job queue | 0 | 1 | Pending work. | Backlog. | store
node: sch | Scheduler | 1 | 1 | Labels and quotas. | Starved. | process
node: run | Ephemeral runners | 2 | 1 | One job each. | Reused. | service
node: cache | Cache and artifacts | 3 | 1 | Keyed by content. | Poisoned. | store
edge: q | sch
edge: sch | run
edge: run | cache
```

## Incident: Builds waited forty minutes at nine in the morning

> **Incident:** Developers reported that every build was queued for most of the morning.

```console
$ kubectl get pods -n runners --no-headers | awk '{print $3}' | sort | uniq -c
 12 Running
 240 Pending
$ kubectl describe nodes | grep -c "insufficient"
0
(this is a simulated illustration, not a real incident)
```

The autoscaler had a maximum of twelve runner nodes, set when the team was small, and two hundred and forty jobs waited for capacity. The design review added a warm pool for the morning, a scale up rule on queue wait time, raised the limit with a cost cap and a fairness quota per team so that one repository could not take all runners. Queue time fell to under one minute.

## Common mistakes

- Reusing runners between jobs
- Giving fork builds access to secrets
- A scaling limit nobody reviews
- No quotas per team
- Shared caches writable by untrusted jobs

```quiz
Q: Why use a fresh runner per job?
+ It prevents one job from affecting another
- It is cheaper always :: Not the reason.
- It adds logs :: No.
- It disables caches :: No.
> Isolation protects secrets and results.

Q: What should the autoscaler react to?
+ Queue wait time or length
- Disk colour :: No.
- Developer count :: Too indirect.
- Hostnames :: No.
> It shows unmet demand.

Q: How do you protect caches?
+ Key them by content and keep them read only for untrusted jobs
- Share writable to all :: Poisoning risk.
- Turn off logs :: No.
- Use one big file :: No.
> Poisoned caches spread bad output.

Q: Why set job time limits?
+ Runaway jobs waste capacity and money
- To make tests fail :: No.
- To save names :: No.
- To hide errors :: No.
> Limits protect shared resources.
```

```cards
Runner :: A machine or container that runs a build job
Warm pool :: Pre started capacity for expected demand
Remote cache :: A shared store of build outputs
Fairness quota :: A limit that stops one tenant taking all capacity
```
