---
title: Design: a registry and artifact distribution service
minutes: 13
summary: Design a container and package registry for many teams: storage, replication, pull through caching, immutability, retention and keeping deployments independent from registry outages.
---

Every deployment pulls from a registry. If it is slow or down, you cannot scale, replace failed nodes or roll back, so it deserves the same care as a database.

## What you will learn

- Requirements and sizing: storage, pulls and bandwidth
- Architecture: object storage, metadata and a content cache
- Replication and pull through caches
- Immutability, signing and retention
- Failure modes: outage during scale up, rate limits and storage growth

## Requirements

Estimate the number of images and their size, pushes per day and, more importantly, pulls. A cluster of five hundred nodes pulling a one gigabyte image at once is half a terabyte of traffic. State goals such as availability for pulls higher than for pushes, and a pull time target. Existing images must remain available for rollback.

## Architecture

Store layers in durable object storage and metadata in a database, behind stateless registry servers with a balancer. Layers are content addressed, so they can be cached safely and shared between images. Separate the read path from the write path so that a push storm does not slow pulls.

## Replication and caches

Replicate to each region or cluster so that pulls stay local and survive the loss of a region. A pull through cache stores images from external registries, which protects against upstream outages and rate limits. Warm caches or pre pull large images to nodes before a big rollout, and use a peer to peer layer sharing option for very large fleets.

## Immutability and retention

Make tags immutable in production repositories, deploy by digest and sign images at build. Set retention rules to remove untagged and old images but never the ones referenced by running workloads or recent releases. Check what is in use before running a clean up, and run the clean up with a dry run first.

## Failure modes

If the registry is down during a scale up, new nodes cannot start pods. Keep a node level cache and a second read replica. External rate limits can block a cluster, so pull through and authenticate. Storage grows steadily, so track it per team and charge back. Test restoring the registry from backups and the loss of one region.

```diagram
title: Design: a registry and artifact distribution service
node: push | Push path | 0 | 1 | CI builds. | Storm. | service
node: reg | Registry servers | 1 | 1 | Stateless. | Down. | service
node: obj | Object storage | 2 | 1 | Content addressed. | Growth. | store
node: pull | Pull caches | 3 | 1 | Regional. | Cold. | service
edge: push | reg
edge: reg | obj
edge: obj | pull
```

## Incident: A scale up that could not pull images

> **Incident:** During a traffic peak, new pods stayed in image pull for ten minutes.

```console
$ kubectl get events -n shop --field-selector reason=Failed | tail -2
Failed to pull image: toomanyrequests: You have reached your pull rate limit
$ kubectl get pods -n shop --no-headers | grep -c ImagePullBackOff
38
(this is a simulated illustration, not a real incident)
```

The deployment used a base image from a public registry that limited anonymous pulls per address, and all nodes shared a few outgoing addresses, so the limit was reached at the worst time. The platform team added an authenticated pull through cache in each cluster, mirrored the critical base images into the internal registry and added an alert on pull failures. The next scale up pulled from the local cache.

## Common mistakes

- Relying on a public registry in production
- Mutable tags for production images
- Clean up that removes images still in use
- One region with no replica
- No pre pull before large rollouts

```quiz
Q: Why deploy by digest?
+ A digest identifies exact content and cannot change
- It is shorter :: No.
- It is encrypted :: No.
- It adds a tag :: No.
> Tags can move, but a digest cannot, so it is a safe handle.

Q: What does a pull through cache protect against?
+ Upstream outages and rate limits
- Code bugs :: No.
- DNS typos :: No.
- Disk faults :: No.
> Images are served locally.

Q: What must clean up never remove?
+ Images referenced by running workloads or recent releases
- Test images :: Those may go.
- Untagged layers :: Those may go.
- Old logs :: Different.
> Rollbacks need them.

Q: Why separate read and write paths?
+ A push storm should not slow pulls
- To reduce names :: No.
- To save disk :: No.
- To hide traffic :: No.
> Pull availability matters most.
```

```cards
Digest :: A hash that identifies exact image content
Pull through cache :: A local copy of an upstream registry
Immutable tag :: A tag that cannot be moved
Retention rule :: A policy that removes old artifacts
```
