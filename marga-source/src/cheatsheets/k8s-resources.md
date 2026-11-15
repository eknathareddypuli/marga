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
