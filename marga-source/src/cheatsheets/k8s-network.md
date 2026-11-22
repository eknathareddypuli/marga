---
title: Kubernetes networking
summary: Service debugging order, node commands, DNS settings and network policy reminders.
module: k8s-network
---

## Check order for a failing Service

| Step | Command |
|------|---------|
| Service and selector | `kubectl get svc NAME -o wide` |
| Endpoints | `kubectl get endpointslices -l kubernetes.io/service-name=NAME` |
| Pod labels and readiness | `kubectl get pods --show-labels` |
| Direct pod IP | `kubectl exec POD -- curl -s POD_IP:PORT` |
| DNS | `kubectl exec POD -- nslookup NAME` |
| Policies | `kubectl get networkpolicy -A` |

## On the node

| Job | Command |
|-----|---------|
| kube-proxy mode | `kubectl -n kube-system logs ds/kube-proxy | head` |
| iptables rules for a Service | `iptables -t nat -S | grep SERVICE` |
| Conntrack entries | `conntrack -L | head` |
| MTU | `ip link show` |

## DNS

| Setting | Effect |
|---------|--------|
| `ndots:5` | Short names try search domains first |
| Trailing dot | Skips the search list |
| NodeLocal DNSCache | Cache per node, fewer conntrack entries |

## Policy reminders

| Rule | Why |
|------|-----|
| Policies are additive | There are no deny rules |
| Allow DNS with default deny egress | Otherwise names fail |
| Same list item means AND | Separate items mean OR |

## Handy commands

```bash
kubectl get endpointslices -n NAMESPACE
```

```bash
kubectl exec POD -- nslookup kubernetes.default
```

```bash
kubectl get networkpolicy -A
```

```bash
kubectl get svc -A -o wide
```

```bash
kubectl get ingress -A
```

```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

```bash
kubectl run dns-test --image=busybox:1.36 --restart=Never --rm -it -- nslookup kubernetes.default
```

## Watch out for

> **Warning:** A NetworkPolicy that selects a pod makes everything else denied for that direction, so add DNS egress.

> **Warning:** Service selectors that match nothing create an endpoint list that is empty, not an error.

> **Warning:** Changing ndots or DNS config on a busy cluster can create new failures, so test on one workload first.

> **Warning:** Overlapping pod and service CIDRs cause routing problems that are hard to see.
