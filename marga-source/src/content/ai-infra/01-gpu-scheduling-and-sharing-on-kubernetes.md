---
title: GPU scheduling and sharing on Kubernetes
minutes: 13
summary: Expose GPUs to pods with the device plugin, share them with time slicing, MIG or MPS, and place workloads with taints, topology and queueing.
---

GPUs are scarce and expensive, and a default pod gets a whole one even if it uses a tenth. Good scheduling and sharing decide how much useful work each GPU hour buys.

## What you will learn

- The device plugin and extended resources
- Whole GPU, time slicing, MIG and MPS
- Taints, node selectors and topology
- Queueing and gang scheduling for training
- Monitoring utilisation

## Device plugin

The NVIDIA device plugin advertises `nvidia.com/gpu` as an extended resource. A pod asks for it in limits and the scheduler places it on a node with free GPUs. GPUs are not overcommitted by default, so one pod requesting one GPU holds the whole device.

## Sharing

Time slicing lets several pods share a GPU in turns with no memory isolation, which suits light inference and development. MIG on supported cards partitions a GPU into isolated slices with their own memory and compute. MPS lets processes share compute concurrently. Choose by isolation needs and by what your cards support.

## Placement

Taint GPU nodes so that only pods that tolerate the taint land on them, and use node selectors or affinity for a card type. For multi GPU jobs, topology matters: GPUs connected by a fast interconnect on the same node perform much better than GPUs across nodes.

## Queues and gangs

A distributed training job needs all its workers at once. Without gang scheduling, half the workers start and wait while holding GPUs. Queue systems such as Kueue or Volcano admit a job only when all resources are available and share quota between teams.

## Monitoring

Export DCGM metrics for GPU utilisation, memory and power. A GPU that is allocated but idle is the most common waste. Alert on allocation with low utilisation over hours and report it per team.

```diagram
title: GPU scheduling and sharing on Kubernetes
node: job | Pod requesting GPU | 0 | 1 | Asks for devices. | Whole GPU for little work. | service
node: sch | Scheduler and queue | 1 | 1 | Places and admits. | Partial gang. | process
node: node | GPU node | 2 | 1 | Device plugin and slices. | Idle device. | service
node: mon | DCGM metrics | 3 | 1 | Utilisation. | Not watched. | observe
edge: job | sch
edge: sch | node
edge: node | mon
```

## Incident: GPUs allocated and idle

> **Incident:** Eight GPUs were reserved for a notebook and used less than five percent for a week.

```console
$ kubectl exec dcgm-exporter-x -- curl -s localhost:9400/metrics | grep DCGM_FI_DEV_GPU_UTIL | head -2
DCGM_FI_DEV_GPU_UTIL{gpu="0",pod="nb-ana"} 3
DCGM_FI_DEV_GPU_UTIL{gpu="1",pod="nb-ana"} 0
(this is a simulated illustration, not a real incident)
```

The notebook held its GPUs between experiments. The team moved light work to time sliced GPUs, added an idle culler that releases notebooks after two hours and published per team utilisation so owners could see the waste.

## Common mistakes

- Giving whole GPUs to light workloads
- No taints so CPU pods land on GPU nodes
- Starting partial training jobs without gang scheduling
- Mixing isolation levels without understanding them
- Never watching utilisation

```quiz
Q: How does a pod request a GPU?
+ As an extended resource in limits
- By node name only :: Not the method.
- By image tag :: No.
- By a label :: No.
> nvidia.com/gpu.

Q: What does MIG provide?
+ Isolated GPU slices with their own memory
- Faster disks :: No.
- More memory than exists :: No.
- Free GPUs :: No.
> Hardware partitions.

Q: Why use gang scheduling?
+ All workers of a training job must start together
- To save disk :: No.
- To speed DNS :: No.
- To reduce logs :: No.
> Avoid idle waiting workers.

Q: What is a common GPU waste?
+ Allocated but idle devices
- Too many labels :: No.
- Short names :: No.
- Small images :: No.
> Measure utilisation.
```

```cards
Device plugin :: A component that advertises hardware to the kubelet
MIG :: Multi-instance GPU, hardware partitioning
Time slicing :: Sharing a GPU by taking turns
Gang scheduling :: Starting all parts of a job together or not at all
```
