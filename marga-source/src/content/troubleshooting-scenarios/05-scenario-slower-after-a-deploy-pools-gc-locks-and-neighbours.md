---
title: Scenario: slower after a deploy: pools, garbage collection, locks and neighbours
minutes: 13
summary: Find the cause of a latency regression by comparing before and after: dependency calls, connection pools, garbage collection, lock contention, cache hit rate and noisy neighbours.
---

Latency regressions are rarely a single slow line. They are usually a queue somewhere that filled. The job is to find the queue by looking at where time is spent.

## What you will learn

- Define the regression with percentiles and a baseline
- Where the time goes: traces and breakdowns
- Connection pools and thread pools
- Garbage collection and memory behaviour
- Locks, caches and noisy neighbours

## Define it

Compare the same endpoint before and after, at the same traffic level, using p50, p95 and p99. A change only in the tail points to queuing or pauses. A change in the median points to more work per request. Check traffic first, because a surge can look like a regression.

## Where time goes

Use a trace for a slow request and read the spans: time in the application, in each dependency and waiting. If there is a gap between spans, the request was waiting for a thread, a connection or the scheduler. Compare a slow and a fast trace side by side, and look for the new call or the call that became slower.

## Pools

A connection pool or thread pool that is too small makes requests wait, and one that is too large overloads the database. Look at pool wait time, active and idle counts and rejected requests. A new feature that holds a connection longer, or a leak that never returns one, drains the pool and latency rises with load.

## Garbage collection

In managed runtimes, long or frequent pauses add to the tail. Check pause time and frequency, heap size against the container limit, and allocation rate. A deployment that increased object creation or reduced the heap can move the application into constant collection. Fix allocation or sizing, not the symptom.

## Locks, caches and neighbours

A new lock in a hot path serialises requests. A cache key change can drop the hit rate to near zero and send all load to the database. A noisy neighbour on the same node can take CPU or disk, which shows as throttling or steal time. Check each with a metric before changing code.

```diagram
title: Scenario: slower after a deploy: pools, garbage collection, locks and neighbours
node: base | Before and after | 0 | 1 | Same traffic. | Surge. | observe
node: trace | Trace breakdown | 1 | 1 | Where time goes. | Gaps. | observe
node: pool | Pools and GC | 2 | 1 | Waiting. | Exhausted. | process
node: dep | Dependencies | 3 | 1 | Cache and DB. | Miss. | store
edge: base | trace
edge: trace | pool
edge: pool | dep
```

## Incident: p99 tripled after a harmless change

> **Incident:** A release that changed only a cache key format made the 99th percentile latency three times worse.

```console
$ curl -s localhost:9090/metrics | grep -E "cache_(hits|misses)_total"
cache_hits_total 1204
cache_misses_total 98233
(this is a simulated illustration, not a real incident)
```

The new key format did not match the keys already stored, and a bug added a random part to each key, so almost every lookup missed and went to the database. The database became the queue, and the tail latency rose. The team fixed the key, warmed the cache before the next release and added hit rate to the deployment checks and an alert on a sudden drop.

## Common mistakes

- Comparing at different traffic levels
- Looking only at averages
- Ignoring pool wait time
- Changing code before measuring
- Not checking cache hit rate after key changes

```quiz
Q: What does a tail only change suggest?
+ Queuing or pauses
- A DNS typo :: No.
- A larger image :: No.
- A new colour :: No.
> The median stays the same while a few requests wait.

Q: How can a trace show waiting?
+ Gaps between spans where no work is traced
- Longer file names :: No.
- A smaller log :: No.
- A new span count :: Not meaningful.
> The request waited for a resource.

Q: What can a cache key change cause?
+ A collapse of the hit rate and database overload
- Faster disk :: No.
- More memory :: No.
- Better DNS :: No.
> Check hit rate after changes.

Q: Why compare at the same traffic?
+ Load alone can change latency
- To avoid logs :: No.
- To save money :: No.
- To shorten a meeting :: No.
> Otherwise a surge looks like a regression.
```

```cards
Tail latency :: The slowest share of requests, such as p99
Connection pool :: A set of reusable connections to a service
GC pause :: A time when a runtime stops work to free memory
Noisy neighbour :: A workload that takes shared resources
```
