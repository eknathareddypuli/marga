---
title: EndpointSlices and how traffic finds pods
minutes: 11
summary: Follow how readiness, selectors and the EndpointSlice controller decide which pods receive traffic, and why a ready pod may still get none.
---

Between a Service and a pod there is a list. That list, the EndpointSlice, is what really decides where traffic goes, and many apparent network problems are in fact wrong lists.

## What you will learn

- Why EndpointSlices replaced Endpoints
- How the controller builds slices from selectors and readiness
- Terminating endpoints and graceful shutdown
- Topology aware routing
- Services without selectors

## From Endpoints to slices

The old Endpoints object held every address of a Service in one resource, so a large Service made every update huge and sent it to every node. EndpointSlices split addresses into slices, by default up to 100 each, so an update changes one small object. kube-proxy and other consumers watch slices.

## How slices are built

The EndpointSlice controller watches Services and pods. For each Service with a selector it lists matching pods and records their IP, port, node, zone and conditions. A pod is ready only if its containers pass readiness. Only ready endpoints receive new connections in normal operation.

## Conditions

Each endpoint has ready, serving and terminating conditions. During a rolling update a pod that is shutting down becomes terminating, and stays serving until it exits if its readiness still passes, which helps drain connections. Pair this with a preStop delay and a termination grace period so that load balancers and kube-proxy have time to stop sending new traffic.

## Zone aware routing

With topology aware routing, enabled by annotation or the traffic distribution field, a Service prefers endpoints in the same zone, which reduces latency and cross zone cost. It falls back when a zone has too few endpoints, so make sure replicas are spread across zones.

```bash
kubectl get endpointslice -l kubernetes.io/service-name=web -o yaml | head -40
kubectl get pods -l app=web -o wide
```

## Selectorless Services

A Service without a selector gets no automatic slices. You create an EndpointSlice by hand to point at something outside the cluster, such as a database VM. It is also how some controllers publish backends, and a missing slice is the explanation for such Services failing.

```diagram
title: EndpointSlices and how traffic finds pods
node: svc | Service selector | 0 | 1 | Matches labels. | Mismatch. | store
node: ctl | Slice controller | 1 | 1 | Builds the list. | Lagging. | process
node: slice | EndpointSlice | 2 | 1 | Ready addresses. | Empty. | store
node: kp | kube-proxy | 3 | 1 | Programs nodes. | Stale. | service
node: pod | Ready pods | 4 | 1 | Receive traffic. | Not ready. | service
edge: svc | ctl
edge: ctl | slice
edge: slice | kp
edge: kp | pod
```

## Incident: Errors during every rolling update

> **Incident:** Clients saw connection resets for a few seconds on each deploy.

```console
$ kubectl get deploy web -o jsonpath='{.spec.template.spec.terminationGracePeriodSeconds}'
30
$ kubectl get deploy web -o jsonpath='{.spec.template.spec.containers[0].lifecycle}'
(no output)
(this is a simulated illustration, not a real incident)
```

The container stopped accepting connections the moment it received SIGTERM, while kube-proxy and the load balancer still sent a few more. Adding a short preStop sleep gave the endpoint removal time to spread before shutdown began, and the resets stopped. Graceful shutdown is a network feature as well as an application one.

## Common mistakes

- Ignoring readiness probes
- Stopping the listener immediately on SIGTERM
- Spreading replicas in one zone with zone routing on
- Creating Endpoints by hand instead of slices
- Assuming propagation of endpoint changes is instant

```quiz
Q: What does an EndpointSlice list?
+ Addresses and readiness for a Service's backends
- Node images :: No.
- DNS records only :: No.
- RBAC rules :: No.
> It is the real backend list.

Q: Why were slices introduced?
+ Large Services made single Endpoints objects too big to update
- To add encryption :: No.
- To remove kube-proxy :: No.
- To change IPs :: No.
> Splitting reduces update size.

Q: How do you reduce resets during a rolling update?
+ Add a preStop delay and enough grace period
- Increase CPU :: Not related.
- Disable probes :: Worse.
- Use NodePort :: Not related.
> Give endpoint removal time to propagate.

Q: When does a Service need a manual EndpointSlice?
+ When it has no selector and points at an external backend
- When it has pods :: Automatic then.
- When using Ingress :: Not required.
- Never :: There are such cases.
> Selectorless Services need you to supply addresses.
```

```cards
Readiness :: Whether a pod should receive traffic
Terminating endpoint :: An endpoint for a pod that is shutting down
preStop hook :: A command run before a container is stopped
Topology aware routing :: Preferring endpoints close to the client
Selectorless Service :: A Service without a selector
```
