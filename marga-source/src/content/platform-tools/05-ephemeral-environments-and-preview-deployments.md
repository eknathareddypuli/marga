---
title: Ephemeral environments and preview deployments
minutes: 12
summary: Give every pull request its own short lived environment: namespaces, virtual clusters, data seeding, cost limits and automatic cleanup.
---

Shared staging is where changes wait in a queue. Ephemeral environments let each change be tested alone, then disappear, if you control cost and data.

## What you will learn

- Why ephemeral environments
- Namespace, virtual cluster or full cluster
- Data: seeds, snapshots and masked copies
- Cost limits and automatic cleanup
- Developer experience and links in the pull request

## Why

A shared staging environment causes conflicts, stale data and waiting. A preview environment per pull request lets reviewers click a URL, tests run against clean state and bugs found do not block others. It works best when environments are cheap and automatic.

## Isolation level

A namespace per environment is cheap, but cluster wide resources and CRDs are shared. A virtual cluster, for example with vcluster, gives each environment its own API server inside a host cluster, with better isolation for tests that change cluster scoped objects. A whole cluster per environment is the strongest and the most costly.

## Data

Environments need realistic data without real customer data. Seed from generated fixtures, restore snapshots of masked production copies or use database branching. Never copy raw production data into a place with weaker access controls.

## Cost and cleanup

Set time to live on every environment, scale to zero when idle, apply resource quotas and use cheap node pools. A pull request that closes must delete its environment. Run a reaper job that removes anything without an owner or past its time limit, and report the cost of previews.

## Experience

Post the URL, status and logs link as a comment on the pull request. Keep creation under a few minutes by using cached images and pre warmed pools. Share one template for all teams, so a new service gets previews through the golden path.

```diagram
title: Ephemeral environments and preview deployments
node: pr | Pull request | 0 | 1 | Triggers it. | Closed, not cleaned. | external
node: env | Preview environment | 1 | 1 | Namespace or vcluster. | Shared state. | service
node: data | Masked data | 2 | 1 | Seeded. | Real data. | store
node: reap | Reaper and quotas | 3 | 1 | Cleanup. | Missing. | observe
edge: pr | env
edge: env | data
edge: env | reap
```

## Incident: A preview bill that grew every week

> **Incident:** Preview environments from closed pull requests were never deleted and quietly used nodes.

```console
$ kubectl get ns -l type=preview --no-headers | wc -l
312
$ kubectl get ns -l type=preview -o jsonpath="{.items[0].metadata.creationTimestamp}"
2026-05-02T09:14:00Z
(this is a simulated illustration, not a real incident)
```

The cleanup step ran only when a pull request merged, so abandoned and closed pull requests left their environments behind. The team added a time to live label, a reaper job that deletes environments older than three days or without an open pull request, and quotas per team with a weekly cost report.

## Common mistakes

- No time to live on environments
- Copying raw production data
- Cleanup only on merge
- Shared databases between previews
- No quotas per team

```quiz
Q: Why use preview environments?
+ Each change is tested in isolation without queueing
- To increase cost :: No.
- To avoid review :: No.
- To skip tests :: No.
> Cheap and automatic.

Q: What does a virtual cluster give?
+ A separate API server inside a host cluster
- A new cloud account :: No.
- A new database :: No.
- A new DNS zone :: No.
> Better isolation than a namespace.

Q: What data should previews use?
+ Generated or masked data
- Raw customer data :: Unsafe.
- No data :: Not useful.
- Production writes :: Dangerous.
> Protect privacy.

Q: What prevents runaway cost?
+ Time to live, quotas and a reaper job
- Longer environments :: Opposite.
- More previews :: Opposite.
- No limits :: Opposite.
> Delete by default.
```

```cards
Preview environment :: A short lived environment for one change
vcluster :: A virtual cluster inside another cluster
Time to live :: Maximum lifetime of a resource
Reaper :: A job that removes expired resources
```
