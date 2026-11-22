---
title: Resource management and autoscaling
summary: Requests and limits, QoS classes, throttling checks, quota debugging and autoscaler reference.
module: k8s-resources
---

## Requests and limits

| Setting | Effect |
|---------|--------|
| CPU request | Scheduling and share of CPU |
| CPU limit | Throttling above the quota |
| Memory request | Scheduling and eviction order |
| Memory limit | OOM kill above the limit |

## QoS classes

| Class | Rule |
|-------|------|
| Guaranteed | Requests equal limits for CPU and memory in every container |
| Burstable | At least one request or limit set |
| BestEffort | None set, evicted first |

## Checks

| Job | Command |
|-----|---------|
| Usage | `kubectl top pods` |
| Why restarted | `kubectl describe pod NAME | grep -A4 "Last State"` |
| Throttling | `cat /sys/fs/cgroup/cpu.stat` in the container |
| Quota use | `kubectl describe quota -n NS` |
| HPA | `kubectl describe hpa NAME` |

## Autoscaling

| Tool | Scales |
|------|--------|
| HPA | Replicas from metrics |
| VPA | Requests from history |
| Cluster Autoscaler or Karpenter | Nodes for pending pods |
| KEDA | Replicas from events, including to zero |

## Handy commands

```bash
kubectl top nodes
```

```bash
kubectl describe node NODE | grep -A8 Allocated
```

```bash
kubectl get resourcequota -A
```

```bash
kubectl get pods -A --field-selector=status.phase=Pending
```

```bash
kubectl get limitrange -A
```

```bash
kubectl describe quota -n NAMESPACE
```

```bash
kubectl get pods -A -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
```

## Watch out for

> **Warning:** A CPU limit that is too tight throttles a service even when the node is idle.

> **Warning:** Memory limits kill containers at the limit, so size from observed peaks and not averages.

> **Warning:** Requests decide scheduling, so a request that is too high strands capacity.

> **Warning:** A LimitRange or quota change affects new pods only, not running ones.
