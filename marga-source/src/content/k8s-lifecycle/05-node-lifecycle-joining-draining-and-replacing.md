---
title: Node lifecycle: joining, draining and replacing
minutes: 12
summary: Manage nodes through their life: add, label, cordon, drain, repair and retire, and avoid the traps that make draining hang.
---

Nodes are cattle more than pets, but each one still needs a safe path in and out. Replacing a node well means workloads move gracefully, state is preserved and the cluster keeps its capacity throughout.

## What you will learn

- Adding a node and what makes it Ready
- Cordon, drain and uncordon
- Why drains get stuck: PDBs, local storage, unmanaged pods
- Node problems and taints
- Replacing and removing a node cleanly

## Joining

A new node installs the runtime and kubelet, then joins with kubeadm or a cloud provider mechanism. It becomes Ready when the kubelet reports healthy and the CNI plugin has configured networking. Add labels for pool, zone and hardware so the scheduler and your selectors can use them, and taints for dedicated pools.

## Cordon and drain

Cordon marks a node unschedulable, so no new pods land there, but existing pods keep running. Drain cordons and then evicts the pods, respecting PodDisruptionBudgets and graceful termination. Uncordon makes the node schedulable again.

```bash
kubectl cordon worker-3
kubectl drain worker-3 --ignore-daemonsets --delete-emptydir-data --timeout=300s
kubectl uncordon worker-3
```

## Why a drain hangs

Drain waits for each eviction to succeed. A PodDisruptionBudget that allows zero disruptions blocks it. Pods not managed by a controller are refused unless you use force, because they will not be recreated. Pods with local storage need `--delete-emptydir-data`. DaemonSet pods are ignored with a flag. A pod that ignores SIGTERM will wait for its grace period before being killed.

## Unhealthy nodes

When a node stops heartbeating, the node controller marks it NotReady and adds the `node.kubernetes.io/unreachable` taint, and after the default toleration of five minutes pods are evicted. Stateful pods with a ReadWriteOnce volume may need extra time to detach. Decide in advance whether to wait or to delete the node object after confirming the machine is really gone.

## Replace and retire

To replace a node, add the new one first so capacity does not dip, drain the old one, check workloads are healthy, then delete the node object and the machine. If you delete the machine first, the node object remains until the controller notices.

```bash
kubectl delete node worker-3
kubectl get pods -A -o wide --field-selector spec.nodeName=worker-3
```

```diagram
title: Node lifecycle: joining, draining and replacing
node: new | New node | 0 | 1 | Joins and becomes Ready. | No CNI. | service
node: cord | Cordon | 1 | 1 | Stops new pods. | Forgotten. | process
node: drain | Drain | 2 | 1 | Evicts pods. | PDB blocks. | process
node: ret | Retire | 3 | 1 | Delete node and machine. | Stale node object. | process
edge: new | cord
edge: cord | drain
edge: drain | ret
```

## Incident: The drain that never finished

> **Incident:** A node drain sat for forty minutes during a maintenance window.

```console
$ kubectl drain worker-3 --ignore-daemonsets --delete-emptydir-data
evicting pod shop/cart-7d9f
error when evicting pods/"cart-7d9f" -n "shop" (will retry after 5s): Cannot evict pod as it would violate the pod's disruption budget.
$ kubectl get pdb -n shop
NAME   MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS
cart   2               N/A               0
(this is a simulated illustration, not a real incident)
```

The cart deployment had two replicas and a PodDisruptionBudget requiring two, so the budget allowed no disruptions and the drain retried forever. The fix was to scale to three replicas, which allowed one disruption, or to relax the budget for the window. Review PDBs against replica counts before planned maintenance.

## Common mistakes

- Draining without checking PodDisruptionBudgets
- Forcing eviction of pods that are not controller managed
- Deleting the machine before draining
- Forgetting to uncordon after maintenance
- Leaving the node object behind

```quiz
Q: What does cordon do?
+ Marks the node unschedulable without evicting pods
- Evicts all pods :: That is drain.
- Deletes the node :: It does not.
- Restarts the kubelet :: It does not.
> Cordon only stops new scheduling.

Q: Why might a drain hang?
+ A PodDisruptionBudget allows no disruptions
- The node has too much memory :: Not a cause.
- The cluster has a CNI :: Not a cause.
- kubectl is old :: Not a cause.
> Budgets must allow at least one eviction.

Q: Which flag handles DaemonSet pods during drain?
+ --ignore-daemonsets
- --force-daemons :: No such flag.
- --delete-daemons :: No such flag.
- --skip-pods :: No such flag.
> DaemonSet pods would be recreated on the node anyway.

Q: What is the safe order to replace a node?
+ Add the new node, drain the old one, then delete it
- Delete the machine first :: Pods would be lost abruptly.
- Drain, then add the new one :: Capacity dips.
- Only uncordon :: That does nothing.
> Keep capacity and move workloads gracefully.
```

```cards
Cordon :: Mark a node unschedulable
Drain :: Cordon and evict pods from a node
PodDisruptionBudget :: A limit on voluntary disruption of a set of pods
Unreachable taint :: A taint added when a node stops reporting
Node object :: The API record of a node
```
