---
title: Services: ClusterIP, NodePort and kube-proxy modes
minutes: 12
summary: See how a Service gives pods a stable address and how kube-proxy in iptables or IPVS mode implements load balancing, and what each Service type exposes.
---

Pods come and go and change IPs. A Service is the stable name and address in front of them. Understanding how a Service is turned into packet rules explains its behaviour, its limits and a good share of network faults.

## What you will learn

- Service types and what each exposes
- How kube-proxy programs rules from Services and endpoints
- iptables, IPVS and nftables modes
- Session affinity, externalTrafficPolicy and source IPs
- Headless Services

## Types

A ClusterIP Service is reachable only inside the cluster through a virtual IP. A NodePort adds a port, by default 30000 to 32767, on every node that forwards to the Service. A LoadBalancer asks the cloud provider for an external load balancer that targets the NodePorts. An ExternalName returns a DNS CNAME and does no proxying. A headless Service, with clusterIP None, has no virtual IP and returns the pod addresses in DNS.

## kube-proxy

kube-proxy runs on every node, watches Services and EndpointSlices through the API server, and programs the node so that traffic to a ClusterIP and port is rewritten to a pod IP. It does not carry traffic itself in the common modes. In iptables mode it writes rules that select an endpoint at random, so large Services produce long rule lists. In IPVS mode it uses the kernel load balancer with hash tables, which scales better and offers more algorithms. Newer clusters can also use nftables mode.

## Look at the rules

```bash
kubectl get svc web
kubectl get endpointslices -l kubernetes.io/service-name=web
sudo iptables -t nat -L KUBE-SERVICES -n | head
kubectl -n kube-system get cm kube-proxy -o jsonpath='{.data.config\.conf}' | grep -E "mode|ipvs"
```

## Affinity and source IPs

By default each connection picks an endpoint independently. `sessionAffinity: ClientIP` keeps a client on the same pod for a period. For NodePort and LoadBalancer Services, `externalTrafficPolicy: Local` sends traffic only to pods on the receiving node and preserves the client source IP, but nodes without a local pod fail health checks. The default Cluster policy may hop to another node and replace the source IP.

## Headless Services and stateful sets

A headless Service returns individual pod records, which is how StatefulSets give each pod a stable DNS name such as `db-0.db.prod.svc`. Clients that need to choose a member, such as a database driver, use these records.

```diagram
title: Services: ClusterIP, NodePort and kube-proxy modes
node: c | Client pod | 0 | 1 | Calls the ClusterIP. | Wrong port. | external
node: rules | kube-proxy rules | 1 | 1 | Rewrite to a pod IP. | Stale rules. | process
node: eps | EndpointSlices | 2 | 0 | Ready pod addresses. | Empty list. | store
node: pod | Backend pod | 3 | 1 | Handles the request. | Not ready. | service
edge: c | rules
edge: rules | eps
edge: rules | pod
```

## Incident: A Service with no endpoints

> **Incident:** Calls to a Service hung, even though pods with the right name were running.

```console
$ kubectl get svc cart
NAME   TYPE        CLUSTER-IP     PORT(S)
cart   ClusterIP   10.96.44.18    80/TCP
$ kubectl get endpointslices -l kubernetes.io/service-name=cart
NAME         ADDRESSTYPE   PORTS   ENDPOINTS
cart-x7k2p   IPv4          80      <unset>
(this is a simulated illustration, not a real incident)
```

The Service selector said app=cart but the pods carried app=cart-api, so no endpoints matched and connections to the ClusterIP had nowhere to go. Correcting the selector filled the EndpointSlice. When a Service misbehaves, check endpoints before anything else.

## Common mistakes

- Not checking endpoints first
- Selector and label mismatch
- Using NodePort where an ingress is safer
- Assuming the source IP is preserved
- Ignoring readiness probes that keep pods out of endpoints

```quiz
Q: What does a ClusterIP expose?
+ A virtual IP reachable inside the cluster
- A public IP :: Not by itself.
- A node port :: That is NodePort.
- A DNS only record :: That is ExternalName or headless.
> It is internal.

Q: What does kube-proxy do in iptables mode?
+ Programs rules that rewrite Service addresses to pod addresses
- Proxies every packet in user space :: Not in current modes.
- Schedules pods :: No.
- Serves DNS :: No.
> It programs the node.

Q: What is the first check for a Service that does not respond?
+ Its endpoints
- The node disk :: Unlikely.
- The scheduler :: Unrelated.
- etcd health :: Rarely the cause.
> No endpoints means no backends.

Q: What does externalTrafficPolicy Local do?
+ Sends to pods on the receiving node and keeps the client IP
- Disables the Service :: No.
- Encrypts traffic :: No.
- Adds a node :: No.
> It avoids the extra hop and SNAT.
```

```cards
ClusterIP :: A virtual internal address for a Service
NodePort :: A port opened on every node for a Service
EndpointSlice :: A list of ready pod addresses for a Service
Headless Service :: A Service without a virtual IP that returns pod records
kube-proxy :: The node component that programs Service rules
```
