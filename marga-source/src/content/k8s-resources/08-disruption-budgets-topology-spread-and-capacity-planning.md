---
title: Disruption budgets, topology spread and capacity planning
minutes: 13
summary: Protect availability during voluntary disruption with PodDisruptionBudgets and topology spread, and plan capacity with headroom for failures and growth.
---

Autoscaling and upgrades both move pods around. Disruption budgets and spread constraints say how much movement a workload can take, and capacity planning makes sure there is room to move into.

## What you will learn

- PodDisruptionBudgets: minAvailable and maxUnavailable
- Voluntary versus involuntary disruption
- Topology spread constraints and anti-affinity
- Planning N plus one capacity
- A review checklist

## Disruptions

Voluntary disruptions are actions by operators and tools: drains, upgrades, consolidation and eviction API calls. Involuntary ones are hardware failures, kernel panics and node loss. PodDisruptionBudgets apply to voluntary evictions made through the eviction API, so they do not stop a node crashing, but they do slow a drain.

## PodDisruptionBudgets

A PDB selects pods and declares `minAvailable` or `maxUnavailable`, as a number or a percentage. The eviction API refuses an eviction that would break it. Choose values that match the workload: a three replica service might allow one unavailable. A budget of zero allowed disruptions blocks all drains, which is the cause of many stuck upgrades.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: web
```

## Spreading

Topology spread constraints tell the scheduler to keep replicas evenly spread over zones or nodes, within a maximum skew. They are clearer than pod anti-affinity for most uses. Combine them with several replicas so that the loss of a zone or node leaves enough capacity.

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: web
```

## Capacity planning

Plan so that the cluster survives the loss of the largest failure domain you care about. With three zones, that means the remaining two can carry the load, so run each zone at no more than about two thirds of its capacity. Add headroom for the autoscaler delay and for upgrades, which need spare room to drain into. Review growth trends monthly.

```python
zones = 3
load = 100.0
capacity_per_zone = load / (zones - 1) * 1.15
print("capacity per zone:", round(capacity_per_zone, 1))
print("total:", round(capacity_per_zone * zones, 1))
```

## Checklist

For each production workload: at least two or three replicas, a PDB that allows one disruption, a spread constraint over zones, requests that reflect reality, a readiness probe and a graceful shutdown. For the cluster: node headroom, autoscaler limits, and a tested drain of one node and one zone.

```diagram
title: Disruption budgets, topology spread and capacity planning
node: pdb | PodDisruptionBudget | 0 | 1 | Limits evictions. | Zero allowed. | security
node: spread | Topology spread | 1 | 1 | Even placement. | One zone. | process
node: cap | Capacity headroom | 2 | 1 | Room to move. | Full nodes. | store
node: test | Drain test | 3 | 1 | Proves it. | Never run. | observe
edge: pdb | spread
edge: spread | cap
edge: cap | test
```

## Incident: A zone loss that took the service down

> **Incident:** A single zone failed and a service with six replicas went fully unavailable.

```console
$ kubectl get pods -l app=web -o wide --no-headers | awk '{print $7}' | sort | uniq -c
      6 node-a1
$ kubectl get nodes -L topology.kubernetes.io/zone | grep node-a1
node-a1   Ready   zone-a
(this is a simulated illustration, not a real incident)
```

All six replicas had been scheduled to one node in one zone because no spread constraint was set and that node had the most free resources. When the zone failed, nothing was left. A zone spread constraint, a PDB and a capacity plan with headroom in the other zones would have kept the service up. Replica count is not availability unless the replicas are spread.

## Common mistakes

- Several replicas on one node or zone
- A PDB with no allowed disruptions
- Running every zone at high utilisation
- No test of a drain or a zone loss
- Confusing voluntary and involuntary disruption

```quiz
Q: What do PodDisruptionBudgets limit?
+ Voluntary evictions through the eviction API
- Node crashes :: They cannot prevent crashes.
- Image pulls :: No.
- DNS :: No.
> Drains and similar actions respect them.

Q: What does maxSkew control?
+ How uneven the spread of pods can be across a topology
- Memory use :: No.
- Pod names :: No.
- CPU limits :: No.
> It sets the allowed difference.

Q: How much utilisation should each of three zones run at to survive losing one?
+ About two thirds or less
- 100 percent :: No room to move.
- 90 percent :: Too high.
- Any amount :: No.
> The remaining two must carry the load.

Q: Why test a drain?
+ It reveals blocked PDBs and capacity gaps before an upgrade
- To reset pods :: No.
- To rename nodes :: No.
- To rotate keys :: No.
> You find problems on your terms.
```

```cards
PodDisruptionBudget :: A limit on voluntary disruption for a set of pods
Voluntary disruption :: An operator or tool initiated eviction
Topology spread constraint :: A scheduling rule for even placement across domains
Skew :: The difference in pod count between domains
Headroom :: Spare capacity kept for failures and growth
```
