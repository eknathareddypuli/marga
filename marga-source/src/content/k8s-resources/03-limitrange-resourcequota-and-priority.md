---
title: LimitRange, ResourceQuota and priority classes
minutes: 12
summary: Use LimitRange for defaults and bounds, ResourceQuota to cap a namespace, and PriorityClass to control who wins when capacity is short.
---

Without guardrails, one team can request all the cluster. Namespace level objects set defaults and ceilings, and priorities say which workloads matter when there is not enough for everyone.

## What you will learn

- LimitRange defaults, minimums and maximums
- ResourceQuota for compute, storage and object counts
- What happens when a quota blocks a pod
- PriorityClass and preemption
- A model for sharing a cluster

## LimitRange

A LimitRange in a namespace supplies default requests and limits for containers that omit them and enforces minimum and maximum values per container or pod. Defaults mean no pod is BestEffort by accident, and maximums stop a single container from asking for an entire node.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: defaults
  namespace: shop
spec:
  limits:
    - type: Container
      default:
        memory: 512Mi
      defaultRequest:
        cpu: 100m
        memory: 256Mi
      max:
        memory: 2Gi
```

## ResourceQuota

A ResourceQuota caps the total of requests, limits, storage and object counts in a namespace, for example total CPU requests, number of pods or persistent volume claims. When a quota covers compute resources, every pod must specify those resources or get them from a LimitRange, otherwise creation is rejected with a message naming the quota.

## When quotas bite

A request that would exceed the quota is refused at admission with "exceeded quota". The status of the quota shows used and hard values. Quotas apply at creation, so a Deployment hitting a quota shows a ReplicaSet that cannot create pods, not a Pending pod. Look at ReplicaSet events.

```bash
kubectl describe resourcequota -n shop
kubectl describe rs -n shop | grep -i -A2 "quota"
```

## Priority

A PriorityClass assigns an integer priority to pods. The scheduler queues higher priority pods first, and when no node fits can preempt lower priority pods. Use a few classes: system critical for platform components, high for important services, default for most and low for batch that may be displaced. Setting everything to high removes the benefit.

## Sharing a cluster

A common model is one namespace per team with a quota sized to the team share, defaults from a LimitRange, and priorities for production over batch. Review quota use against actual use regularly, and add a report so teams see their own consumption.

```diagram
title: LimitRange, ResourceQuota and priority classes
node: lr | LimitRange | 0 | 1 | Defaults and bounds. | Absent. | store
node: rq | ResourceQuota | 1 | 1 | Namespace ceiling. | Too small. | store
node: adm | Admission | 2 | 1 | Rejects over quota. | Unclear errors. | process
node: pc | PriorityClass | 3 | 1 | Order and preemption. | Everything high. | process
edge: lr | rq
edge: rq | adm
edge: adm | pc
```

## Incident: Pods that were never created

> **Incident:** A deployment showed zero pods and no Pending ones after a scale up.

```console
$ kubectl get deploy web
NAME   READY   UP-TO-DATE   AVAILABLE
web    2/6     2            2
$ kubectl describe rs web-6b5c | grep -i quota
Warning  FailedCreate  ... forbidden: exceeded quota: team-quota, requested: requests.cpu=500m, used: requests.cpu=3800m, limited: requests.cpu=4
(this is a simulated illustration, not a real incident)
```

The namespace CPU request quota was nearly used, so new pods were refused when the ReplicaSet tried to create them. There were no Pending pods because pods did not exist. Raising the quota for a justified need, or reducing requests on over-provisioned pods, fixed it. Check ReplicaSet events when pods are missing rather than Pending.

## Common mistakes

- Looking for Pending pods when the quota refuses creation
- Setting a quota without defaults
- Making every workload high priority
- Setting LimitRange maximums that block legitimate jobs
- Never reviewing quota against usage

```quiz
Q: What does a LimitRange default provide?
+ Requests and limits for containers that omit them
- A node :: No.
- A secret :: No.
- A role :: No.
> It avoids accidental BestEffort pods.

Q: What does a ResourceQuota limit?
+ Totals per namespace such as CPU requests and object counts
- A single container :: That is LimitRange.
- Node disk :: No.
- DNS :: No.
> It caps namespace totals.

Q: Where do quota failures show up for a Deployment?
+ In ReplicaSet events
- In node events :: No.
- In etcd logs :: No.
- In DNS logs :: No.
> The ReplicaSet cannot create pods.

Q: What can a higher PriorityClass do?
+ Preempt lower priority pods when nothing fits
- Raise node memory :: No.
- Skip admission :: No.
- Delete the quota :: No.
> It is for scarce capacity.
```

```cards
LimitRange :: Namespace defaults and bounds per container or pod
ResourceQuota :: A cap on total resources and objects in a namespace
PriorityClass :: An object that assigns a scheduling priority
Preemption :: Evicting lower priority pods to place a higher priority one
Hard limit :: The maximum allowed by a quota
```
