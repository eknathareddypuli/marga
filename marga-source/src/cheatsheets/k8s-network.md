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
