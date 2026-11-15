---
title: Cluster autoscaling, Karpenter and KEDA
minutes: 12
summary: See how the Cluster Autoscaler and Karpenter add and remove nodes in response to pending pods, and how KEDA scales workloads from events, including to zero.
---

Pod autoscaling is only useful if there are nodes to place the new pods. Node autoscaling closes that gap, and event driven autoscaling lets workloads follow queues rather than CPU.

## What you will learn

- The Cluster Autoscaler and what it reacts to
- How scale down decisions are made and blocked
- Karpenter and just-in-time node provisioning
- KEDA and scaling to zero
- Cost and safety guardrails

## Cluster Autoscaler

The Cluster Autoscaler watches for pods that are Pending because no node has room. It picks a node group whose template would fit them, simulates the placement and increases that group size. It also finds nodes that have been underused for a period, checks that their pods can run elsewhere, and removes them. It works with node groups defined in the cloud provider, so node shapes are fixed by those groups.

## Blocked scale down

Scale down is blocked by pods that cannot be moved: pods with local storage, pods not backed by a controller, restrictive PodDisruptionBudgets, pods with the annotation `cluster-autoscaler.kubernetes.io/safe-to-evict` set to false, and system pods in some configurations. A cluster that never shrinks often has one such pod on every node.

## Karpenter

Karpenter takes a different approach. It watches Pending pods directly, evaluates their combined requirements, and launches nodes of suitable types and sizes through the cloud API, without predefined node groups. It also consolidates by replacing or removing nodes to reduce cost, and can handle spot interruptions. You define NodePools with limits and constraints such as instance families, zones and capacity types.

## KEDA

KEDA adds scalers for event sources, such as message queues, streams, databases and schedules, and exposes them as external metrics to the HPA. Its main addition is scaling to zero and back when events arrive. A queue worker with an empty queue then costs nothing, and starts when messages appear.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker
spec:
  scaleTargetRef:
    name: worker
  minReplicaCount: 0
  maxReplicaCount: 30
  triggers:
    - type: rabbitmq
      metadata:
        queueName: jobs
        value: "20"
```

## Guardrails

Set maximum node counts or limits so a runaway workload cannot create an unbounded bill. Spread across zones. Keep PodDisruptionBudgets for important workloads so consolidation is safe. Make sure daemons and system add-ons have enough requests. Test scale up latency, since node start time adds to the time before new pods run, and keep a small buffer of spare capacity if that delay is unacceptable.

```diagram
title: Cluster autoscaling, Karpenter and KEDA
node: pend | Pending pods | 0 | 1 | Signal for scale up. | Wrong requests. | observe
node: ca | Autoscaler or Karpenter | 1 | 1 | Adds nodes. | Quota. | process
node: node | New node | 2 | 1 | Joins and becomes Ready. | Slow start. | service
node: down | Consolidation | 3 | 1 | Removes idle nodes. | Blocked pods. | process
edge: pend | ca
edge: ca | node
edge: node | down
```

## Incident: The cluster that never scaled down

> **Incident:** A cluster stayed at its peak node count for weeks after a one-day load test.

```console
$ kubectl -n kube-system logs deploy/cluster-autoscaler | tail -2
I1114 06:10:01 scale_down.go:  node ip-10-0-3-21 cannot be removed: pod kube-system/metrics-agent is not replicated
$ kubectl get pods -A -o wide | grep ip-10-0-3-21 | wc -l
11
(this is a simulated illustration, not a real incident)
```

A single unmanaged pod with local storage sat on the node and blocked its removal, and similar pods blocked others. Moving the agent to a DaemonSet, adding safe-to-evict annotations where valid and reviewing PodDisruptionBudgets let nodes drain and the cluster shrink. If a cluster never scales down, ask the autoscaler why in its log.

## Common mistakes

- Leaving unmanaged or non-evictable pods on every node
- No maximum node limit
- Autoscaling nodes without requests on pods
- Ignoring node start time in latency targets
- Using consolidation without PodDisruptionBudgets

```quiz
Q: What triggers Cluster Autoscaler scale up?
+ Pods that are Pending because no node has room
- High CPU on nodes :: It looks at pending pods.
- A new namespace :: No.
- A label change :: No.
> Pending pods signal missing capacity.

Q: What blocks scale down?
+ Pods that cannot be moved, such as unmanaged pods
- Nodes with labels :: No.
- Many replicas :: No.
- A ConfigMap :: No.
> The autoscaler checks that pods can reschedule.

Q: How does Karpenter differ?
+ It provisions suitable nodes directly from pending pod requirements
- It only scales down :: No.
- It needs node groups :: It does not.
- It replaces the scheduler :: No.
> It chooses instance types dynamically.

Q: What does KEDA add?
+ Event driven scaling including to zero
- A new CNI :: No.
- Node patching :: No.
- Secrets :: No.
> It feeds event metrics to the HPA.
```

```cards
Cluster Autoscaler :: A controller that adds and removes nodes from node groups
Karpenter :: A node provisioner that launches suitable nodes for pending pods
Consolidation :: Replacing or removing nodes to reduce cost
KEDA :: Kubernetes Event Driven Autoscaling
Scale to zero :: Running no replicas until work arrives
```
