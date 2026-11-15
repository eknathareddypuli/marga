---
title: Controllers: the reconcile loop and leader election
minutes: 12
summary: Learn how controllers drive the cluster toward the desired state with informers, work queues and reconcile loops, and how leader election keeps one active copy.
---

Kubernetes is a set of control loops. You declare what you want, and controllers keep comparing it with what exists and acting on the difference. When something does not scale, restart or clean up, the explanation is almost always in a controller, so it is worth knowing how they work.

## What you will learn

- The observe, compare, act loop and level-triggered design
- Informers, caches and work queues
- The built-in controllers and the controller manager
- Owner references and garbage collection
- Leader election with Leases

## Level-triggered control

A controller does not react to each event as a command. It reads the current desired state and the current actual state and acts to close the gap. If it misses an event or restarts, it simply looks again, so the system recovers by design. This is why Kubernetes objects have a spec for what you want and a status for what exists.

## Informers and work queues

A controller uses an informer to list and watch a resource type and keep a local cache. Changes put the object key into a rate limited work queue. A worker takes a key, reads the object from the cache, reconciles, and either finishes or requeues with backoff. Using the cache keeps load off the API server.

## The controller manager

The kube-controller-manager runs many controllers in one process: the Deployment, ReplicaSet, Job, Node, Endpoints and ServiceAccount controllers, among others. A Deployment controller creates ReplicaSets, a ReplicaSet controller creates pods, and so on, so a single scale request fans out through several loops. The cloud-controller-manager does the same for cloud specific resources such as load balancers and node lifecycle.

## Owner references and garbage collection

Objects created by a controller carry an ownerReference to their parent. When the parent is deleted, the garbage collector deletes dependents, in background by default or foreground if requested. That is why deleting a Deployment removes its pods, and why an orphaned object may point to an owner that no longer exists.

## Leader election

Control plane components usually run more than one copy for availability, but only one controller manager or scheduler may act at a time. Each copy tries to hold a Lease object in kube-system, renewing it before it expires. The holder is the leader. If it stops renewing, another copy takes over after the lease duration.

```bash
kubectl get lease -n kube-system kube-controller-manager -o jsonpath='{.spec.holderIdentity}{"\n"}'
kubectl get lease -n kube-system
```

```diagram
title: Controllers: the reconcile loop and leader election
node: spec | Desired state | 0 | 1 | Written by users. | Wrong spec. | store
node: inf | Informer cache | 1 | 1 | Watches and caches. | Stale cache. | store
node: q | Work queue | 2 | 1 | Rate limited keys. | Hot loop. | process
node: rec | Reconcile | 3 | 1 | Closes the gap. | Error loops. | process
node: act | Act via API | 4 | 1 | Creates or deletes objects. | Permission denied. | service
edge: spec | inf
edge: inf | q
edge: q | rec
edge: rec | act
```

## Incident: Leader flapping on a loaded control plane

> **Incident:** The controller manager kept changing leaders, and deployments scaled slowly.

```console
$ kubectl get lease -n kube-system kube-controller-manager -o jsonpath='{.spec.leaseTransitions}'
187
$ kubectl logs -n kube-system -l component=kube-controller-manager --tail=3
E1114 08:12:01 leaderelection.go:332] error retrieving resource lock kube-system/kube-controller-manager: context deadline exceeded
(this is a simulated illustration, not a real incident)
```

The active controller could not renew its Lease because API requests to the server were slow, so it lost leadership, and another copy had to start its caches before acting. Each transition delayed reconciliation. The cause was an overloaded API server with a slow etcd disk. Fixing the storage latency stopped the flapping. Leader election problems usually point to slow API or etcd rather than a bug in the controller.

## Common mistakes

- Expecting controllers to act on a single event rather than on state
- Editing a ReplicaSet owned by a Deployment and expecting it to stick
- Ignoring leaseTransitions as a health signal
- Deleting an owner without checking the dependents
- Running controllers that write every second without backoff

```quiz
Q: What does a level-triggered controller do after a restart?
+ Reads current and desired state again and acts on the difference
- Replays every missed event :: It does not need to.
- Waits for a human :: It is automatic.
- Deletes all objects :: It does not.
> The system converges from state, not from a log of events.

Q: What creates the pods for a Deployment?
+ The ReplicaSet controller, through a ReplicaSet the Deployment controller made
- The scheduler :: It only places pods.
- The kubelet :: It runs pods.
- kubectl :: It only sends requests.
> Controllers form a chain.

Q: How is leader election implemented for control plane components?
+ By holding and renewing a Lease object
- By a DNS record :: Not used.
- By the node with the lowest IP :: Not used.
- By random choice each minute :: Not used.
> The holder renews the Lease before it expires.

Q: What happens to dependents when an owner is deleted?
+ The garbage collector deletes them
- They are kept forever :: Owner references drive cleanup.
- They are moved to another namespace :: That does not happen.
- They are scaled to zero :: They are deleted.
> ownerReferences drive cascading deletion.
```

```cards
Reconcile loop :: Compare desired and actual state, then act to close the gap
Informer :: A client component that lists, watches and caches a resource
ownerReference :: A link from an object to the one that owns it
Lease :: An object used for leader election and node heartbeats
Garbage collector :: The controller that deletes dependents of deleted owners
```
