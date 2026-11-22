---
title: Design: an ingress and load balancing tier
minutes: 13
summary: Design the front door of a platform: layer 4 and layer 7 balancing, TLS termination, health checks, capacity and connection limits, and failure behaviour across zones.
---

Every request passes through the front door. It terminates TLS, spreads load and shields backends, and when it fails everything behind it looks down.

## What you will learn

- Requirements: traffic, latency, protocols and availability
- Layer 4 or layer 7 and where to terminate TLS
- Health checks, draining and connection limits
- Zones, regions and failover
- Failure modes: overload, bad configuration and certificate expiry

## Requirements

Estimate requests per second at peak, concurrent connections, bandwidth and the protocols in use, such as HTTP, gRPC and WebSocket. Set an availability goal for the tier, which must be higher than for the services behind it. Ask whether clients are external, internal or both, since that changes the security design.

## Layer 4 and layer 7

A layer 4 balancer forwards connections and is fast and simple. A layer 7 proxy understands HTTP, so it can route by host and path, retry, limit rates and add headers, at a higher cost per request. Many designs use a layer 4 tier in front of a layer 7 tier. Terminate TLS at the layer 7 tier, and re encrypt to the backends if the network is not trusted.

## Health and limits

Health checks should test that the backend can do useful work, not only that the port is open, but they must be cheap and must not take down a struggling backend. Use draining so that deployments do not drop requests. Set connection, request and timeout limits, and rate limits per client, to protect backends and to fail fast with a clear status.

## Zones and regions

Spread the tier across at least three zones, with enough spare capacity that losing one zone does not overload the rest. Use health based traffic steering at the DNS or anycast level for regional failover, and test it. Keep configuration the same in every location and deploy it in rings.

## Failure modes

Overload needs load shedding at the edge. A bad configuration pushed everywhere can take the whole tier down, so validate it, roll it out in stages and keep the last good version. An expired certificate at the edge is a total outage, so automate renewal and alert early. Keep a documented way to bypass the tier in an emergency.

```diagram
title: Design: an ingress and load balancing tier
node: cl | Clients | 0 | 1 | External traffic. | Burst. | external
node: l4 | Layer 4 tier | 1 | 1 | Spreads connections. | Overload. | service
node: l7 | Layer 7 proxies | 2 | 1 | TLS and routing. | Bad config. | service
node: be | Backends | 3 | 1 | Health checked. | Unhealthy. | service
edge: cl | l4
edge: l4 | l7
edge: l7 | be
```

## Incident: One typo in the routing configuration

> **Incident:** A small change to the proxy configuration made every route return 404 for several minutes.

```console
$ nginx -t -c /etc/nginx/staged/nginx.conf
nginx: configuration file /etc/nginx/staged/nginx.conf test is successful
$ curl -s -o /dev/null -w "%{http_code}\n" https://edge.example.com/api/health
404
(this is a simulated illustration, not a real incident)
```

The syntax check passed, but a variable in a routing rule was empty, so no route matched. The change had been pushed to all proxies at once. The team rolled back to the last good file, then added a staged rollout of one proxy first, a synthetic request check against real routes before widening and automatic rollback if the check failed. The edge configuration became a reviewed and tested artifact.

## Common mistakes

- Health checks that only test an open port
- Pushing configuration to all proxies at once
- Capacity with no room to lose a zone
- No limits on connections and rates
- Manual certificate renewal at the edge

```quiz
Q: When use a layer 7 proxy?
+ When you need routing by host, path or headers
- For raw sockets only :: Layer 4 is enough.
- For disks :: No.
- For DNS zones :: No.
> It understands the application protocol.

Q: Why drain connections?
+ So deployments do not drop active requests
- To save logs :: No.
- To hide traffic :: No.
- To change DNS :: No.
> Requests can finish before removal.

Q: How much capacity should the tier have?
+ Enough to survive the loss of one zone
- Exactly the average :: Fails on loss.
- None extra :: Overloaded.
- Ten times :: Wasteful.
> N plus one by zone.

Q: What protects against a bad config push?
+ Staged rollout with a real route check and rollback
- Hope :: Not a control.
- A louder alert :: Too late.
- Larger servers :: No.
> Validate behaviour, not only syntax.
```

```cards
Layer 4 :: Forwarding at the connection level
Layer 7 :: Routing at the application protocol level
TLS termination :: Decrypting traffic at a proxy
Anycast :: One address announced from many locations
```
