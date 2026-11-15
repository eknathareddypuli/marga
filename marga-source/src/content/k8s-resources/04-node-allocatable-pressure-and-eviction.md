---
title: Node allocatable, pressure and eviction
minutes: 12
summary: Learn how node capacity becomes allocatable, how the kubelet detects memory, disk and PID pressure and which pods it evicts.
---

A node never gives pods all of its capacity. Some is reserved for the system and some is a safety margin. When the margin is used up, the kubelet evicts pods to protect the node, and knowing its rules explains which pods go first.

## What you will learn

- Capacity, allocatable and the reservations in between
- Eviction signals and thresholds
- Soft and hard eviction and the order of victims
- Disk pressure and image garbage collection
- Reading node conditions

## Allocatable

Capacity is what the machine has. Allocatable is what is left for pods after `kube-reserved` for Kubernetes daemons, `system-reserved` for the operating system and the hard eviction threshold. The scheduler works with allocatable. Without reservations, pods can starve the kubelet and the node may fall over before eviction helps.

## Signals and thresholds

The kubelet watches memory.available, nodefs.available, imagefs.available, nodefs.inodesFree and pid availability. Hard thresholds trigger immediate eviction, for example memory.available below 100Mi. Soft thresholds have a grace period and trigger graceful eviction. When a signal passes its threshold, the node reports a pressure condition such as MemoryPressure, and new BestEffort pods are not scheduled there.

## Choosing victims

Under memory pressure the kubelet ranks pods by whether they exceed their requests, then by priority, then by how much they exceed. BestEffort and Burstable pods over request go first. Guaranteed pods and those below their request are protected. Evicted pods are marked Failed with reason Evicted, and a controller recreates them elsewhere.

## Disk

Disk pressure comes from container logs, images, writable layers and emptyDir volumes. The kubelet garbage collects unused images and dead containers when disk use crosses a threshold, then evicts pods if that is not enough. Set ephemeral storage requests and limits, rotate logs and avoid writing large files in containers.

```bash
kubectl describe node worker-2 | sed -n '/Conditions/,/Addresses/p'
kubectl get pods -A --field-selector=status.phase=Failed | grep Evicted | head
df -h /var/lib/containerd /var/lib/kubelet
```

## Tuning

Set reservations from measurement and leave them in place on every node pool. Alert on pressure conditions and eviction counts. Clean up Evicted pods, which stay until deleted. Prefer fixing the workload that exceeds its requests over raising thresholds.

```diagram
title: Node allocatable, pressure and eviction
node: cap | Capacity | 0 | 1 | Machine size. | Not reserved. | store
node: alloc | Allocatable | 1 | 1 | What pods can use. | Too generous. | store
node: sig | Eviction signals | 2 | 1 | Memory, disk, PIDs. | Late. | observe
node: ev | Eviction | 3 | 1 | Chosen by QoS and usage. | Wrong pods hit. | process
edge: cap | alloc
edge: alloc | sig
edge: sig | ev
```

## Incident: A disk that filled with logs

> **Incident:** A node began evicting pods one after another overnight.

```console
$ kubectl describe node worker-2 | grep -E "DiskPressure|Evicted"
  DiskPressure     True    KubeletHasDiskPressure   kubelet has disk pressure
$ du -sh /var/log/pods | tail -1
38G     /var/log/pods
(this is a simulated illustration, not a real incident)
```

A chatty application wrote gigabytes of logs without rotation limits, so the node file system crossed its threshold. The kubelet cleaned images, then evicted pods, including healthy ones. Setting log rotation limits, an ephemeral storage limit on the workload and an alert on disk use prevented a repeat.

## Common mistakes

- Running nodes without kube-reserved and system-reserved
- Ignoring disk and inode pressure
- Raising eviction thresholds instead of fixing the workload
- Leaving Evicted pods in place
- Not setting ephemeral storage limits

```quiz
Q: What is allocatable?
+ Capacity minus reservations and eviction threshold
- All machine memory :: No.
- Only CPU :: No.
- Used memory :: No.
> It is what the scheduler can use.

Q: Which pods does the kubelet protect most under memory pressure?
+ Guaranteed pods and those below their requests
- BestEffort :: First to go.
- Pods with the longest names :: No.
- Pods on the newest image :: No.
> Ranking follows QoS and usage over request.

Q: What is a common cause of DiskPressure?
+ Container logs, images and writable layers
- A new Secret :: No.
- A label :: No.
- A DNS change :: No.
> Logs often grow unnoticed.

Q: What do you do with Evicted pods?
+ Delete them after finding the cause
- Ignore them forever :: They accumulate.
- Reboot the cluster :: No.
- Scale to zero :: No.
> They are objects that stay until removed.
```

```cards
Allocatable :: Node resources available to pods
kube-reserved :: Resources set aside for Kubernetes daemons
Eviction threshold :: The level at which the kubelet starts evicting pods
MemoryPressure :: A node condition for low memory
Image garbage collection :: Removal of unused images to free disk
```
