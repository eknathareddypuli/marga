---
title: CoreDNS and service discovery
minutes: 12
summary: Understand how pods resolve names, how resolv.conf, ndots and search domains behave, how CoreDNS is configured, and how to tune and debug it.
---

Almost every request in a cluster starts with a DNS lookup. DNS faults look like network faults, and slow DNS looks like slow applications. A clear picture of how names resolve removes a lot of guesswork.

## What you will learn

- Service and pod DNS names
- What is in a pod resolv.conf and why ndots matters
- The CoreDNS Corefile and plugins
- Scaling and caching
- Debugging resolution

## Names

A Service named web in namespace shop has the name `web.shop.svc.cluster.local`. Pods in the same namespace can use just `web`, and from other namespaces `web.shop`. Headless Services also publish per pod names. SRV records carry ports. Pods have IP based names that are rarely used.

## resolv.conf and ndots

The kubelet writes each pod resolv.conf with the cluster DNS Service IP as nameserver, a search list such as `shop.svc.cluster.local svc.cluster.local cluster.local`, and `options ndots:5`. A name with fewer than five dots is tried with each search suffix first, so a lookup for `api.example.com` makes several failing queries before the real one. Using a fully qualified name with a trailing dot, or lowering ndots in the pod spec, cuts that traffic.

## The Corefile

CoreDNS runs as a Deployment in kube-system, behind the kube-dns Service. Its configuration is the Corefile in a ConfigMap, built from plugins. The kubernetes plugin answers cluster names from the API. The forward plugin sends other names to upstream resolvers. The cache plugin caches answers, and loop detects forwarding loops. You can add stub domains and custom zones.

```bash
kubectl -n kube-system get cm coredns -o jsonpath='{.data.Corefile}'
kubectl -n kube-system get deploy coredns
kubectl -n kube-system logs -l k8s-app=kube-dns --tail=20
```

## Scale and cache

Large clusters send heavy DNS traffic. Scale CoreDNS with replicas or autoscaling relative to cluster size, and consider NodeLocal DNSCache, a per node cache that reduces latency and conntrack pressure. Watch the request rate, cache hit ratio and error counts.

## Debugging

Test from a throwaway pod rather than from the node, because the node resolver differs. Check the nameserver in resolv.conf, query a cluster name and an external name, and read CoreDNS logs.

```bash
kubectl run dnstest --image=busybox:1.36 --restart=Never --rm -it -- nslookup web.shop.svc.cluster.local
kubectl exec web-1 -- cat /etc/resolv.conf
```

```diagram
title: CoreDNS and service discovery
node: pod | Pod resolver | 0 | 1 | Uses search and ndots. | Many wasted queries. | external
node: dns | CoreDNS | 1 | 1 | Answers cluster names. | Overloaded. | service
node: api | API server | 2 | 0 | Source of Services. | Slow. | service
node: up | Upstream DNS | 2 | 2 | External names. | Unreachable. | external
edge: pod | dns
edge: dns | api
edge: dns | up
```

## Incident: DNS slowness from search domains

> **Incident:** An application that called an external API had five second delays on its first call each minute.

```console
$ kubectl exec web-1 -- cat /etc/resolv.conf
search shop.svc.cluster.local svc.cluster.local cluster.local corp.example
nameserver 10.96.0.10
options ndots:5
$ kubectl -n kube-system logs -l k8s-app=kube-dns --tail=2
[ERROR] plugin/errors: 2 api.partner.com.corp.example. A: read udp 10.244.1.4:41872->10.0.0.2:53: i/o timeout
(this is a simulated illustration, not a real incident)
```

A lookup for api.partner.com with ndots 5 tried each search suffix first, and one of them, the corporate suffix, went to an upstream resolver that dropped queries. Each timeout added seconds. Using the fully qualified name with a trailing dot, and lowering ndots for that workload, removed the delay. Search domains are a hidden multiplier on DNS load.

## Common mistakes

- Ignoring ndots and search domains
- Testing DNS from the node instead of a pod
- Leaving CoreDNS at two replicas in a large cluster
- Editing the Corefile without checking the loop plugin
- Blaming the network for resolution errors

```quiz
Q: What is the DNS name of Service web in namespace shop?
+ web.shop.svc.cluster.local
- shop.web.cluster :: Wrong order.
- web.cluster.shop :: Wrong order.
- web.svc :: Incomplete.
> Service, namespace, svc, cluster domain.

Q: What does ndots:5 do?
+ Treats names with fewer than five dots as relative and tries search suffixes first
- Limits names to five characters :: No.
- Sets TTL :: No.
- Disables search :: No.
> Many lookups become several queries.

Q: Where is CoreDNS configured?
+ In the Corefile in a ConfigMap
- In etcd directly :: No.
- In kube-proxy :: No.
- In the kubelet only :: No.
> The ConfigMap named coredns.

Q: Where should you test DNS from?
+ A pod in the cluster
- The node only :: Different resolver.
- Your laptop :: Different network.
- The API server :: Not relevant.
> Pods use the cluster resolver.
```

```cards
CoreDNS :: The cluster DNS server
Corefile :: CoreDNS configuration made of plugins
ndots :: A resolver option that controls when search domains are tried first
Search domain :: A suffix tried when resolving a short name
NodeLocal DNSCache :: A per node DNS cache to reduce latency
```
