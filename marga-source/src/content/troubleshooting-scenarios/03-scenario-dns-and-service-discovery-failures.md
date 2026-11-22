---
title: Scenario: DNS and service discovery failures
minutes: 13
summary: Diagnose name resolution problems in Kubernetes and cloud networks: CoreDNS health, search domains and ndots, conntrack races, caching and private zones.
---

It is always DNS is a joke because it is often true. A slow or failing lookup looks like a slow or failing application, so test resolution early.

## What you will learn

- How a name is resolved in a pod
- Search domains, ndots and extra queries
- CoreDNS: health, scaling and upstreams
- Intermittent failures and timeouts
- Private zones and split horizon in clouds

## Resolution in a pod

A pod uses the resolver settings in resolv.conf, which point to the cluster DNS service and list search domains. A short name such as db is tried with each search suffix before the name is tried as it is. The first answer is used, and the results may be cached by the client or by a node level cache.

## Search domains and ndots

The ndots option says how many dots a name needs before it is tried as absolute. With the default of five, a name such as api.example.com is first tried with several cluster suffixes, producing several failed queries per lookup. This adds latency and load. Use a trailing dot for external names, or lower ndots for such workloads.

## CoreDNS

CoreDNS serves cluster names and forwards others to upstream resolvers. Watch its request rate, error codes, latency and cache hit rate. Scale it with the cluster, run a node local cache to cut cross node traffic and make sure that the upstream is reachable from the nodes. A crash loop in CoreDNS breaks every service that resolves names.

## Intermittent failures

Occasional five second delays can come from lost UDP packets, connection tracking races on busy nodes, or a single bad upstream among several. Check the packet counters and conntrack insert failures, test with tcp and udp, and query each upstream directly. A node local cache or using tcp for retries often reduces the problem.

## Private zones

In clouds a private zone returns internal addresses only to linked networks. A query from an unlinked network, or from a pod that forwards to a public resolver, gets the public answer or none. Check which resolver the workload actually uses, and whether the zone is linked and has a rule for the right network.

```diagram
title: Scenario: DNS and service discovery failures
node: pod | Pod resolver | 0 | 1 | Search and ndots. | Extra queries. | service
node: cache | Node cache | 1 | 1 | Local answers. | Stale. | store
node: core | CoreDNS | 2 | 1 | Cluster names. | Overload. | service
node: up | Upstream and zones | 3 | 1 | External names. | Wrong view. | external
edge: pod | cache
edge: cache | core
edge: core | up
```

## Incident: Slow calls to a payment provider

> **Incident:** Calls to an external API took five seconds in about one case in twenty.

```console
$ kubectl exec deploy/checkout -n shop -- cat /etc/resolv.conf
search shop.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
$ kubectl exec deploy/checkout -n shop -- sh -c "time getent hosts api.partner.example"
203.0.113.20 api.partner.example
real 0m5.010s
(this is a simulated illustration, not a real incident)
```

Each lookup of the external name first tried the cluster suffixes, and some of those queries were lost on a busy node, so the resolver waited for its five second timeout before retrying. The team lowered ndots for that workload, used a fully qualified name, enabled a node local cache and added an alert on the CoreDNS latency. The slow calls disappeared.

## Common mistakes

- Not testing DNS first in a slow service
- Default ndots for workloads that call external names
- Under sized CoreDNS
- Ignoring packet loss on a busy node
- Assuming the private zone is linked

```quiz
Q: What does ndots control?
+ How many dots make a name absolute
- The cache size :: No.
- The TTL :: No.
- The port :: No.
> A high value causes extra suffix queries.

Q: How can a trailing dot help?
+ It makes the name fully qualified and skips search suffixes
- It encrypts DNS :: No.
- It speeds the CPU :: No.
- It sets a TTL :: No.
> The resolver asks once.

Q: What should you watch on CoreDNS?
+ Request rate, errors, latency and cache hits
- Disk space only :: No.
- Memory of the app :: Not the point.
- Log colours :: No.
> It is a critical shared service.

Q: Why would a private zone fail from a pod?
+ The network is not linked or a public resolver is used
- The zone is encrypted :: No.
- DNS is disabled :: No.
- The pod has no CPU :: No.
> Check the resolver path.
```

```cards
CoreDNS :: The DNS server used inside Kubernetes
ndots :: A resolver setting for when to try a name as absolute
Search domain :: A suffix the resolver adds to short names
Split horizon :: Different DNS answers for different networks
```
